import { useEffect, useState } from "react";
import XionWalletService from "@/services/blockchain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, X } from "lucide-react";
import { format } from "date-fns";

interface TransactionRecordDisplay {
  id: string;
  amount: number;
  description: string;
  timestamp: number;
  type: "join" | "contribute" | "withdraw";
  planId?: string;
  roundNumber?: number;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
}

const TransactionHistory = () => {
  const { isConnected } = XionWalletService.useWallet();
  
  const [transactions, setTransactions] = useState<TransactionRecordDisplay[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Implement fetching transaction history from XION backend or Abstraxion

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            Sign in to view transactions
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-2 border-ajo-primary rounded-full border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            No transactions found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="border rounded-lg p-3 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{tx.description}</div>
              <div className="text-sm text-gray-500">
                {format(new Date(tx.timestamp), "PPp")}
              </div>
              {tx.txHash && (
                <div className="text-xs text-gray-400 truncate max-w-[200px]">
                  {tx.txHash}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="font-bold text-lg">{tx.amount} XION</div>
              <div
                className={`flex items-center text-xs ${
                  tx.status === "confirmed"
                    ? "text-green-600"
                    : tx.status === "failed"
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {tx.status === "confirmed" ? (
                  <>
                    <Check size={12} className="mr-1" /> Confirmed
                  </>
                ) : tx.status === "failed" ? (
                  <>
                    <X size={12} className="mr-1" /> Failed
                  </>
                ) : (
                  <>
                    <Clock size={12} className="mr-1" /> Pending
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
