import { useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import { toast } from '@/hooks/use-toast';

export interface TreasuryConfig {
  treasuryAddress: string;
  minBalance: number;
  maxGasSubsidy: number;
  whitelistedContracts: string[];
}

export class TreasuryService {
  private config: TreasuryConfig;

  constructor(config: TreasuryConfig) {
    this.config = config;
  }

  // Check if a contract is whitelisted for gasless transactions
  private isContractWhitelisted(contractAddress: string): boolean {
    return this.config.whitelistedContracts.includes(contractAddress);
  }

  // Estimate gas for a transaction
  private async estimateGas(msg: any): Promise<number> {
    try {
      // Basic gas estimation logic - can be enhanced based on message type
      const baseGas = 100000; // Base gas units
      const dataSize = JSON.stringify(msg).length;
      const estimatedGas = baseGas + (dataSize * 100); // 100 gas per byte of data
      return Math.min(estimatedGas, this.config.maxGasSubsidy);
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }

  // Submit a gasless transaction through the treasury
  async submitGaslessTransaction(
    contractAddress: string,
    msg: any,
    userAddress: string
  ) {
    try {
      // Verify contract is whitelisted
      if (!this.isContractWhitelisted(contractAddress)) {
        throw new Error('Contract not whitelisted for gasless transactions');
      }

      // Get signing client
      const { signAndBroadcast } = useAbstraxionSigningClient();
      if (!signAndBroadcast) {
        throw new Error('Signing client not available');
      }

      // Estimate gas for the transaction
      const estimatedGas = await this.estimateGas(msg);

      // Prepare the treasury message that will wrap the user's transaction
      const treasuryMsg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: this.config.treasuryAddress,
          toAddress: contractAddress,
          amount: [], // No tokens being sent, just covering gas
          originalSender: userAddress,
          gasSubsidy: estimatedGas,
          payload: msg
        }
      };

      // Submit the transaction through the treasury
      const result = await signAndBroadcast(
        [treasuryMsg],
        {
          amount: [],
          gas: String(estimatedGas)
        },
        'Gasless transaction via Treasury'
      );

      toast({
        title: 'Transaction submitted',
        description: 'Your gasless transaction has been submitted successfully'
      });

      return {
        success: true,
        txHash: result.transactionHash,
        gasUsed: result.gasUsed
      };

    } catch (error) {
      console.error('Error submitting gasless transaction:', error);
      toast({
        title: 'Transaction failed',
        description: 'Failed to submit gasless transaction',
        variant: 'destructive'
      });
      throw error;
    }
  }

  // Get treasury balance (assumes a backend endpoint or blockchain query is available)
  async getTreasuryBalance(): Promise<number> {
    try {
      // You may want to replace this with a direct blockchain query if available
      const response = await fetch(`/api/treasury/balance/${this.config.treasuryAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch treasury balance');
      }
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Error fetching treasury balance:', error);
      throw error;
    }
  }

  // Check if treasury has sufficient funds for gas subsidy
  async canSubsidizeGas(estimatedGas: number): Promise<boolean> {
    try {
      const balance = await this.getTreasuryBalance();
      return balance >= this.config.minBalance && balance >= estimatedGas;
    } catch (error) {
      console.error('Error checking gas subsidy capability:', error);
      return false;
    }
  }
} 