use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, Addr, Uint128, StdError,
};
use cosmwasm_storage::{singleton, singleton_read, Singleton};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cw_storage_plus::{Item, Map};
use cosmwasm_std::Coin;

// Configuration for the contract admin
static CONFIG_KEY: &[u8] = b"config";
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
struct Config {
    admin: Addr,
}

// Plan structure based on frontend schema
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
struct Plan {
    id: u64,
    name: String,
    description: String,
    total_participants: u32,
    contribution_amount: Uint128,
    frequency: Frequency,
    duration_months: u32,
    trust_score_required: u32,
    allow_partial: bool,
    initiator: Addr,
    participants: Vec<Addr>,
    contributions: Map<Addr, Uint128>,
    current_cycle: u32,
    is_active: bool,
    payout_index: u32,
    is_cancelled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
enum Frequency {
    Daily,
    Weekly,
    Monthly,
}

// State storage
static PLAN_COUNT: Item<u64> = Item::new("plan_count");
static PLANS: Map<u64, Plan> = Map::new("plans");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
enum ExecuteMsg {
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
    JoinPlan { plan_id: u64 },
    Contribute { plan_id: u64, amount: Uint128 },
    DistributePayout { plan_id: u64 },
    CancelPlan { plan_id: u64 },
    UpdatePlan {
        plan_id: u64,
        name: Option<String>,
        description: Option<String>,
        total_participants: Option<u32>,
        contribution_amount: Option<Uint128>,
        frequency: Option<String>,
        duration_months: Option<u32>,
        trust_score_required: Option<u32>,
        allow_partial: Option<bool>,
    },
    EmergencyWithdraw { plan_id: u64 },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
enum QueryMsg {
    GetPlan { plan_id: u64 },
    GetParticipantStatus { plan_id: u64, participant: String },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
struct PlanResponse {
    plan: Option<Plan>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
struct ParticipantStatus {
    contributed: Uint128,
    received_payout: bool,
}

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = Config {
        admin: info.sender,
    };
    singleton(deps.storage, CONFIG_KEY).save(&config)?;
    PLAN_COUNT.save(deps.storage, &0)?;
    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::CreatePlan {
            name,
            description,
            total_participants,
            contribution_amount,
            frequency,
            duration_months,
            trust_score_required,
            allow_partial,
        } => execute_create_plan(
            deps,
            info,
            name,
            description,
            total_participants,
            contribution_amount,
            frequency,
            duration_months,
            trust_score_required,
            allow_partial,
        ),
        ExecuteMsg::JoinPlan { plan_id } => execute_join_plan(deps, info, plan_id),
        ExecuteMsg::Contribute { plan_id, amount } => execute_contribute(deps, env, info, plan_id, amount),
        ExecuteMsg::DistributePayout { plan_id } => execute_distribute_payout(deps, env, info, plan_id),
        ExecuteMsg::CancelPlan { plan_id } => execute_cancel_plan(deps, info, plan_id),
        ExecuteMsg::UpdatePlan {
            plan_id,
            name,
            description,
            total_participants,
            contribution_amount,
            frequency,
            duration_months,
            trust_score_required,
            allow_partial,
        } => execute_update_plan(deps, info, plan_id, name, description, total_participants, contribution_amount, frequency, duration_months, trust_score_required, allow_partial),
        ExecuteMsg::EmergencyWithdraw { plan_id } => execute_emergency_withdraw(deps, env, info, plan_id),
    }
}

fn execute_create_plan(
    deps: DepsMut,
    info: MessageInfo,
    name: String,
    description: String,
    total_participants: u32,
    contribution_amount: Uint128,
    frequency: String,
    duration_months: u32,
    trust_score_required: u32,
    allow_partial: bool,
) -> StdResult<Response> {
    if total_participants < 2 || total_participants > 100 {
        return Err(StdError::generic_err("Participants must be between 2 and 100"));
    }
    if contribution_amount < Uint128::from(10u128) || contribution_amount > Uint128::from(100000u128) {
        return Err(StdError::generic_err("Contribution amount must be between 10 and 100000"));
    }
    if duration_months < 1 || duration_months > 36 {
        return Err(StdError::generic_err("Duration must be between 1 and 36 months"));
    }
    if name.len() < 3 || name.len() > 50 {
        return Err(StdError::generic_err("Name must be between 3 and 50 characters"));
    }
    if description.len() < 10 || description.len() > 500 {
        return Err(StdError::generic_err("Description must be between 10 and 500 characters"));
    }
    let frequency = match frequency.as_str() {
        "Daily" => Frequency::Daily,
        "Weekly" => Frequency::Weekly,
        "Monthly" => Frequency::Monthly,
        _ => return Err(StdError::generic_err("Invalid frequency")),
    };
    let plan_id = PLAN_COUNT.load(deps.storage)? + 1;
    let plan = Plan {
        id: plan_id,
        name,
        description,
        total_participants,
        contribution_amount,
        frequency,
        duration_months,
        trust_score_required,
        allow_partial,
        initiator: info.sender.clone(),
        participants: vec![],
        contributions: Map::new(format!("contributions_{}", plan_id).as_bytes()),
        current_cycle: 0,
        is_active: false,
        payout_index: 0,
        is_cancelled: false,
    };
    PLANS.save(deps.storage, plan_id, &plan)?;
    PLAN_COUNT.save(deps.storage, &plan_id)?;
    Ok(Response::new()
        .add_attribute("method", "create_plan")
        .add_attribute("plan_id", plan_id.to_string()))
}

fn execute_join_plan(deps: DepsMut, info: MessageInfo, plan_id: u64) -> StdResult<Response> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    if plan.is_active {
        return Err(StdError::generic_err("Plan is already active"));
    }
    if plan.participants.len() as u32 >= plan.total_participants {
        return Err(StdError::generic_err("Plan is full"));
    }
    if plan.participants.contains(&info.sender) {
        return Err(StdError::generic_err("Already a participant"));
    }

