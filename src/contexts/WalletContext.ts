
import React, { createContext, useState, useContext, useEffect } from 'react';
import blockchainService, { SupportedWallet, TransactionDetails } from '@/services/blockchain';
import databaseService from '@/services/database';

// Define the wallet context types
type WalletContextType = {
  isConnected: boolean;
  walletAddress: string | null;
  walletName: string | null;
  connectWallet: () => void;
  disconnectWallet: () => void;
  openWalletForTransaction: (amount: number, description: string, planId?: string, roundNumber?: number) => Promise<boolean>;
  getTransactionHistory: () => Promise<any[]>;
};

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  walletAddress: null,
  walletName: null,
  connectWallet: () => {},
  disconnectWallet: () => {},
  openWalletForTransaction: async () => false,
  getTransactionHistory: async () => [],
});

// Hook for accessing the wallet context
export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(blockchainService.isConnected);
  const [walletAddress, setWalletAddress] = useState<string | null>(blockchainService.walletAddress);
  const [walletName, setWalletName] = useState<string | null>(blockchainService.walletName);
  
  useEffect(() => {
    // Sync state with blockchain service
    setIsConnected(blockchainService.isConnected);
    setWalletAddress(blockchainService.walletAddress);
    setWalletName(blockchainService.walletName);
  }, []);
  
  // Function to handle wallet connection
  const connectWallet = () => {
    // Open modal with supported wallets
    const walletSelection = document.createElement('div');
    walletSelection.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 w-80 max-w-md';
    
    const heading = document.createElement('h3');
    heading.className = 'text-lg font-medium mb-4';
    heading.textContent = 'Connect your Cardano wallet';
    
    modalContent.appendChild(heading);
    
    // Create wallet options
    blockchainService.SUPPORTED_WALLETS.forEach(wallet => {
      const walletOption = document.createElement('button');
      walletOption.className = 'w-full text-left p-3 hover:bg-gray-100 rounded-md flex items-center mb-2';
      walletOption.innerHTML = `<span class="mr-2 text-xl">${wallet.icon}</span> ${wallet.name}`;
      
      walletOption.onclick = async () => {
        const success = await blockchainService.connectWallet(wallet.name);
        if (success) {
          setIsConnected(true);
          setWalletAddress(blockchainService.walletAddress);
          setWalletName(blockchainService.walletName);
        }
        document.body.removeChild(walletSelection);
      };
      
      modalContent.appendChild(walletOption);
    });
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'mt-4 w-full py-2 border border-gray-300 rounded-md hover:bg-gray-100';
    closeButton.textContent = 'Cancel';
    closeButton.onclick = () => {
      document.body.removeChild(walletSelection);
    };
    
    modalContent.appendChild(closeButton);
    walletSelection.appendChild(modalContent);
    document.body.appendChild(walletSelection);
  };
  
  // Function to disconnect wallet
  const disconnectWallet = () => {
    blockchainService.disconnectWallet();
    setIsConnected(false);
    setWalletAddress(null);
    setWalletName(null);
  };
  
  // Function to handle transactions
  const openWalletForTransaction = async (
    amount: number, 
    description: string,
    planId?: string,
    roundNumber?: number
  ): Promise<boolean> => {
    if (!isConnected) {
      return false;
    }
    
    // Create transaction confirmation modal
    const transactionModal = document.createElement('div');
    transactionModal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg p-6 w-80 max-w-md';
    
    const heading = document.createElement('h3');
    heading.className = 'text-lg font-medium mb-2';
    heading.textContent = `${walletName} Transaction Request`;
    
    const subheading = document.createElement('p');
    subheading.className = 'text-sm text-gray-600 mb-4';
    subheading.textContent = description;
    
    const amountText = document.createElement('div');
    amountText.className = 'text-2xl font-bold text-center my-4';
    amountText.textContent = `${amount} ADA`;
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'w-full bg-ajo-primary text-white py-2 rounded-md hover:bg-ajo-secondary mb-2';
    confirmButton.textContent = 'Confirm Transaction';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'w-full py-2 border border-gray-300 rounded-md hover:bg-gray-100';
    cancelButton.textContent = 'Cancel';
    
    modalContent.appendChild(heading);
    modalContent.appendChild(subheading);
    modalContent.appendChild(amountText);
    modalContent.appendChild(confirmButton);
    modalContent.appendChild(cancelButton);
    
    transactionModal.appendChild(modalContent);
    document.body.appendChild(transactionModal);
    
    return new Promise<boolean>((resolve) => {
      confirmButton.onclick = async () => {
        document.body.removeChild(transactionModal);
        
        // Record the transaction in database first as pending
        const transactionData = {
          walletAddress: walletAddress!,
          amount,
          description,
          timestamp: Date.now(),
          type: planId ? (roundNumber ? 'contribute' : 'join') : 'withdraw',
          planId,
          roundNumber,
          status: 'pending' as const
        };
        
        const transactionId = await databaseService.saveTransaction(transactionData);
        
        // Execute the blockchain transaction
        const success = await blockchainService.executeTransaction({
          amount,
          description,
          metadata: { planId, roundNumber }
        });
        
        // Update the transaction status in the database
        await databaseService.updateTransactionStatus(
          transactionId, 
          success ? 'confirmed' : 'failed',
          success ? `tx${Math.random().toString(36).substring(2, 10)}` : undefined
        );
        
        resolve(success);
      };
      
      cancelButton.onclick = () => {
        document.body.removeChild(transactionModal);
        resolve(false);
      };
    });
  };
  
  // Get transaction history for current wallet
  const getTransactionHistory = async () => {
    if (!walletAddress) {
      return [];
    }
    
    return await databaseService.getTransactionsByWallet(walletAddress);
  };
  
  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        walletName,
        connectWallet,
        disconnectWallet,
        openWalletForTransaction,
        getTransactionHistory,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;
