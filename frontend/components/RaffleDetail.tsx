"use client";

import { Loader2, Trophy, Users, Calendar, Clock, Sparkles, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useRaffle, useParticipants, useSelectWinners } from "@/lib/hooks/useRaffle";
import { useWallet } from "@/lib/genlayer/wallet";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { isRaffleEnded } from "@/lib/contracts/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface RaffleDetailProps {
  raffleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RaffleDetail({ raffleId, isOpen, onClose }: RaffleDetailProps) {
  const { address, isConnected } = useWallet();
  const { data: raffle, isLoading: isLoadingRaffle } = useRaffle(raffleId);
  const { data: participants, isLoading: isLoadingParticipants } = useParticipants(raffleId);
  const { selectWinners, isSelecting, selectingRaffleId } = useSelectWinners();

  const isCreator = address?.toLowerCase() === raffle?.creator?.toLowerCase();
  const isResolved = raffle?.is_resolved;
  const isEnded = raffle ? isRaffleEnded(raffle.end_date) : false;
  const participantCount = participants ? Object.keys(participants).length : 0;
  const numWinners = raffle ? Number(raffle.num_winners) : 0;
  const canSelectWinners =
    isConnected &&
    isCreator &&
    !isResolved &&
    raffle &&
    participantCount >= 1;
  const isSelectingThis = isSelecting && selectingRaffleId === raffleId;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
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
      selectWinners(raffleId);
    }
  };

  if (isLoadingRaffle) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="brand-card border-2 sm:max-w-[600px]">
          <DialogTitle className="sr-only">Loading raffle details</DialogTitle>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!raffle) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="brand-card border-2 sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isResolved ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Trophy className="w-3 h-3 mr-1" />
                Resolved
              </Badge>
            ) : isEnded ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <Clock className="w-3 h-3 mr-1" />
                Ended
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                <Clock className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            {isCreator && (
              <Badge variant="secondary" className="text-xs">
                Your Raffle
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold mt-2">
            Raffle Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Raffle Theme */}
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm font-medium text-accent mb-2">Raffle Theme</p>
            <p className="text-foreground">{raffle.reason}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="brand-card p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{participantCount}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
            <div className="brand-card p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{numWinners}</p>
              <p className="text-xs text-muted-foreground">Winners</p>
            </div>
            <div className="brand-card p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-bold">{formatDate(raffle.created_at)}</p>
              <p className="text-xs text-muted-foreground">Created</p>
            </div>
            <div className="brand-card p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-bold">{formatDate(raffle.end_date)}</p>
              <p className="text-xs text-muted-foreground">End Date</p>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-muted-foreground">Created by</span>
            <AddressDisplay address={raffle.creator} maxLength={16} showCopy />
          </div>

          {/* Winners (if resolved) */}
          {isResolved && raffle.winners.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Winners
              </h3>
              <div className="grid gap-2">
                {raffle.winners.map((winner, index) => {
                  const participant = participants?.[winner];
                  return (
                    <div
                      key={winner}
                      className="p-4 bg-accent/10 rounded-lg border border-accent/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-accent">@{winner}</p>
                          {participant && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {participant.reason}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          #{index + 1}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({participantCount})
            </h3>

            {isLoadingParticipants ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : participantCount === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No participants yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Object.entries(participants || {}).map(([username, participant]) => (
                  <div
                    key={username}
                    className={`p-3 rounded-lg border ${
                      participant.is_winner
                        ? "bg-accent/10 border-accent/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">@{username}</span>
                        {participant.is_winner && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(participant.entry_timestamp)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start gap-2">
                      {isResolved || isEnded ? (
                        <>
                          <Eye className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {participant.reason}
                          </p>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground italic">
                            Reason hidden until raffle ends
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {canSelectWinners && (
            <div className="pt-4 border-t border-white/10">
              <Button
                variant="gradient"
                className="w-full"
                onClick={handleSelectWinners}
                disabled={isSelectingThis}
              >
                {isSelectingThis ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI is selecting winners...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Select Winners with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {isCreator && !isResolved && participantCount === 0 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-400">
                Need at least 1 participant to select winners.
              </p>
            </div>
          )}

          {isEnded && !isResolved && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Raffle has ended</p>
                <p className="text-xs text-red-400/80 mt-1">
                  {isCreator
                    ? "This raffle's end date has passed. Please select winners to resolve it."
                    : "This raffle's end date has passed. Waiting for the creator to select winners."}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