    // Mock trust score check (replace with actual oracle or system integration)
    let trust_score = 50; // Placeholder; integrate with trust score system
    if trust_score < plan.trust_score_required {
        return Err(StdError::generic_err("Insufficient trust score"));
    }

    plan.participants.push(info.sender.clone());
    if plan.participants.len() as u32 == plan.total_participants {
        plan.is_active = true;
    }

    PLANS.save(deps.storage, plan_id, &plan)?;
    Ok(Response::new()
        .add_attribute("method", "join_plan")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("participant", info.sender.to_string()))
}

fn execute_contribute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    plan_id: u64,
    amount: Uint128,
) -> StdResult<Response> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    if !plan.is_active {
        return Err(StdError::generic_err("Plan is not active"));
    }
    if !plan.participants.contains(&info.sender) {
        return Err(StdError::generic_err("Not a participant"));
    }

    let expected_amount = plan.contribution_amount;
    if !plan.allow_partial && amount != expected_amount {
        return Err(StdError::generic_err("Must contribute exact amount"));
    }
    if amount > expected_amount {
        return Err(StdError::generic_err("Contribution exceeds required amount"));
    }

    // Verify funds sent
    let sent_funds = info
        .funds
        .iter()
        .find(|coin| coin.denom == "uxion")
        .map(|coin| coin.amount)
        .unwrap_or(Uint128::zero());
    if sent_funds < amount {
        return Err(StdError::generic_err("Insufficient funds sent"));
    }

    let current_contribution = plan.contributions.load(deps.storage, info.sender.clone())?.unwrap_or(Uint128::zero());
    plan.contributions.save(deps.storage, info.sender.clone(), &(current_contribution + amount))?;

    Ok(Response::new()
        .add_attribute("method", "contribute")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("amount", amount.to_string()))
}

fn execute_distribute_payout(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    plan_id: u64,
) -> StdResult<Response> {
    let config = singleton_read(deps.storage, CONFIG_KEY).load()?;
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    if info.sender != config.admin {
        return Err(StdError::generic_err("Only admin can distribute payouts"));
    }
    if !plan.is_active {
        return Err(StdError::generic_err("Plan is not active"));
    }

    // Check if all participants contributed enough for the current cycle
    let total_expected = plan.contribution_amount * Uint128::from(plan.participants.len() as u128);
    let mut total_contributed = Uint128::zero();
    for participant in &plan.participants {
        let contribution = plan.contributions.load(deps.storage, participant.clone())?.unwrap_or(Uint128::zero());
        total_contributed += contribution;
    }
    if total_contributed < total_expected {
        return Err(StdError::generic_err("Insufficient contributions for payout"));
    }

    // Distribute to the current participant
    let payout_recipient = plan.participants[plan.payout_index as usize].clone();
    let payout_amount = plan.contribution_amount * Uint128::from(plan.participants.len() as u128);

    // Reset contributions for next cycle
    for participant in &plan.participants {
        plan.contributions.save(deps.storage, participant.clone(), &Uint128::zero())?;
    }

    plan.payout_index += 1;
    plan.current_cycle += 1;
    if plan.payout_index >= plan.participants.len() as u32 {
        plan.payout_index = 0; // Reset for next round
    }
    if plan.current_cycle >= plan.duration_months * plan_frequency_to_cycles(&plan.frequency) {
        plan.is_active = false; // Plan completed
    }

    PLANS.save(deps.storage, plan_id, &plan)?;

    // Create bank message for payout
    let bank_msg = cosmwasm_std::BankMsg::Send {
        to_address: payout_recipient.to_string(),
        amount: vec![Coin {
            denom: "uxion".to_string(),
            amount: payout_amount,
        }],
    };

    Ok(Response::new()
        .add_message(bank_msg)
        .add_attribute("method", "distribute_payout")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("recipient", payout_recipient.to_string())
        .add_attribute("amount", payout_amount.to_string()))
}

