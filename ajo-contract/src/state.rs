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
}

// Global storage items
pub const CONFIG: Item<Config> = Item::new("config");
pub const PLAN_COUNT: Item<u64> = Item::new("plan_count");
pub const PLANS: Map<u64, Plan> = Map::new("plans");

// (plan_id, participant_addr) => amount contributed
pub const CONTRIBUTIONS: Map<(u64, &Addr), Uint128> = Map::new("contributions");
