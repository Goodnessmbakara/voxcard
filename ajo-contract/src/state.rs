use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub enum Frequency {
    Daily,
    Weekly,
    Monthly,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Plan {
    pub id: u64,
    pub name: String,
    pub description: String,
    pub total_participants: u32,
    pub contribution_amount: Uint128,
    pub frequency: Frequency,
    pub duration_months: u32,
    pub trust_score_required: u32,
    pub allow_partial: bool,
    pub participants: Vec<String>, // Store as String, convert with addr_validate()
    pub current_cycle: u32,
    pub is_active: bool,
    pub payout_index: u32,
	pub balance: Uint128,
	pub created_by: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct JoinRequest {
    pub plan_id: u64,
    pub requester: Addr,
    pub approvals: Vec<Addr>, // addresses of those who approved
	pub denials: Vec<Addr>, //addresses of those who disapprove
}


pub const JOIN_REQUESTS: Map<(u64, Addr), JoinRequest> = Map::new("join_requests");
// Global storage items
pub const CONFIG: Item<Config> = Item::new("config");
pub const PLAN_COUNT: Item<u64> = Item::new("plan_count");
pub const PLANS: Map<u64, Plan> = Map::new("plans");
pub const PLANS_BY_CREATOR: Map<&Addr, Vec<u64>> = Map::new("plans_by_creator");


// (plan_id, participant_addr) => amount contributed
pub const CONTRIBUTIONS: Map<(u64, Addr, u64), Uint128> = Map::new("contrib");
pub const USER_DEBT: Map<(u64, Addr), Uint128> = Map::new("user_debt");
pub const TRUST_SCORE: Map<&Addr, u64> = Map::new("trust_scores");


pub const PARTICIPANT_START: Map<(u64, Addr), u64> = Map::new("participant_start");

