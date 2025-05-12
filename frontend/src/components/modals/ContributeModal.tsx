
import { useState } from 'react';
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
import { useWallet } from "@/contexts/WalletContext";
import { Plan } from '@/lib/mock-data';
import { Check, Coins } from 'lucide-react';

interface ContributeModalProps {
  plan: Plan;
  roundNumber: number;
  open: boolean;
  onClose: () => void;
}

export const ContributeModal = ({ plan, roundNumber, open, onClose }: ContributeModalProps) => {
  const { toast } = useToast();
  const { isConnected, openWalletForTransaction } = useWallet();
  const [amount, setAmount] = useState(plan.contributionAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { // Allow only numbers and a decimal point
      setAmount(value);
    }
  };
  
  // Handle the contribution submission
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
    
    setIsSubmitting(true);
    
    // If the plan doesn't allow partial payments, enforce the full amount
    if (!plan.allowPartial && contributionAmount < plan.contributionAmount) {
      toast({
        title: "Full payment required",
        description: `This plan requires the full contribution amount of ${plan.contributionAmount} ADA`,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // Execute blockchain transaction
    const transactionSuccess = await openWalletForTransaction(
      contributionAmount,
      `Round ${roundNumber} contribution for ${plan.name}`,
      plan.id,
      roundNumber
    );
    
    if (transactionSuccess) {
      toast({
        title: "Contribution successful!",
        description: `You've contributed ${contributionAmount} ADA to round ${roundNumber}`,
      });
      onClose();
    }
    
    setIsSubmitting(false);
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
            <Label htmlFor="amount">Contribution Amount (ADA)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
            />
            {plan.allowPartial && (
              <p className="text-sm text-gray-500">
                This plan allows partial payments. Minimum contribution: 1 ADA
              </p>
            )}
            {!plan.allowPartial && (
              <p className="text-sm text-gray-500">
                This plan requires the full payment of {plan.contributionAmount} ADA
              </p>
            )}
          </div>
          
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Coins className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Contribution Information</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>• Expected contribution: {plan.contributionAmount} ADA</p>
                  <p>• Payment frequency: {plan.frequency.toLowerCase()}</p>
                  {plan.allowPartial && (
                    <p>• Partial payments are allowed</p>
                  )}
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
          <Button onClick={handleContribute} disabled={isSubmitting} className="bg-ajo-primary hover:bg-ajo-secondary text-white">
            {isSubmitting ? 'Processing...' : 'Make Contribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContributeModal;