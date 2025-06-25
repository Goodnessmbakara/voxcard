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
    Contribute {
        plan_id: u64,
        amount: Uint128,
    },
    DistributePayout {
        plan_id: u64,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema, QueryResponses)]
pub enum QueryMsg {
    #[returns(PlanResponse)]
    GetPlan {
        plan_id: u64,
    },
    #[returns(ParticipantStatus)]
    GetParticipantStatus {
        plan_id: u64,
        participant: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PlanResponse {
    pub plan: Option<Plan>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ParticipantStatus {
    pub contributed: Uint128,
    pub received_payout: bool,
}
