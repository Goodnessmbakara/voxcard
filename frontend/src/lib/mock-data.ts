
  
  export interface User {
    id: string;
    name: string;
    walletAddress: string;
    trustScore: number;
    plans: string[]; // plan IDs
  }
  
  export interface Contribution {
    id: string;
    planId: string;
    userId: string;
    amount: number;
    date: Date;
    roundNumber: number;
  }
  
  export interface Payout {
    id: string;
    planId: string;
    recipientId: string;
    amount: number;
    scheduledDate: Date;
    status: 'Scheduled' | 'Completed' | 'Failed';
    roundNumber: number;
  }
  
  // Generate mock plans
  export const mockPlans: Plan[] = [
    {
      id: 'plan-1',
      name: 'Community Savings Circle',
      description: 'A monthly saving plan for our local community members.',
      created_by: 'Ahmed',
      total_participants: 12,
      participants: 8,
      members: ['user-1', 'user-2'],
      contribution_amount: 100,
      contributions: ['contrib-1', 'contrib-2'],
      max_members: 12,
      frequency: 'Monthly',
      duration_months: 12,
      totalAmount: 12 * 100 * 12,
      status: 'Open',
      trustScoreRequired: 75,
      created_at: new Date('2025-04-01'),
      allowPartial: true,
    },
    {
      id: 'plan-2',
      name: 'Business Investment Pool',
      description: 'Weekly contributions to help members start small businesses.',
      created_by: 'Ngozi',
      total_participants: 8,
      max_members: 8,
      contributions: ['contrib-3', 'contrib-4'],
      members: ['user-1', 'user-2'],
      participants: 8,
      contribution_amount: 50,
      frequency: 'Weekly',
      duration_months: 6,
      totalAmount: 6 * 4 * 50 * 8,
      status: 'Active',
      trustScoreRequired: 85,
      created_at: new Date('2025-03-15'),
      allowPartial: false,
    },
    {
      id: 'plan-3',
      name: 'Emergency Fund Group',
      description: 'A safety net for unexpected expenses among friends.',
      created_by: 'Kofi',
      total_participants: 6,
      participants: 4,
      contributions: ['contrib-3', 'contrib-4'],
      contribution_amount: 75,
      max_members: 6,
      members: ['user-1', 'user-2'],
      frequency: 'Biweekly',
      duration_months: 3,
      totalAmount: 3 * 2 * 75 * 6,
      status: 'Open',
      trustScoreRequired: 70,
      created_at: new Date('2025-04-10'),
      allowPartial: true,
    },
	
  ];
  
  // Generate mock users
  export const mockUsers: User[] = [
    {
      id: 'user-1',
      name: 'Ahmed',
      walletAddress: 'xion1qxy8r...',
      trustScore: 95,
      plans: ['plan-1', 'plan-2'],
    },
    {
      id: 'user-2',
      name: 'Ngozi',
      walletAddress: 'xion1qzm5f...',
      trustScore: 88,
      plans: ['plan-2'],
    },
    {
      id: 'user-3',
      name: 'Kofi',
      walletAddress: 'xion1q9j7r...',
      trustScore: 76,
      plans: ['plan-3'],
    },
  ];
  
  // Generate mock contributions
  export const mockContributions: Contribution[] = [
    {
      id: 'contrib-1',
      planId: 'plan-2',
      userId: 'user-1',
      amount: 50,
      date: new Date('2025-03-20'),
      roundNumber: 1,
    },
    {
      id: 'contrib-2',
      planId: 'plan-2',
      userId: 'user-1',
      amount: 50,
      date: new Date('2025-03-27'),
      roundNumber: 2,
    },
    {
      id: 'contrib-3',
      planId: 'plan-2',
      userId: 'user-2',
      amount: 50,
      date: new Date('2025-03-20'),
      roundNumber: 1,
    },
    {
      id: 'contrib-4',
      planId: 'plan-2',
      userId: 'user-2',
      amount: 100, // Paid ahead for round 2
      date: new Date('2025-03-21'),
      roundNumber: 2,
    },
  ];
  
  // Generate mock payouts
  export const mockPayouts: Payout[] = [
    {
      id: 'payout-1',
      planId: 'plan-2',
      recipientId: 'user-2',
      amount: 400, // 8 participants * 50
      scheduledDate: new Date('2025-03-25'),
      status: 'Completed',
      roundNumber: 1,
    },
    {
      id: 'payout-2',
      planId: 'plan-2',
      recipientId: 'user-1',
      amount: 400,
      scheduledDate: new Date('2025-04-01'),
      status: 'Scheduled',
      roundNumber: 2,
    },
  ];
  
  // Helper function to get user's plans
  export const getUserPlans = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) return [];
    
    return mockPlans.filter((plan) => user.plans.includes(plan.id));
  };
  
  // Helper function to get plan's participants
  export const getPlanParticipants = (planId: string) => {
    return mockUsers.filter((user) => user.plans.includes(planId));
  };
  
  // Helper function to get user's contributions for a plan
  export const getUserContributions = (userId: string, planId: string) => {
    return mockContributions.filter(
      (contrib) => contrib.userId === userId && contrib.planId === planId
    );
  };
  
  // Helper function to get user's upcoming payout
  export const getUserNextPayout = (userId: string) => {
    return mockPayouts.find(
      (payout) => payout.recipientId === userId && payout.status === 'Scheduled'
    );
  };
  
  // Defaults for new user and new plan
  export const defaultUser = {
    id: 'current-user',
    name: 'You',
    walletAddress: 'xion1q8j5r...',
    trustScore: 82,
    plans: ['plan-1', 'plan-3'],
  };
  
  // Update the emptyPlan to include the allowPartial property
  export const emptyPlan = {
    name: '',
    description: '',
    totalParticipants: 5,
    contribution_amount: 100,
    frequency: 'Monthly' as const,
    duration_months: 6,
    trustScoreRequired: 70,
    allowPartial: true,
  };