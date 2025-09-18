import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { UserPlus } from "lucide-react";


interface JoinPlanModalProps {
  planName: string;
  planId: string;
  open: boolean;
  onClose: () => void;
}

export const JoinPlanModal = ({ planName, planId, open, onClose }: JoinPlanModalProps) => {
  const { toast } = useToast();
  const isConnected = true;
  const [sponsor, setSponsor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!sponsor.trim()) {
      toast({
        title: "Sponsor required",
        description: "Please enter the name of a member who can vouch for you",
        variant: "destructive",
      });
      return;
    }

    if (!false) {
      toast({
        title: "You are not signed in",
        description: "Please sign in",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate blockchain transaction for join request
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Join request submitted!",
      description: `Your request to join ${planName} has been submitted. Members will now vote on your request.`,
    });
    setIsSubmitting(false);
    onClose();
    navigate('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request to Join Group</DialogTitle>
          <DialogDescription>
            To join "{planName}", you need to be vouched for by an existing member.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sponsor">Sponsor (Existing Member)</Label>
            <Input
              id="sponsor"
              placeholder="Enter name of an existing member who knows you"
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
            />
            <p className="text-sm text-gray-500">This member will be notified to vouch for you.</p>
          </div>

          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <UserPlus className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Membership Process</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>1. Submit your join request with a sponsor</p>
                  <p>2. Existing members will vote on your request</p>
                  <p>3. You need majority approval to join</p>
                  <p>4. You'll be notified once approved</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinPlanModal;
