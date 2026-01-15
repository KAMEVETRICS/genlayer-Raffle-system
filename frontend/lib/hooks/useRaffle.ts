"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import RaffleContract from "../contracts/Raffle";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Raffle, Participant } from "../contracts/types";

/**
 * Hook to get the Raffle contract instance
 *
 * Returns null if contract address is not configured.
 * The contract instance is recreated whenever the wallet address changes.
 */
export function useRaffleContract(): RaffleContract | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }

    return new RaffleContract(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

/**
 * Hook to fetch all raffles
 */
export function useRaffles() {
  const contract = useRaffleContract();

  return useQuery<Raffle[], Error>({
    queryKey: ["raffles"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getAllRaffles();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

/**
 * Hook to fetch a specific raffle
 */
export function useRaffle(raffleId: string | null) {
  const contract = useRaffleContract();

  return useQuery<Raffle | null, Error>({
    queryKey: ["raffle", raffleId],
    queryFn: () => {
      if (!contract || !raffleId) {
        return Promise.resolve(null);
      }
      return contract.getRaffle(raffleId);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!raffleId,
  });
}

/**
 * Hook to fetch participants for a raffle
 */
export function useParticipants(raffleId: string | null) {
  const contract = useRaffleContract();

  return useQuery<Record<string, Participant>, Error>({
    queryKey: ["participants", raffleId],
    queryFn: () => {
      if (!contract || !raffleId) {
        return Promise.resolve({});
      }
      return contract.getParticipants(raffleId);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!raffleId,
  });
}

/**
 * Hook to fetch winners for a raffle
 */
export function useWinners(raffleId: string | null) {
  const contract = useRaffleContract();

  return useQuery<string[], Error>({
    queryKey: ["winners", raffleId],
    queryFn: () => {
      if (!contract || !raffleId) {
        return Promise.resolve([]);
      }
      return contract.getWinners(raffleId);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!raffleId,
  });
}

/**
 * Hook to check if a username is taken
 */
export function useCheckUsername(username: string) {
  const contract = useRaffleContract();

  return useQuery<boolean, Error>({
    queryKey: ["checkUsername", username],
    queryFn: () => {
      if (!contract || !username.trim()) {
        return Promise.resolve(false);
      }
      return contract.isUsernameTaken(username);
    },
    staleTime: 1000,
    enabled: !!contract && username.trim().length > 0,
  });
}

/**
 * Hook to get participant count for a raffle
 */
export function useParticipantCount(raffleId: string | null) {
  const contract = useRaffleContract();

  return useQuery<number, Error>({
    queryKey: ["participantCount", raffleId],
    queryFn: () => {
      if (!contract || !raffleId) {
        return Promise.resolve(0);
      }
      return contract.getParticipantCount(raffleId);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!raffleId,
  });
}

/**
 * Hook to create a new raffle
 */
export function useCreateRaffle() {
  const contract = useRaffleContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      reason,
      prize,
      numWinners,
      endDate,
    }: {
      reason: string;
      prize: string;
      numWinners: number;
      endDate: string;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet to create a raffle."
        );
      }
      setIsCreating(true);
      return contract.createRaffle(reason, prize, numWinners, endDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raffles"] });
      setIsCreating(false);
      success("Raffle created successfully!", {
        description: "Your raffle is now live and accepting entries.",
      });
    },
    onError: (err: any) => {
      console.error("Error creating raffle:", err);
      setIsCreating(false);
      error("Failed to create raffle", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createRaffle: mutation.mutate,
    createRaffleAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to enter a raffle
 */
export function useEnterRaffle() {
  const contract = useRaffleContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isEntering, setIsEntering] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      raffleId,
      username,
      reason,
    }: {
      raffleId: string;
      username: string;
      reason: string;
    }) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet to enter the raffle."
        );
      }
      setIsEntering(true);
      return contract.enterRaffle(raffleId, username, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["raffles"] });
      queryClient.invalidateQueries({
        queryKey: ["participants", variables.raffleId],
      });
      queryClient.invalidateQueries({
        queryKey: ["participantCount", variables.raffleId],
      });
      queryClient.invalidateQueries({ queryKey: ["checkUsername"] });
      setIsEntering(false);
      success("Entered raffle successfully!", {
        description: "Good luck! Winners will be selected by AI.",
      });
    },
    onError: (err: any) => {
      console.error("Error entering raffle:", err);
      setIsEntering(false);
      error("Failed to enter raffle", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isEntering,
    enterRaffle: mutation.mutate,
    enterRaffleAsync: mutation.mutateAsync,
  };
}

/**
 * Hook to select winners (creator only)
 */
export function useSelectWinners() {
  const contract = useRaffleContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectingRaffleId, setSelectingRaffleId] = useState<string | null>(
    null
  );

  const mutation = useMutation({
    mutationFn: async (raffleId: string) => {
      if (!contract) {
        throw new Error(
          "Contract not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
        );
      }
      if (!address) {
        throw new Error(
          "Wallet not connected. Please connect your wallet to select winners."
        );
      }
      setIsSelecting(true);
      setSelectingRaffleId(raffleId);
      return contract.selectWinners(raffleId);
    },
    onSuccess: (_, raffleId) => {
      queryClient.invalidateQueries({ queryKey: ["raffles"] });
      queryClient.invalidateQueries({ queryKey: ["raffle", raffleId] });
      queryClient.invalidateQueries({ queryKey: ["participants", raffleId] });
      queryClient.invalidateQueries({ queryKey: ["winners", raffleId] });
      setIsSelecting(false);
      setSelectingRaffleId(null);
      success("Winners selected successfully!", {
        description: "The AI has chosen the winners based on their reasons.",
      });
    },
    onError: (err: any) => {
      console.error("Error selecting winners:", err);
      setIsSelecting(false);
      setSelectingRaffleId(null);
      error("Failed to select winners", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSelecting,
    selectingRaffleId,
    selectWinners: mutation.mutate,
    selectWinnersAsync: mutation.mutateAsync,
  };
}