fn execute_cancel_plan(
    deps: DepsMut,
    info: MessageInfo,
    plan_id: u64,
) -> StdResult<Response> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    if plan.initiator != info.sender {
        return Err(StdError::generic_err("Only the plan creator can cancel the plan"));
    }
    if plan.is_active {
        return Err(StdError::generic_err("Cannot cancel an active plan"));
    }
    plan.is_cancelled = true;
    PLANS.save(deps.storage, plan_id, &plan)?;
    // Refund logic can be added here if funds were already sent
    Ok(Response::new()
        .add_attribute("method", "cancel_plan")
        .add_attribute("plan_id", plan_id.to_string()))
}

fn execute_update_plan(
    deps: DepsMut,
    info: MessageInfo,
    plan_id: u64,
    name: Option<String>,
    description: Option<String>,
    total_participants: Option<u32>,
    contribution_amount: Option<Uint128>,
    frequency: Option<String>,
    duration_months: Option<u32>,
    trust_score_required: Option<u32>,
    allow_partial: Option<bool>,
) -> StdResult<Response> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    if plan.initiator != info.sender {
        return Err(StdError::generic_err("Only the plan creator can update the plan"));
    }
    if plan.is_active {
        return Err(StdError::generic_err("Cannot update an active plan"));
    }
    if let Some(n) = name { plan.name = n; }
    if let Some(d) = description { plan.description = d; }
    if let Some(tp) = total_participants { plan.total_participants = tp; }
    if let Some(ca) = contribution_amount { plan.contribution_amount = ca; }
    if let Some(f) = frequency {
        plan.frequency = match f.as_str() {
            "Daily" => Frequency::Daily,
            "Weekly" => Frequency::Weekly,
            "Monthly" => Frequency::Monthly,
            _ => return Err(StdError::generic_err("Invalid frequency")),
        };
    }
    if let Some(dm) = duration_months { plan.duration_months = dm; }
    if let Some(ts) = trust_score_required { plan.trust_score_required = ts; }
    if let Some(ap) = allow_partial { plan.allow_partial = ap; }
    PLANS.save(deps.storage, plan_id, &plan)?;
    Ok(Response::new()
        .add_attribute("method", "update_plan")
        .add_attribute("plan_id", plan_id.to_string()))
}

fn execute_emergency_withdraw(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    plan_id: u64,
) -> StdResult<Response> {
    let plan = PLANS.load(deps.storage, plan_id)?;
    if plan.initiator != info.sender {
        return Err(StdError::generic_err("Only the plan creator can withdraw"));
    }
    if !plan.is_cancelled && plan.is_active {
        return Err(StdError::generic_err("Can only withdraw from cancelled or inactive plans"));
    }
    // Send all contract balance to initiator
    let balance = deps.querier.query_all_balances(env.contract.address)?;
    let bank_msg = cosmwasm_std::BankMsg::Send {
        to_address: info.sender.to_string(),
        amount: balance,
    };
    Ok(Response::new()
        .add_message(bank_msg)
        .add_attribute("method", "emergency_withdraw")
        .add_attribute("plan_id", plan_id.to_string()))
}

fn plan_frequency_to_cycles(frequency: &Frequency) -> u32 {
    match frequency {
        Frequency::Daily => 30, // Approx. days in a month
        Frequency::Weekly => 4,  // Approx. weeks in a month
        Frequency::Monthly => 1,
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetPlan { plan_id } => to_binary(&query_plan(deps, plan_id)?),
        QueryMsg::GetParticipantStatus { plan_id, participant } => {
            to_binary(&query_participant_status(deps, plan_id, participant)?)
        }
    }
}

fn query_plan(deps: Deps, plan_id: u64) -> StdResult<PlanResponse> {
    let plan = PLANS.may_load(deps.storage, plan_id)?;
    Ok(PlanResponse { plan })
}

fn query_participant_status(deps: Deps, plan_id: u64, participant: String) -> StdResult<ParticipantStatus> {
    let plan = PLANS.load(deps.storage, plan_id)?;
    let participant_addr = deps.api.addr_validate(&participant)?;
    let contributed = plan
        .contributions
        .load(deps.storage, participant_addr)?
        .unwrap_or(Uint128::zero());
    let received_payout = plan.payout_index > 0
        && plan.participants[..plan.payout_index as usize].contains(&Addr::unchecked(participant));
    Ok(ParticipantStatus {
        contributed,
        received_payout,
    })
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
struct InstantiateMsg {}