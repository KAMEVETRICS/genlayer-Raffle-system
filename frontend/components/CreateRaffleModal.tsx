"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Calendar, Gift, Users, Award } from "lucide-react";
import { useCreateRaffle } from "@/lib/hooks/useRaffle";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreateRaffleModal() {
  const { isConnected, address, isLoading } = useWallet();
  const { createRaffle, isCreating, isSuccess } = useCreateRaffle();

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [prize, setPrize] = useState("");
  const [numWinners, setNumWinners] = useState(1);
  const [endDate, setEndDate] = useState("");

  const [errors, setErrors] = useState({
    reason: "",
    prize: "",
    numWinners: "",
    endDate: "",
  });

  // Auto-close modal when wallet disconnects
  useEffect(() => {
    if (!isConnected && isOpen && !isCreating) {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, isCreating]);

  const validateForm = (): boolean => {
    const newErrors = {
      reason: "",
      prize: "",
      numWinners: "",
      endDate: "",
    };

    if (!reason.trim()) {
      newErrors.reason = "Raffle reason/theme is required";
    } else if (reason.length > 500) {
      newErrors.reason = "Reason must be less than 500 characters";
    }

    if (!prize.trim()) {
      newErrors.prize = "Prize is required";
    } else if (prize.length > 200) {
      newErrors.prize = "Prize must be less than 200 characters";
    }

    if (numWinners < 1) {
      newErrors.numWinners = "Must have at least 1 winner";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const selectedDate = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate <= today) {
        newErrors.endDate = "End date must be in the future";
      }
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

    if (!validateForm()) {
      return;
    }

    createRaffle({
      reason,
      prize,
      numWinners,
      endDate,
    });
  };

  const resetForm = () => {
    setReason("");
    setPrize("");
    setNumWinners(1);
    setEndDate("");
    setErrors({ reason: "", prize: "", numWinners: "", endDate: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      resetForm();
    }
    setIsOpen(open);
  };

  // Reset form and close modal on success
  useEffect(() => {
    if (isSuccess) {
      resetForm();
      setIsOpen(false);
    }
  }, [isSuccess]);

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="gradient"
          disabled={!isConnected || !address || isLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Raffle
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create New Raffle
          </DialogTitle>
          <DialogDescription>
            Set up a raffle and let AI choose the winners based on participant
            reasons
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Raffle Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="flex items-center gap-2">
              <Gift className="w-4 h-4 !text-white" />
              Raffle Theme / Reason
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrors({ ...errors, reason: "" });
              }}
              placeholder="e.g., Looking for creative minds who can explain why they deserve this prize..."
              className={`w-full min-h-[100px] px-3 py-2 rounded-lg bg-white/5 border ${
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

          {/* Prize */}
          <div className="space-y-2">
            <Label htmlFor="prize" className="flex items-center gap-2">
              <Award className="w-4 h-4 !text-white" />
              What&apos;s Up for Grabs?
            </Label>
            <Input
              id="prize"
              type="text"
              value={prize}
              onChange={(e) => {
                setPrize(e.target.value);
                setErrors({ ...errors, prize: "" });
              }}
              placeholder="e.g., $100 USDT, NFT, Merch, etc."
              className={errors.prize ? "border-destructive" : ""}
              maxLength={200}
            />
            {errors.prize && (
              <p className="text-xs text-destructive">{errors.prize}</p>
            )}
          </div>

          {/* Number of Winners */}
          <div className="space-y-2">
            <Label htmlFor="numWinners" className="flex items-center gap-2">
              <Users className="w-4 h-4 !text-white" />
              Number of Winners
            </Label>
            <Input
              id="numWinners"
              type="number"
              min={1}
              max={100}
              value={numWinners}
              onChange={(e) => {
                setNumWinners(parseInt(e.target.value) || 1);
                setErrors({ ...errors, numWinners: "" });
              }}
              className={errors.numWinners ? "border-destructive" : ""}
            />
            {errors.numWinners && (
              <p className="text-xs text-destructive">{errors.numWinners}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 !text-white" />
              Raffle End Date
            </Label>
            <Input
              id="endDate"
              type="date"
              min={getMinDate()}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setErrors({ ...errors, endDate: "" });
              }}
              className={errors.endDate ? "border-destructive" : ""}
            />
            {errors.endDate && (
              <p className="text-xs text-destructive">{errors.endDate}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Raffle"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
