use crate::state::JoinRequest;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cosmwasm_std::{Uint128};
use cosmwasm_schema::QueryResponses;

use crate::state::{Plan};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum ExecuteMsg {
    CreatePlan {
        name: String,
        description: String,
        total_participants: u32,
        contribution_amount: Uint128,
        frequency: String,
        duration_months: u32,
        trust_score_required: u32,
        allow_partial: bool,
    },
    JoinPlan {
        plan_id: u64,
    },
	RequestToJoinPlan { 
		plan_id: u64 
	},
    ApproveJoinRequest { 
		plan_id: u64, 
		requester: String 
	},
	DenyJoinRequest { 
		plan_id: u64, 
		requester: String 
	},
	Contribute { 
		plan_id: u64, 
		amount: Uint128 
	},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema, QueryResponses)]
pub enum QueryMsg {
    #[returns(PlanResponse)]
    GetPlan {
        plan_id: u64,
    },
	#[returns(Vec<PlanResponse>)]
	GetPlansByCreator {
		creator: String
	},
	#[returns(u64)]
	GetPlanCount {},
	#[returns(JoinRequestsResponse)]
	GetJoinRequests { 
		plan_id: u64 
	},
	#[returns(ParticipantCycleStatusResponse)]
	GetParticipantCycleStatus { 
		plan_id: u64, 
		participant: String 
	},
	#[returns(u64)]
	GetTrustScore {
		user: String
	},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PlanResponse {
    pub plan: Option<Plan>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ParticipantCycleStatusResponse {
	pub cycle: u64,
    pub required: Uint128,
    pub contributed_this_cycle: Uint128,
    pub remaining_this_cycle: Uint128,
    pub fully_contributed: bool,
	pub debt: Uint128,
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct JoinRequestsResponse {
    pub requests: Vec<JoinRequest>,
}
