import { createContext, useContext, ReactNode } from 'react';
import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CardanoWalletContextType {
  isEnabled: boolean;
  isConnected: boolean;
  enabledWallet: string | null;
  stakeAddress: string | null;
  accountBalance: string;
  usedAddresses: string[];
  unusedAddresses: string[];
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string, onSignMessage?: (signature: string, key: string | undefined) => void) => Promise<void>;
}

const CardanoWalletContext = createContext<CardanoWalletContextType | undefined>(undefined);

export const CardanoWalletProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const {
    isEnabled,
    isConnected,
    enabledWallet,
    stakeAddress,
    accountBalance,
    usedAddresses,
    unusedAddresses,
    connect,
    disconnect,
    signMessage,
  } = useCardano();

  const handleConnect = async () => {
    try {
      await connect('connect');
      toast.success('Wallet connected successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Wallet disconnected');
  };

  const value = {
    isEnabled,
    isConnected,
    enabledWallet,
    stakeAddress,
    accountBalance: accountBalance.toString(),
    usedAddresses,
    unusedAddresses,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage,
  };

  return (
    <CardanoWalletContext.Provider value={value}>
      {children}
    </CardanoWalletContext.Provider>
  );
};

export const useCardanoWallet = () => {
  const context = useContext(CardanoWalletContext);
  if (context === undefined) {
    throw new Error('useCardanoWallet must be used within a CardanoWalletProvider');
  }
  return context;
}; 