import XionWalletService from './blockchain';
import { Plan } from '../lib/mock-data';
import { TreasuryService } from './treasuryService';

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
  private treasuryService: TreasuryService;

  private constructor(treasuryConfig: any) {
    this.treasuryService = new TreasuryService(treasuryConfig);
  }

  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService({});
    }
    return ContractService.instance;
  }

  // Deploy a new savings plan contract using the wallet SDK
  async deployContract(plan: Plan, signAndBroadcast: any, fromAddress: string): Promise<{ address: string; txHash: string }> {
    try {
      console.log("Starting contract deployment for group:", plan);
      console.log("From address:", fromAddress);

      // Prepare instantiate message for the contract
      const instantiateMsg = {
        name: plan.name,
        description: plan.description,
        total_participants: plan.totalParticipants,
        contribution_amount: plan.contributionAmount,
        frequency: plan.frequency,
        duration_months: plan.duration,
        trust_score_required: plan.trustScoreRequired,
        allow_partial: plan.allowPartial,
      };

      console.log("Instantiate message:", instantiateMsg);

      // Prepare the instantiate contract message (update typeUrl as needed for your chain)
      const msg = {
        typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
        value: {
          sender: fromAddress,
          admin: fromAddress, // or set to '' if no admin
          codeId: plan.codeId, // You must provide codeId in the plan object or elsewhere
          label: `SavingsPlan-${plan.name}`,
          msg: Buffer.from(JSON.stringify(instantiateMsg)).toString('base64'),
          funds: [],
        },
      };

      console.log("Contract instantiate message:", msg);

      // Broadcast the transaction
      console.log("Broadcasting transaction...");
      const result = await signAndBroadcast([msg], { amount: [], gas: '2000000' }, 'Instantiate savings group contract');
      
      console.log("Transaction result:", result);
      console.log("Transaction result keys:", Object.keys(result));

      // Extract contract address and tx hash from result (update as per your wallet SDK's response)
      let contractAddress = result.contractAddress;
      let txHash = result.transactionHash || result.txhash;

      // If contract address is not directly available, try to extract from logs
      if (!contractAddress && result.logs) {
        console.log("Extracting contract address from logs...");
        console.log("Logs:", result.logs);
        
        for (const log of result.logs) {
          console.log("Processing log:", log);
          if (log.events) {
            for (const event of log.events) {
              console.log("Processing event:", event);
              if (event.type === 'instantiate' || event.type === 'wasm') {
                for (const attr of event.attributes || []) {
                  console.log("Processing attribute:", attr);
                  if (attr.key === 'contract_address' || attr.key === '_contract_address') {
                    contractAddress = attr.value;
                    console.log("Found contract address in logs:", contractAddress);
                    break;
                  }
                }
              }
            }
          }
        }
      }

      // If still no contract address, try alternative response formats
      if (!contractAddress) {
        console.log("Trying alternative response formats...");
        contractAddress = result.contract_address || result.contractAddress || result.address;
        txHash = txHash || result.hash || result.txHash || result.txhash;
      }

      console.log("Final extracted values:", { contractAddress, txHash });

      if (!contractAddress) {
        throw new Error('Could not extract contract address from transaction result');
      }

      if (!txHash) {
        throw new Error('Could not extract transaction hash from transaction result');
      }

      return {
        address: contractAddress,
        txHash: txHash,
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

  // Submit a contribution to the contract with optional gasless transaction
  async submitContribution(
    address: string,
    amount: number,
    roundNumber: number,
    useGasless: boolean = false
  ): Promise<{ txHash: string }> {
    try {
      const msg = {
        contribute: {
          amount,
          round_number: roundNumber
        }
      };

      if (useGasless) {
        // Use treasury service for gasless transaction
        const result = await this.treasuryService.submitGaslessTransaction(
          address,
          msg,
          address // user's address
        );
        return { txHash: result.txHash };
      } else {
        // Regular transaction flow
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
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      throw error;
    }
  }

  // Check if gasless transactions are available for a contract
  async isGaslessAvailable(contractAddress: string): Promise<boolean> {
    try {
      return await this.treasuryService.canSubsidizeGas(100000); // Default gas estimate
    } catch (error) {
      console.error('Error checking gasless availability:', error);
      return false;
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
        throw new Error('Failed to join group');
      }

      return await response.json();
    } catch (error) {
      console.error('Error joining group:', error);
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
      if (!wallet.isConnected || !wallet.address || !wallet.signAndBroadcast) {
        throw new Error('Wallet not connected');
      }
      return await contractService.deployContract(plan, wallet.signAndBroadcast, wallet.address);
    },
    getContractDetails: contractService.getContractDetails.bind(contractService),
    submitContribution: contractService.submitContribution.bind(contractService),
    joinPlan: contractService.joinPlan.bind(contractService),
    isGaslessAvailable: contractService.isGaslessAvailable.bind(contractService),
  };
}; 