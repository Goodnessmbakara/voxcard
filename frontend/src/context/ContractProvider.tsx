import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { CreatePlanInput } from "../types/create_plan";
import React, { createContext, useContext, ReactNode } from "react";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

interface ContractContextProps {
  address: string;
  account?: string;
  createPlan: (plan: CreatePlanInput) => Promise<ExecuteResult>;
}

const ContractContext = createContext<ContractContextProps | null>(null);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const sender = account?.bech32Address;

  const createPlan = async (plan: CreatePlanInput): Promise<ExecuteResult> => {
    if (!client || !sender) throw new Error("Wallet not connected");
	
	console.log(sender, contractAddress);
    return await client.execute(
		sender,
		contractAddress,
		{ CreatePlan: plan },
		{
			amount: [{ amount: "10000", denom: "uxion" }], // Fee payment
			gas: "300000",
			granter: import.meta.env.VITE_TREASURY_ADDRESS
		},
		"", // optional memo
		[] 
	);

  };

  return (
    <ContractContext.Provider value={{ address: contractAddress, account: sender, createPlan }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContract must be used within ContractProvider");
  return ctx;
};
