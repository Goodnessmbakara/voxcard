import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plan } from "@/types/utils";
import { Coins } from "lucide-react";
import XionWalletService from "@/services/blockchain";
import { useContract } from "@/services/contract";
import { Switch } from "@/components/ui/switch";

interface ContributeModalProps {
  plan: Plan;
  roundNumber: number;
  open: boolean;
  onClose: () => void;
}

export const ContributeModal = ({
  plan,
  roundNumber,
  open,
  onClose,
}: ContributeModalProps) => {
  const { toast } = useToast();
  const { isConnected } = XionWalletService.useWallet();
  const contractService = useContract();

  const [amount, setAmount] = useState(String(plan.contribution_amount));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGasless, setUseGasless] = useState(false);
  const [isGaslessAvailable, setIsGaslessAvailable] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(String(plan.contribution_amount)); // Reset amount when modal opens
      const checkGaslessAvailability = async () => {
        try {
          const available = await contractService.isGaslessAvailable(plan.id);
          setIsGaslessAvailable(available);
        } catch (error) {
          console.error("Error checking gasless availability:", error);
          setIsGaslessAvailable(false);
        }
      };
      checkGaslessAvailability();
    }
  }, [open, plan.id, plan.contribution_amount, contractService]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleContribute = async () => {
    const contributionAmount = parseFloat(amount);

    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!plan.allow_partial && contributionAmount < Number(plan.contribution_amount)) {
      toast({
        title: "Full payment required",
        description: `This plan requires the full contribution amount of ${plan.contribution_amount} XION`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await contractService.submitContribution(
        plan.id,
        contributionAmount,
        roundNumber,
        useGasless
      );

      toast({
        title: "Contribution submitted",
        description: `Transaction hash: ${result.txHash}`,
      });

      onClose();
    } catch (error) {
      console.error("Error submitting contribution:", error);
      toast({
        title: "Error",
        description: "Failed to submit contribution. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Contribution</DialogTitle>
          <DialogDescription>
            Round {roundNumber} contribution for "{plan.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount (XION)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
            />
            {plan.allow_partial ? (
              <p className="text-sm text-gray-500">
                Partial payments allowed. Minimum contribution: 1 XION
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Full payment required: {plan.contribution_amount} XION
              </p>
            )}
          </div>

          {isGaslessAvailable && (
            <div className="flex items-center space-x-2">
              <Switch
                id="gasless"
                checked={useGasless}
                onCheckedChange={setUseGasless}
              />
              <Label htmlFor="gasless">Use gasless transaction</Label>
            </div>
          )}

          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Coins className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Contribution Information
                </h3>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>• Expected contribution: {plan.contribution_amount} XION</p>
                  <p>• Payment frequency: {plan.frequency.toLowerCase()}</p>
                  {plan.allow_partial && <p>• Partial payments are allowed</p>}
                  <p>• Your contribution will be locked in a smart contract</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleContribute}
            disabled={isSubmitting}
            className="bg-ajo-primary hover:bg-ajo-secondary text-white"
          >
            {isSubmitting ? "Processing..." : "Make Contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContributeModal;
