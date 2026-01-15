# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Participant:
    username: str
    reason: str
    entry_timestamp: str
    is_winner: bool


@allow_storage
@dataclass
class Raffle:
    id: str
    creator: Address
    reason: str
    num_winners: u32
    created_at: str
    end_date: str
    is_resolved: bool


class RaffleContract(gl.Contract):
    raffles: TreeMap[str, Raffle]
    participants: TreeMap[str, TreeMap[str, Participant]]
    winners: TreeMap[str, TreeMap[str, str]]  # raffle_id -> (index -> username)
    username_registry: TreeMap[str, str]  # username -> raffle_id
    raffle_counter: u256

    def __init__(self):
        self.raffle_counter = 0

    def _select_winners_with_llm(self, raffle_id: str) -> list:
        raffle = self.raffles[raffle_id]
        participants_map = self.participants[raffle_id]

        # Build participant list for prompt
        participant_list = []
        for username, participant in participants_map.items():
            participant_list.append({
                "username": username,
                "reason": participant.reason
            })

        # Select minimum of num_winners and actual participant count
        participant_count = len(participant_list)
        num_winners = min(raffle.num_winners, participant_count)
        raffle_reason = raffle.reason

        def get_winners() -> str:
            prompt = f"""You are a fair raffle judge. Your task is to select {num_winners} winner(s) from the participants based on how well their reasons align with the raffle's purpose.

RAFFLE PURPOSE/THEME:
{raffle_reason}

PARTICIPANTS:
{json.dumps(participant_list, indent=2)}

SELECTION CRITERIA:
1. Choose participants whose reasons best match or complement the raffle's purpose
2. Consider creativity, relevance, and sincerity in the reasons
3. If reasons are equally good, you may use your judgment
4. Select exactly {num_winners} winner(s)

Respond in JSON format:
{{
    "winners": ["username1", "username2", ...]
}}

IMPORTANT: Respond ONLY with valid JSON, no other text. The winners array must contain exactly {num_winners} username(s) from the participants list.
"""
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(gl.eq_principle.strict_eq(get_winners))
        return result_json["winners"]

    @gl.public.write
    def create_raffle(
        self,
        reason: str,
        num_winners: int,
        created_at: str,
        end_date: str
    ) -> str:
        if num_winners < 1:
            raise Exception("Must have at least 1 winner")

        if not reason.strip():
            raise Exception("Reason cannot be empty")

        if not end_date.strip():
            raise Exception("End date cannot be empty")

        self.raffle_counter += 1
        raffle_id = str(self.raffle_counter)

        raffle = Raffle(
            id=raffle_id,
            creator=gl.message.sender_address,
            reason=reason,
            num_winners=num_winners,
            created_at=created_at,
            end_date=end_date,
            is_resolved=False
        )

        self.raffles[raffle_id] = raffle
        self.participants.get_or_insert_default(raffle_id)
        self.winners.get_or_insert_default(raffle_id)

        return raffle_id

    @gl.public.write
    def enter_raffle(
        self,
        raffle_id: str,
        username: str,
        reason: str,
        entry_timestamp: str
    ) -> None:
        if raffle_id not in self.raffles:
            raise Exception("Raffle not found")

        raffle = self.raffles[raffle_id]

        if raffle.is_resolved:
            raise Exception("Raffle already resolved")

        if not username.strip():
            raise Exception("Username cannot be empty")

        if not reason.strip():
            raise Exception("Reason cannot be empty")

        # Check global username uniqueness
        if username in self.username_registry:
            raise Exception("Username already taken")

        participant = Participant(
            username=username,
            reason=reason,
            entry_timestamp=entry_timestamp,
            is_winner=False
        )

        self.participants[raffle_id][username] = participant
        self.username_registry[username] = raffle_id

    @gl.public.write
    def select_winners(self, raffle_id: str) -> None:
        if raffle_id not in self.raffles:
            raise Exception("Raffle not found")

        raffle = self.raffles[raffle_id]

        if gl.message.sender_address != raffle.creator:
            raise Exception("Only creator can select winners")

        if raffle.is_resolved:
            raise Exception("Raffle already resolved")

        participants_map = self.participants[raffle_id]
        participant_count = 0
        for _ in participants_map.items():
            participant_count += 1

        if participant_count < 1:
            raise Exception("Need at least 1 participant to select winners")

        # Use LLM to select winners (will select min of num_winners and participant_count)
        selected_winners = self._select_winners_with_llm(raffle_id)

        # Mark winners and store in winners map
        winners_map = self.winners[raffle_id]
        winner_index = 0
        for winner_username in selected_winners:
            if winner_username in participants_map:
                participants_map[winner_username].is_winner = True
                winners_map[str(winner_index)] = winner_username
                winner_index += 1

        raffle.is_resolved = True

    @gl.public.view
    def get_all_raffles(self) -> dict:
        result = {}
        for raffle_id, raffle in self.raffles.items():
            # Get winners list
            winners_list = []
            if raffle_id in self.winners:
                for _, username in self.winners[raffle_id].items():
                    winners_list.append(username)

            result[raffle_id] = {
                "id": raffle.id,
                "creator": raffle.creator.as_hex,
                "reason": raffle.reason,
                "num_winners": raffle.num_winners,
                "created_at": raffle.created_at,
                "end_date": raffle.end_date,
                "is_resolved": raffle.is_resolved,
                "winners": winners_list
            }
        return result

    @gl.public.view
    def get_raffle(self, raffle_id: str) -> dict:
        if raffle_id not in self.raffles:
            raise Exception("Raffle not found")

        raffle = self.raffles[raffle_id]

        # Get winners list
        winners_list = []
        if raffle_id in self.winners:
            for _, username in self.winners[raffle_id].items():
                winners_list.append(username)

        return {
            "id": raffle.id,
            "creator": raffle.creator.as_hex,
            "reason": raffle.reason,
            "num_winners": raffle.num_winners,
            "created_at": raffle.created_at,
            "end_date": raffle.end_date,
            "is_resolved": raffle.is_resolved,
            "winners": winners_list
        }

    @gl.public.view
    def get_participants(self, raffle_id: str) -> dict:
        if raffle_id not in self.raffles:
            raise Exception("Raffle not found")

        raffle = self.raffles[raffle_id]
        result = {}

        for username, participant in self.participants[raffle_id].items():
            result[username] = {
                "username": participant.username,
                "reason": participant.reason if raffle.is_resolved else "[Hidden until resolved]",
                "entry_timestamp": participant.entry_timestamp,
                "is_winner": participant.is_winner
            }

        return result

    @gl.public.view
    def get_winners(self, raffle_id: str) -> list:
        if raffle_id not in self.raffles:
            raise Exception("Raffle not found")

        raffle = self.raffles[raffle_id]
        if not raffle.is_resolved:
            return []

        winners_list = []
        if raffle_id in self.winners:
            for _, username in self.winners[raffle_id].items():
                winners_list.append(username)

        return winners_list

    @gl.public.view
    def is_username_taken(self, username: str) -> bool:
        return username in self.username_registry

    @gl.public.view
    def get_participant_count(self, raffle_id: str) -> int:
        if raffle_id not in self.raffles:
            raise Exception("Raffle not found")

        count = 0
        for _ in self.participants[raffle_id].items():
            count += 1
        return count
