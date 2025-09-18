import { 
	useAbstraxionAccount,
	useAbstraxionSigningClient,
	useAbstraxionClient
 } from "@burnt-labs/abstraxion";
import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { StargateClient } from "@cosmjs/stargate";
import { CreatePlanInput } from "../types/utils";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Plan, ParticipantCycleStatus } from "../types/utils";


const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;

interface ContractContextProps {
  address: string;
  account?: string;
  balance?: string;
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
  getTrustScore: (sender: string) => Promise<Number>;
}


const ContractContext = createContext<ContractContextProps | null>(null);

export const ContractProvider = ({ children }: { children: ReactNode }) => {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
	const { client: queryClient } = useAbstraxionClient();
  const sender = account?.bech32Address;

  const [balance, setBalance] = useState<string>("--");

  const fetchBalance = async () => {
  if (!sender) return;

  try {
    const stargateClient = await StargateClient.connect(import.meta.env.VITE_RPC_URL);
    const coins = await stargateClient.getAllBalances(sender);

    const uxion = coins.find(c => c.denom === "uxion");
    const amount = uxion?.amount || "0";

    setBalance((Number(amount) / 1_000_000).toFixed(2)); // convert uXION → XION
  } catch (err) {
    console.error("Error fetching balance:", err);
    setBalance("--");
  }
};


  // fetch automatically whenever account changes
  useEffect(() => {
    if (sender) {
      fetchBalance();
    } else {
      setBalance("--");
    }
  }, [sender]);

  const createPlan = async (plan: CreatePlanInput): Promise<ExecuteResult> => {
    if (!signingClient || !sender) throw new Error("You are not signed in");
	
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
	if (!queryClient || !sender) throw new Error("You are not signed in");

	return await queryClient.queryContractSmart(contractAddress, {
		GetPlansByCreator: { creator },
	})
  };

  const getPlanById = async (planId: number) => {
	if (!queryClient || !sender) throw new Error("You are not signed in");

	return await queryClient.queryContractSmart(contractAddress, {
		GetPlan: { plan_id: planId },
	});
}	

  const getPaginatedPlans = async (page: number, pageSize: number) => {
	if (!queryClient || !sender) throw new Error("You are not signed in");

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
		if (!signingClient || !sender) throw new Error("You are not signed in");

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
		if (!signingClient || !sender) throw new Error("You are not signed in");

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
		if (!signingClient || !sender) throw new Error("You are not signed in");

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
		if (!signingClient || !sender) throw new Error("You are not signed in");
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

	const getTrustScore = async (sender: string) => {
		if (!queryClient) throw new Error("Query client not available");
		return (await queryClient.queryContractSmart(contractAddress, {
			GetTrustScore: { user: sender }
		}));
	}

  return (
    <ContractContext.Provider value={{
		address: contractAddress,
		account: sender,
		balance: balance,
		createPlan,
		getPlansByCreator,
		getPlanById,
		getPaginatedPlans,
		requestJoinPlan,
		getJoinRequests,
		approveJoinRequest,
		denyJoinRequest,
		contribute,
		getParticipantCycleStatus,
		getTrustScore
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
