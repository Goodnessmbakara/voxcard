
import { toast } from '@/hooks/use-toast';

export interface TransactionRecord {
  id: string;
  walletAddress: string;
  amount: number;
  description: string;
  timestamp: number;
  type: 'join' | 'contribute' | 'withdraw';
  planId?: string;
  roundNumber?: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
}

class DatabaseService {
  private readonly DB_NAME = 'voxcard_db';
  private readonly TRANSACTIONS_STORE = 'transactions';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDatabase();
  }

  private initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is supported
      if (!window.indexedDB) {
        console.error("Your browser doesn't support IndexedDB");
        toast({
          title: "Storage Error",
          description: "Your browser doesn't support local database storage",
          variant: "destructive",
        });
        reject("IndexedDB not supported");
        return;
      }

      const request = window.indexedDB.open(this.DB_NAME, 1);

      request.onerror = (event) => {
        console.error("Database error:", event);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log("Database initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create transactions object store
        if (!db.objectStoreNames.contains(this.TRANSACTIONS_STORE)) {
          const store = db.createObjectStore(this.TRANSACTIONS_STORE, { keyPath: 'id' });
          store.createIndex('walletAddress', 'walletAddress', { unique: false });
          store.createIndex('planId', 'planId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log("Created transactions store");
        }
      };
    });
  }

  async saveTransaction(transaction: Omit<TransactionRecord, 'id'>): Promise<string> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }
      
      // Generate a unique ID
      const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const tx = this.db.transaction(this.TRANSACTIONS_STORE, 'readwrite');
      const store = tx.objectStore(this.TRANSACTIONS_STORE);
      
      // Add transaction with generated ID
      const request = store.add({ ...transaction, id });
      
      request.onsuccess = () => {
        console.log("Transaction saved:", id);
        resolve(id);
      };
      
      request.onerror = (event) => {
        console.error("Error saving transaction:", event);
        reject("Failed to save transaction");
      };
    });
  }

  async getTransactionsByWallet(walletAddress: string): Promise<TransactionRecord[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }

      const tx = this.db.transaction(this.TRANSACTIONS_STORE, 'readonly');
      const store = tx.objectStore(this.TRANSACTIONS_STORE);
      const index = store.index('walletAddress');
      const request = index.getAll(IDBKeyRange.only(walletAddress));
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error("Error retrieving transactions:", event);
        reject("Failed to retrieve transactions");
      };
    });
  }

  async getTransactionsByPlan(planId: string): Promise<TransactionRecord[]> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }

      const tx = this.db.transaction(this.TRANSACTIONS_STORE, 'readonly');
      const store = tx.objectStore(this.TRANSACTIONS_STORE);
      const index = store.index('planId');
      const request = index.getAll(IDBKeyRange.only(planId));
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (event) => {
        console.error("Error retrieving plan transactions:", event);
        reject("Failed to retrieve plan transactions");
      };
    });
  }

  async updateTransactionStatus(id: string, status: 'pending' | 'confirmed' | 'failed', txHash?: string): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject("Database not initialized");
        return;
      }

      const tx = this.db.transaction(this.TRANSACTIONS_STORE, 'readwrite');
      const store = tx.objectStore(this.TRANSACTIONS_STORE);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.status = status;
          if (txHash) {
            data.txHash = txHash;
          }
          
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => {
            resolve();
          };
          
          updateRequest.onerror = (event) => {
            console.error("Error updating transaction:", event);
            reject("Failed to update transaction");
          };
        } else {
          reject("Transaction not found");
        }
      };
      
      request.onerror = (event) => {
        console.error("Error retrieving transaction:", event);
        reject("Failed to retrieve transaction");
      };
    });
  }
}

// Create a singleton instance
export const databaseService = new DatabaseService();
export default databaseService;