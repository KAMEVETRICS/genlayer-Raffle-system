/**
 * TypeScript types for GenLayer Raffle contract
 */

export interface Raffle {
  id: string;
  creator: string;
  reason: string;
  prize: string;
  num_winners: number;
  created_at: string;
  end_date: string;
  is_resolved: boolean;
  winners: string[];
}

export interface Participant {
  username: string;
  reason: string; // "[Hidden until resolved]" if raffle not resolved
  entry_timestamp: string;
  is_winner: boolean;
}

export interface RaffleWithParticipants extends Raffle {
  participants: Record<string, Participant>;
  participantCount: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}

export interface CreateRaffleParams {
  reason: string;
  prize: string;
  numWinners: number;
  endDate: string;
}

export interface EnterRaffleParams {
  raffleId: string;
  username: string;
  reason: string;
}

/**
 * Check if a raffle has ended based on its end_date
 * Returns true if the current time is past the end_date
 */
export function isRaffleEnded(endDate: string): boolean {
  try {
    const end = new Date(endDate);
    const now = new Date();
    return now > end;
  } catch {
    return false;
  }
}
