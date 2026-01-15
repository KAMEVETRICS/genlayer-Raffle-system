import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Raffle, Participant, TransactionReceipt } from "./types";

/**
 * Raffle contract class for interacting with the GenLayer Raffle contract
 */
class RaffleContract {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };

    this.client = createClient(config);
  }

  /**
   * Get all raffles from the contract
   * @returns Array of raffles with their details
   */
  async getAllRaffles(): Promise<Raffle[]> {
    try {
      const raffles: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_all_raffles",
        args: [],
      });

      // Convert GenLayer Map structure to typed array
      if (raffles instanceof Map) {
        return Array.from(raffles.entries()).map(([id, raffleData]: any) => {
          const raffleObj = this.mapToObject(raffleData);
          return {
            id,
            ...raffleObj,
          } as Raffle;
        });
      }

      // Handle object response
      if (typeof raffles === "object" && raffles !== null) {
        return Object.entries(raffles).map(([id, raffleData]: any) => {
          const raffleObj =
            raffleData instanceof Map
              ? this.mapToObject(raffleData)
              : raffleData;
          return {
            id,
            ...raffleObj,
          } as Raffle;
        });
      }

      return [];
    } catch (error) {
      console.error("Error fetching raffles:", error);
      throw new Error("Failed to fetch raffles from contract");
    }
  }

  /**
   * Get a specific raffle by ID
   * @param raffleId - ID of the raffle
   * @returns Raffle details
   */
  async getRaffle(raffleId: string): Promise<Raffle> {
    try {
      const raffle: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_raffle",
        args: [raffleId],
      });

      const raffleObj =
        raffle instanceof Map ? this.mapToObject(raffle) : raffle;
      return raffleObj as Raffle;
    } catch (error) {
      console.error("Error fetching raffle:", error);
      throw new Error("Failed to fetch raffle from contract");
    }
  }

  /**
   * Get participants for a raffle
   * @param raffleId - ID of the raffle
   * @returns Record of participants keyed by username
   */
  async getParticipants(raffleId: string): Promise<Record<string, Participant>> {
    try {
      const participants: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_participants",
        args: [raffleId],
      });

      // Convert GenLayer Map structure to typed object
      if (participants instanceof Map) {
        const result: Record<string, Participant> = {};
        for (const [username, participantData] of participants.entries()) {
          const participantObj = this.mapToObject(participantData);
          result[username] = participantObj as Participant;
        }
        return result;
      }

      // Handle object response
      if (typeof participants === "object" && participants !== null) {
        const result: Record<string, Participant> = {};
        for (const [username, participantData] of Object.entries(participants)) {
          const participantObj =
            (participantData as any) instanceof Map
              ? this.mapToObject(participantData as Map<string, any>)
              : participantData;
          result[username] = participantObj as Participant;
        }
        return result;
      }

      return {};
    } catch (error) {
      console.error("Error fetching participants:", error);
      throw new Error("Failed to fetch participants from contract");
    }
  }

  /**
   * Get winners for a raffle
   * @param raffleId - ID of the raffle
   * @returns Array of winning usernames
   */
  async getWinners(raffleId: string): Promise<string[]> {
    try {
      const winners: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_winners",
        args: [raffleId],
      });

      if (Array.isArray(winners)) {
        return winners;
      }

      return [];
    } catch (error) {
      console.error("Error fetching winners:", error);
      throw new Error("Failed to fetch winners from contract");
    }
  }

  /**
   * Check if a username is already taken
   * @param username - Username to check
   * @returns True if username is taken
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    try {
      const isTaken = await this.client.readContract({
        address: this.contractAddress,
        functionName: "is_username_taken",
        args: [username],
      });

      return Boolean(isTaken);
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  }

  /**
   * Get participant count for a raffle
   * @param raffleId - ID of the raffle
   * @returns Number of participants
   */
  async getParticipantCount(raffleId: string): Promise<number> {
    try {
      const count = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_participant_count",
        args: [raffleId],
      });

      return Number(count) || 0;
    } catch (error) {
      console.error("Error fetching participant count:", error);
      return 0;
    }
  }

  /**
   * Create a new raffle
   * @param reason - Reason/theme for the raffle
   * @param prize - What's up for grabs
   * @param numWinners - Number of winners
   * @param endDate - End date for the raffle
   * @returns Transaction receipt
   */
  async createRaffle(
    reason: string,
    prize: string,
    numWinners: number,
    endDate: string
  ): Promise<TransactionReceipt> {
    try {
      const createdAt = new Date().toISOString();

      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_raffle",
        args: [reason, prize, numWinners, createdAt, endDate],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating raffle:", error);
      throw new Error("Failed to create raffle");
    }
  }

  /**
   * Enter a raffle
   * @param raffleId - ID of the raffle to enter
   * @param username - Unique username
   * @param reason - Reason for participating
   * @returns Transaction receipt
   */
  async enterRaffle(
    raffleId: string,
    username: string,
    reason: string
  ): Promise<TransactionReceipt> {
    try {
      const entryTimestamp = new Date().toISOString();

      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "enter_raffle",
        args: [raffleId, username, reason, entryTimestamp],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error entering raffle:", error);
      throw new Error("Failed to enter raffle");
    }
  }

  /**
   * Select winners for a raffle (creator only)
   * @param raffleId - ID of the raffle
   * @returns Transaction receipt
   */
  async selectWinners(raffleId: string): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "select_winners",
        args: [raffleId],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error selecting winners:", error);
      throw new Error("Failed to select winners");
    }
  }

  /**
   * Helper to convert Map to plain object
   */
  private mapToObject(map: any): Record<string, any> {
    if (!(map instanceof Map)) {
      return map;
    }

    const obj: Record<string, any> = {};
    for (const [key, value] of map.entries()) {
      if (value instanceof Map) {
        obj[key] = this.mapToObject(value);
      } else if (Array.isArray(value)) {
        obj[key] = value.map((item) =>
          item instanceof Map ? this.mapToObject(item) : item
        );
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }
}

export default RaffleContract;
