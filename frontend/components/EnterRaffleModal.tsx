"use client";

import { useState, useEffect } from "react";
import { Loader2, User, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { useEnterRaffle, useCheckUsername } from "@/lib/hooks/useRaffle";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { type Raffle, isRaffleEnded } from "@/lib/contracts/types";

interface EnterRaffleModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
}

export function EnterRaffleModal({
  raffle,
  isOpen,
  onClose,
}: EnterRaffleModalProps) {
  const { isConnected, address, isLoading } = useWallet();
  const { enterRaffle, isEntering, isSuccess } = useEnterRaffle();
  const isEnded = isRaffleEnded(raffle.end_date);

  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");

  const [errors, setErrors] = useState({
    username: "",
    reason: "",
  });

  // Check username availability with debounce
  const { data: isUsernameTaken, isLoading: isCheckingUsername } =
    useCheckUsername(username);

  // Auto-close modal when wallet disconnects
  useEffect(() => {
    if (!isConnected && isOpen && !isEntering) {
      onClose();
    }
  }, [isConnected, isOpen, isEntering, onClose]);

  const validateForm = (): boolean => {
    const newErrors = {
      username: "",
      reason: "",
    };

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (username.length > 30) {
      newErrors.username = "Username must be less than 30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    } else if (isUsernameTaken) {
      newErrors.username = "Username is already taken";
    }

    if (!reason.trim()) {
      newErrors.reason = "Reason for participating is required";
    } else if (reason.length > 500) {
      newErrors.reason = "Reason must be less than 500 characters";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }

    if (isEnded) {
      error("This raffle has ended. You can no longer enter.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    enterRaffle({
      raffleId: raffle.id,
      username,
      reason,
    });
  };

  const resetForm = () => {
    setUsername("");
    setReason("");
    setErrors({ username: "", reason: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isEntering) {
      resetForm();
      onClose();
    }
  };

  // Reset form and close modal on success
  useEffect(() => {
    if (isSuccess) {
      resetForm();
      onClose();
    }
  }, [isSuccess, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="brand-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Enter Raffle</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>Enter your details to participate in this raffle.</p>
              <div className="mt-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-accent">Raffle Theme:</p>
                <p className="text-sm text-foreground mt-1">{raffle.reason}</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="w-4 h-4 !text-white" />
              Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setErrors({ ...errors, username: "" });
                }}
                placeholder="Enter a unique username"
                className={`pr-10 ${errors.username ? "border-destructive" : ""}`}
                maxLength={30}
              />
              {username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUsername ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : isUsernameTaken ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {errors.username ? (
              <p className="text-xs text-destructive">{errors.username}</p>
            ) : username.length >= 3 && !isCheckingUsername ? (
              <p
                className={`text-xs ${
                  isUsernameTaken ? "text-destructive" : "text-green-500"
                }`}
              >
                {isUsernameTaken ? "Username is taken" : "Username is available"}
              </p>
            ) : null}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 !text-white" />
              Why do you deserve to win?
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors({ ...errors, reason: "" });
              }}
              placeholder="Explain why you should be selected as a winner. The AI will match your reason with the raffle theme..."
              className={`w-full min-h-[120px] px-3 py-2 rounded-lg bg-white/5 border ${
                errors.reason ? "border-destructive" : "border-white/10"
              } focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none`}
              maxLength={500}
            />
            <div className="flex justify-between">
              {errors.reason ? (
                <p className="text-xs text-destructive">{errors.reason}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {reason.length}/500
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400">
              <strong>Note:</strong> Your reason will be hidden from other
              participants until the raffle is resolved. The AI will select
              winners based on how well reasons match the raffle theme.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isEntering}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={
                isEntering ||
                isCheckingUsername ||
                isUsernameTaken ||
                !isConnected ||
                isLoading ||
                isEnded
              }
            >
              {isEntering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entering...
                </>
              ) : isEnded ? (
                "Raffle Ended"
              ) : (
                "Enter Raffle"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
