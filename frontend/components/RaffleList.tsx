"use client";

import { useState } from "react";
import { Loader2, Gift, AlertCircle } from "lucide-react";
import { useRaffles, useRaffleContract } from "@/lib/hooks/useRaffle";
import { RaffleCard } from "./RaffleCard";
import { RaffleDetail } from "./RaffleDetail";
import type { Raffle } from "@/lib/contracts/types";

export function RaffleList() {
  const contract = useRaffleContract();
  const { data: raffles, isLoading, isError } = useRaffles();
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading raffles...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60" />
          <h3 className="text-xl font-bold">Setup Required</h3>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Contract address not configured.
            </p>
            <p className="text-sm text-muted-foreground">
              Please set{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                NEXT_PUBLIC_CONTRACT_ADDRESS
              </code>{" "}
              in your .env file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-8">
        <div className="text-center">
          <p className="text-destructive">
            Failed to load raffles. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (!raffles || raffles.length === 0) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-3">
          <Gift className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold">No Raffles Yet</h3>
          <p className="text-muted-foreground">
            Be the first to create a raffle and let AI choose the winners!
          </p>
        </div>
      </div>
    );
  }

  // Sort raffles: active first, then by creation date (newest first)
  const sortedRaffles = [...raffles].sort((a, b) => {
    if (a.is_resolved !== b.is_resolved) {
      return a.is_resolved ? 1 : -1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRaffles.map((raffle) => (
          <RaffleCard
            key={raffle.id}
            raffle={raffle}
            onViewDetails={setSelectedRaffle}
          />
        ))}
      </div>

      {selectedRaffle && (
        <RaffleDetail
          raffleId={selectedRaffle.id}
          isOpen={!!selectedRaffle}
          onClose={() => setSelectedRaffle(null)}
        />
      )}
    </>
  );
}
