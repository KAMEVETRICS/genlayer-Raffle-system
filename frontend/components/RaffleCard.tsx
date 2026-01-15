"use client";

import { useState } from "react";
import {
  Calendar,
  Users,
  Trophy,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import {
  useParticipantCount,
  useSelectWinners,
} from "@/lib/hooks/useRaffle";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { EnterRaffleModal } from "./EnterRaffleModal";
import { type Raffle, isRaffleEnded } from "@/lib/contracts/types";

interface RaffleCardProps {
  raffle: Raffle;
  onViewDetails?: (raffle: Raffle) => void;
}

export function RaffleCard({ raffle, onViewDetails }: RaffleCardProps) {
  const { address, isConnected } = useWallet();
  const { data: participantCount = 0 } = useParticipantCount(raffle.id);
  const { selectWinners, isSelecting, selectingRaffleId } = useSelectWinners();

  const [isEnterModalOpen, setIsEnterModalOpen] = useState(false);

  const isCreator = address?.toLowerCase() === raffle.creator?.toLowerCase();
  const isResolved = raffle.is_resolved;
  const isEnded = isRaffleEnded(raffle.end_date);
  const numWinners = Number(raffle.num_winners);
  const canSelectWinners =
    isConnected && isCreator && !isResolved && participantCount >= 1;
  const isSelectingThis = isSelecting && selectingRaffleId === raffle.id;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleSelectWinners = () => {
    const confirmed = confirm(
      "Are you sure you want to select winners? The AI will choose winners based on how well participant reasons match your raffle theme. This action cannot be undone."
    );
    if (confirmed) {
      selectWinners(raffle.id);
    }
  };

  return (
    <>
      <div className="brand-card p-6 space-y-4 hover:border-accent/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isResolved ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-2">
                <Trophy className="w-3 h-3 mr-1" />
                Resolved
              </Badge>
            ) : isEnded ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-2">
                <Clock className="w-3 h-3 mr-1" />
                Ended
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-yellow-400 border-yellow-500/30 mb-2"
              >
                <Clock className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            <p className="text-sm text-foreground line-clamp-3">
              {raffle.reason}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{participantCount}</p>
            <p className="text-xs text-muted-foreground">Entries</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Trophy className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold">{numWinners}</p>
            <p className="text-xs text-muted-foreground">Winners</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-sm font-bold">{formatDate(raffle.end_date)}</p>
            <p className="text-xs text-muted-foreground">End Date</p>
          </div>
        </div>

        {/* Winners (if resolved) */}
        {isResolved && raffle.winners.length > 0 && (
          <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-xs font-medium text-accent mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Winners
            </p>
            <div className="flex flex-wrap gap-2">
              {raffle.winners.map((winner) => (
                <Badge
                  key={winner}
                  className="bg-accent/20 text-accent border-accent/30"
                >
                  @{winner}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Creator badge */}
        {isCreator && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              You created this
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!isResolved && !isEnded && !isCreator && isConnected && (
            <Button
              variant="gradient"
              size="sm"
              className="flex-1"
              onClick={() => setIsEnterModalOpen(true)}
            >
              Enter Raffle
            </Button>
          )}

          {canSelectWinners && (
            <Button
              variant="gradient"
              size="sm"
              className="flex-1"
              onClick={handleSelectWinners}
              disabled={isSelectingThis}
            >
              {isSelectingThis ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Selecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Select Winners
                </>
              )}
            </Button>
          )}

          {isCreator && !isResolved && participantCount === 0 && (
            <p className="text-xs text-muted-foreground">
              Need at least 1 participant to select winners
            </p>
          )}

          {isEnded && !isResolved && (
            <p className="text-xs text-red-400">
              Raffle ended - awaiting winner selection
            </p>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails?.(raffle)}
          >
            View Details
          </Button>
        </div>
      </div>

      <EnterRaffleModal
        raffle={raffle}
        isOpen={isEnterModalOpen}
        onClose={() => setIsEnterModalOpen(false)}
      />
    </>
  );
}
