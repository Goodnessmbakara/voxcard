import XionWalletService from './blockchain';
import { Plan } from '../lib/mock-data';

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

  private constructor() {}

  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // Deploy a new savings plan contract
  async deployContract(plan: Plan): Promise<{ address: string; txHash: string }> {
    try {
      // Convert plan to contract parameters
      const params = {
        planName: plan.name,
        targetAmount: plan.targetAmount,
        contributionAmount: plan.contributionAmount,
        duration: plan.duration,
        maxMembers: plan.maxMembers
      };

      // Call the contract's create endpoint
      const response = await fetch('http://localhost:3001/api/contracts/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy contract');
      }

      const result = await response.json();
      return {
        address: result.address,
        txHash: result.txHash
      };
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }

  // Get contract details
  async getContractDetails(address: string): Promise<any> {
    try {
      const response = await fetch(`http://localhost:3001/api/contracts/${address}`);
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
  async submitContribution(address: string, amount: number, roundNumber: number): Promise<{ txHash: string }> {
    try {
      const response = await fetch(`http://localhost:3001/api/contracts/${address}/contribute`, {
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
      console.error('Error submitting contribution:', error);
      throw error;
    }
  }

  // Join a savings plan
  async joinPlan(address: string, userAddress: string): Promise<{ txHash: string }> {
    try {
      const response = await fetch(`http://localhost:3001/api/contracts/${address}/join`, {
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
      console.error('Error joining plan:', error);
      throw error;
    }
  }
}

// Hook to use the contract service
export const useContract = () => {
  const wallet = XionWalletService.useWallet();
  const contractService = ContractService.getInstance();

  return {
    isConnected: wallet.isConnected,
    address: wallet.address,
    deployContract: async (plan: Plan) => {
      if (!wallet.isConnected || !wallet.address) {
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
        initiatorAddress: wallet.address,
      };

      return await contractService.deployContract(plan);
    },
    getContractDetails: contractService.getContractDetails.bind(contractService),
    submitContribution: contractService.submitContribution.bind(contractService),
    joinPlan: contractService.joinPlan.bind(contractService),
  };
}; 