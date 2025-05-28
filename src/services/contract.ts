import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';
import { Plan } from '@/lib/mock-data';

// Smart contract parameters
interface ContractParams {
  name: string;
  description: string;
  totalParticipants: number;
  contributionAmount: number;
  frequency: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
  duration: number;
  trustScoreRequired: number;
  allowPartial: boolean;
  initiatorAddress: string;
}

// Contract deployment response
interface ContractDeployment {
  contractAddress: string;
  transactionHash: string;
  timestamp: number;
}

// Contract service class
export class ContractService {
  private static instance: ContractService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // Deploy a new savings plan contract
  async deployContract(params: ContractParams): Promise<ContractDeployment> {
    try {
      const response = await fetch(`${this.apiUrl}/contracts/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy contract');
      }

      return await response.json();
    } catch (error) {
      console.error('Contract deployment error:', error);
      throw error;
    }
  }

  // Get contract details
  async getContractDetails(contractAddress: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/contracts/${contractAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching contract details:', error);
      throw error;
    }
  }

  // Submit a contribution to the contract
  async submitContribution(
    contractAddress: string,
    amount: number,
    roundNumber: number
  ): Promise<{ transactionHash: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/contracts/${contractAddress}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, roundNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit contribution');
      }

      return await response.json();
    } catch (error) {
      console.error('Contribution error:', error);
      throw error;
    }
  }

  // Join a savings plan
  async joinPlan(
    contractAddress: string,
    userAddress: string
  ): Promise<{ transactionHash: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/contracts/${contractAddress}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to join plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Join plan error:', error);
      throw error;
    }
  }
}

// Hook to use the contract service
export const useContract = () => {
  const { isConnected, stakeAddress } = useCardano();
  const contractService = ContractService.getInstance();

  return {
    isConnected,
    stakeAddress,
    deployContract: async (plan: Plan) => {
      if (!isConnected || !stakeAddress) {
        throw new Error('Wallet not connected');
      }

      const params: ContractParams = {
        name: plan.name,
        description: plan.description,
        totalParticipants: plan.totalParticipants,
        contributionAmount: plan.contributionAmount,
        frequency: plan.frequency,
        duration: plan.duration,
        trustScoreRequired: plan.trustScoreRequired,
        allowPartial: plan.allowPartial,
        initiatorAddress: stakeAddress,
      };

      return await contractService.deployContract(params);
    },
    getContractDetails: contractService.getContractDetails.bind(contractService),
    submitContribution: contractService.submitContribution.bind(contractService),
    joinPlan: contractService.joinPlan.bind(contractService),
  };
}; 