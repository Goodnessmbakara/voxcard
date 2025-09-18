import { toast } from '@/hooks/use-toast';
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
} from '@burnt-labs/abstraxion';

export interface TransactionDetails {
  amount: number;
  description: string;
  recipient?: string;
  metadata?: Record<string, any>;
}

// XION/Abstraxion Wallet Service
class XionWalletService {
  // Use this hook in your React components to access wallet state and actions
  static useWallet() {
    const { data: account, isConnected } = useAbstraxionAccount();
    const { connect, logout, signAndBroadcast } = useAbstraxionSigningClient();
    return {
      isConnected,
      address: account?.bech32Address || null,
      connect,
      disconnect: logout,
      signAndBroadcast,
    };
  }

  // Example transaction execution (to be called from a component):
  static async executeTransaction(
    { amount, description, recipient, metadata }: TransactionDetails,
    signAndBroadcast: any,
    fromAddress: string
  ) {
    try {
      if (!signAndBroadcast) throw new Error('You are not signed in');
      if (!recipient) throw new Error('Recipient address required');
      const msg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          toAddress: recipient,
          fromAddress,
          amount: [{ denom: 'uxion', amount: String(amount) }],
        },
      };
      const result = await signAndBroadcast([msg], { amount: [], gas: '200000' }, description);
      toast({
        title: 'Transaction submitted',
        description: 'Your transaction has been submitted to the blockchain',
      });
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: 'Transaction failed',
        description: 'There was an error processing your transaction',
        variant: 'destructive',
      });
      return null;
    }
  }
}

export default XionWalletService;
