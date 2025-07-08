import { 
	useAbstraxionAccount,
	useAbstraxionSigningClient,
	useAbstraxionClient
 } from "@burnt-labs/abstraxion";
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { CreatePlanInput } from "../types/utils";
import React, { createContext, useContext, ReactNode } from "react";

const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

interface ContractContextProps {
  address: string;
  account?: string;
  createPlan: (plan: CreatePlanInput) => Promise<ExecuteResult>;
  getPlansByCreator: (creator: string) => Promise<any>;
}

const ContractContext = createContext<ContractContextProps | null>(null);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
	const { client: queryClient } = useAbstraxionClient();
  const sender = account?.bech32Address;

  const createPlan = async (plan: CreatePlanInput): Promise<ExecuteResult> => {
    if (!signingClient || !sender) throw new Error("Wallet not connected");
	
    return await signingClient.execute(
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

  const getPlansByCreator = async (creator: string) => {
	if (!queryClient || !sender) throw new Error("Wallet not connected");

	return await queryClient.queryContractSmart(contractAddress, {
		GetPlansByCreator: { creator },
	})
  }

  return (
    <ContractContext.Provider value={{
		address: contractAddress,
		account: sender,
		createPlan,
		getPlansByCreator 
	}}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContract must be used within ContractProvider");
  return ctx;
};
