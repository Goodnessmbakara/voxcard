import { 
	useAbstraxionAccount,
	useAbstraxionSigningClient,
	useAbstraxionClient
 } from "@burnt-labs/abstraxion";
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { CreatePlanInput } from "../types/utils";
import React, { createContext, useContext, ReactNode } from "react";
import { Plan, ParticipantCycleStatus } from "../types/utils";


const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

interface ContractContextProps {
  address: string;
  account?: string;
  createPlan: (plan: CreatePlanInput) => Promise<ExecuteResult>;
  getPlansByCreator: (creator: string) => Promise<{ plans: Plan[] }>;
  getPlanById: (planId: number) => Promise<{ plan: Plan | null }>;
  getPaginatedPlans: (page: number, pageSize: number) => Promise<{ plans: Plan[]; totalCount: number }>;
  requestJoinPlan: (planId: number) => Promise<ExecuteResult>;
  approveJoinRequest: (planId: number, requester: string) => Promise<ExecuteResult>;
  denyJoinRequest: (planId: number, requester: string) => Promise<ExecuteResult>;
  getJoinRequests: (planId: number) => Promise<{ requests: string[] }>;
  contribute: (planId: number, amountUxion: string) => Promise<ExecuteResult>;
  getParticipantCycleStatus: (planId: number, participant: string) => Promise<ParticipantCycleStatus>;
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
		"auto",
		"",
		[] 
	);

  };

  const getPlansByCreator = async (creator: string) => {
	if (!queryClient || !sender) throw new Error("Wallet not connected");

	return await queryClient.queryContractSmart(contractAddress, {
		GetPlansByCreator: { creator },
	})
  };

  const getPlanById = async (planId: number) => {
	if (!queryClient || !sender) throw new Error("Wallet not connected");

	return await queryClient.queryContractSmart(contractAddress, {
		GetPlan: { plan_id: planId },
	});
}	

  const getPaginatedPlans = async (page: number, pageSize: number) => {
	if (!queryClient || !sender) throw new Error("Wallet not connected");

	const countRes = await queryClient.queryContractSmart(contractAddress, {
		GetPlanCount: {},
	});
	
	const totalCount = Number(countRes);

	const start = (page - 1) * pageSize + 1;
	const end = Math.min(start + pageSize - 1, totalCount);

	const plans = [];
	for (let i = start; i <= end; i++) {
		const planRes = await queryClient.queryContractSmart(contractAddress, {
		GetPlan: { plan_id: i },
		});
		if (planRes?.plan) {
		plans.push(planRes.plan);
		}
	}

	return { plans, totalCount }; 
	};

	const requestJoinPlan = async (planId: number): Promise<ExecuteResult> => {
		if (!signingClient || !sender) throw new Error("Wallet not connected");

		return await signingClient.execute(
			sender,
			contractAddress,
			{ RequestToJoinPlan: { plan_id: planId } },
			"auto",
			"",
			[]
		);
	};

	const getJoinRequests = async (planId: number): Promise<{ requests: string[] }> => {
		return await queryClient.queryContractSmart(contractAddress, {
			GetJoinRequests: { plan_id: planId },
		});
	};

	const approveJoinRequest = async (planId: number, requester: string): Promise<ExecuteResult> => {
		if (!signingClient || !sender) throw new Error("Wallet not connected");

		return await signingClient.execute(
			sender,
			contractAddress,
			{ ApproveJoinRequest: { plan_id: planId, requester } },
			"auto",
			"",
			[]
		);
	};

	const denyJoinRequest = async (planId: number, requester: string): Promise<ExecuteResult> => {
		if (!signingClient || !sender) throw new Error("Wallet not connected");

		return await signingClient.execute(
			sender,
			contractAddress,
			{ DenyJoinRequest: { plan_id: planId, requester } },
			"auto",
			"",
			[]
		);
	};

	const contribute = async (planId: number, amountUxion: string) => {
		if (!signingClient || !sender) throw new Error("Wallet not connected");
		return signingClient.execute(
			sender,
			contractAddress,
			{ Contribute: { plan_id: planId, amount: amountUxion } },
			"auto",
			"",
			[{ denom: "uxion", amount: amountUxion }]
		);
	};

	const getParticipantCycleStatus = async (planId: number, participant: string) => {
		if (!queryClient) throw new Error("Query client not available");
		return queryClient.queryContractSmart(contractAddress, {
			GetParticipantCycleStatus: { plan_id: planId, participant }
		});
	};

  return (
    <ContractContext.Provider value={{
		address: contractAddress,
		account: sender,
		createPlan,
		getPlansByCreator,
		getPlanById,
		getPaginatedPlans,
		requestJoinPlan,
		getJoinRequests,
		approveJoinRequest,
		denyJoinRequest,
		contribute,
		getParticipantCycleStatus
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
