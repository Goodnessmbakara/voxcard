export interface Plan {
  id: string;
  name: string;
  description: string;
  initiator: string;
  totalParticipants: number;
  currentParticipants: number;
  contributionAmount: number;
  maxMembers: number;
  members: string[];
  contributions: any[]; // We can type this more specifically later
  frequency: 'Monthly' | 'Weekly' | 'Daily';
  duration: number;
  totalAmount: number;
  status: 'Open' | 'Closed' | 'Completed';
  trustScoreRequired: number;
  createdAt: Date;
  allowPartial: boolean;
  contractAddress?: string;
  contractTxHash?: string;
}

// In-memory data store (replace with a database in production)
export let plans: Plan[] = []; 