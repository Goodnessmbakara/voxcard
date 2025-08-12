// src/contract.rs

use cosmwasm_std::{
    entry_point, to_json_binary, Binary, Deps, DepsMut, Env,
    MessageInfo, Response, StdResult, StdError, Uint128,
};

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, PlanResponse, QueryMsg, JoinRequestsResponse, ParticipantCycleStatusResponse};
use crate::state::{Config, 
	Frequency, Plan, 
	CONFIG, PLAN_COUNT, 
	PLANS, PLANS_BY_CREATOR, 
	CONTRIBUTIONS_BY_CYCLE, JOIN_REQUESTS, JoinRequest};
use cw2::set_contract_version;

const CONTRACT_NAME: &str = "crates.io:ajo-contract";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        admin: info.sender.clone(),
    };
    CONFIG.save(deps.storage, &config)?;
    PLAN_COUNT.save(deps.storage, &0)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new().add_attribute("method", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
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
		ExecuteMsg::RequestToJoinPlan { plan_id } => request_to_join_plan(deps, info, plan_id),
        ExecuteMsg::ApproveJoinRequest { plan_id, requester } => {
            approve_join_request(deps, env, info, plan_id, requester)
        },
		ExecuteMsg::DenyJoinRequest { plan_id, requester } => {
			deny_join_request(deps, env, info, plan_id, requester)
		},
		ExecuteMsg::Contribute { plan_id, amount } => {
            execute_contribute(deps, env, info, plan_id, amount)
        }
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
) -> Result<Response, ContractError> {
    if !(2..=100).contains(&total_participants)
        || !(Uint128::from(10u128)..=Uint128::from(100000u128)).contains(&contribution_amount)
        || !(1..=36).contains(&duration_months)
        || !(3..=50).contains(&name.len())
        || !(10..=500).contains(&description.len())
    {
        return Err(ContractError::InvalidInput("Invalid input parameters".to_string()));
    }

    let frequency = match frequency.as_str() {
        "Daily" => Frequency::Daily,
        "Weekly" => Frequency::Weekly,
        "Monthly" => Frequency::Monthly,
        _ => return Err(ContractError::InvalidInput("Invalid frequency".to_string())),
    };

    let plan_id = PLAN_COUNT.load(deps.storage)? + 1;
    let participants = vec![info.sender.to_string()];

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
        participants,
        current_cycle: 0,
        is_active: true,
        payout_index: 0,
		created_by: info.sender.clone(),
    };

    PLANS.save(deps.storage, plan_id, &plan)?;
    PLAN_COUNT.save(deps.storage, &plan_id)?;
	
	// Update Creator list
	let mut ids = PLANS_BY_CREATOR
		.may_load(deps.storage, &info.sender)?
		.unwrap_or_default();
	ids.push(plan_id);
	PLANS_BY_CREATOR.save(deps.storage, &info.sender, &ids)?;

    Ok(Response::new()
        .add_attribute("method", "create_plan")
        .add_attribute("plan_id", plan_id.to_string()))
}

fn execute_join_plan(deps: DepsMut, info: MessageInfo, plan_id: u64) -> Result<Response, ContractError> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    let sender = info.sender.to_string();

    if plan.is_active {
        return Err(ContractError::PlanActive {});
    }
    if plan.participants.len() as u32 >= plan.total_participants {
        return Err(ContractError::PlanFull {});
    }
    if plan.participants.contains(&sender) {
        return Err(ContractError::AlreadyParticipant {});
    }

    let trust_score = 50; // TODO: integrate with real system
    if trust_score < plan.trust_score_required {
        return Err(ContractError::InsufficientTrustScore {});
    }

    plan.participants.push(sender.clone());
    if plan.participants.len() as u32 == plan.total_participants {
        plan.is_active = true;
    }

    PLANS.save(deps.storage, plan_id, &plan)?;
    Ok(Response::new()
        .add_attribute("method", "join_plan")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("participant", sender))
}

fn execute_contribute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    plan_id: u64,
    amount: Uint128,
) -> Result<Response, ContractError> {
    let plan = PLANS.load(deps.storage, plan_id)?;
    let sender = info.sender.clone();

    if !plan.is_active {
        return Err(ContractError::PlanNotActive {});
    }
    if !plan.participants.contains(&sender.to_string()) {
        return Err(ContractError::NotParticipant {});
    }

    // validate funds
    let sent = info.funds.iter().find(|c| c.denom == "uxion").map(|c| c.amount).unwrap_or_default();
    if sent < amount {
        return Err(ContractError::InvalidInput("Insufficient funds sent".to_string()));
    }

    let cycle = plan.current_cycle; // u32
    let key = (plan_id, cycle, sender.clone());
    let already = CONTRIBUTIONS_BY_CYCLE.may_load(deps.storage, key.clone())?.unwrap_or_default();

    // how much room left this cycle
    let required = plan.contribution_amount;
    if already >= required {
        return Err(ContractError::InvalidInput("Already fully contributed this cycle".to_string()));
    }

    if !plan.allow_partial && amount != required {
        return Err(ContractError::InvalidInput("Must contribute exact amount".to_string()));
    }

    // For partials, cap the top-up so they never exceed the per-cycle target
    let remaining = required.checked_sub(already).unwrap_or_default();
    if amount > remaining {
        return Err(ContractError::InvalidInput("Contribution exceeds remaining for this cycle".to_string()));
    }

    // Save per-cycle
    CONTRIBUTIONS_BY_CYCLE.save(deps.storage, key, &(already + amount))?;

    // Optional: keep lifetime total too
    // let lifetime_key = (plan_id, sender.clone());
    // let life = CONTRIBUTIONS.may_load(deps.storage, lifetime_key)?.unwrap_or_default();
    // CONTRIBUTIONS.save(deps.storage, lifetime_key, &(life + amount))?;

    Ok(Response::new()
        .add_attribute("action", "contribute")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("cycle", cycle.to_string())
        .add_attribute("amount", amount.to_string()))
}


// fn execute_distribute_payout(
//     deps: DepsMut,
//     _env: Env,
//     info: MessageInfo,
//     plan_id: u64,
// ) -> Result<Response, ContractError> {
//     let config = CONFIG.load(deps.storage)?;
//     let mut plan = PLANS.load(deps.storage, plan_id)?;

//     if info.sender != config.admin {
//         return Err(ContractError::Unauthorized("Only admin can distribute payouts".to_string()));
//     }
//     if !plan.is_active {
//         return Err(ContractError::PlanNotActive {});
//     }

//     let total_required = plan.contribution_amount * Uint128::from(plan.participants.len() as u128);
//     let mut total_actual = Uint128::zero();

//     for p in &plan.participants {
//         let addr = deps.api.addr_validate(p)?;
//         total_actual += CONTRIBUTIONS.may_load(deps.storage, (plan_id, &addr))?.unwrap_or(Uint128::zero());
//     }

//     if total_actual < total_required {
//         return Err(ContractError::InsufficientContributions {});
//     }

//     let recipient_str = &plan.participants[plan.payout_index as usize];
//     let recipient = deps.api.addr_validate(recipient_str)?;
//     let payout = total_required;

//     for p in &plan.participants {
//         let addr = deps.api.addr_validate(p)?;
//         CONTRIBUTIONS.save(deps.storage, (plan_id, &addr), &Uint128::zero())?;
//     }

//     plan.payout_index = (plan.payout_index + 1) % plan.participants.len() as u32;
//     plan.current_cycle += 1;
//     if plan.current_cycle >= plan.duration_months * plan_frequency_to_cycles(&plan.frequency) {
//         plan.is_active = false;
//     }

//     PLANS.save(deps.storage, plan_id, &plan)?;

//     let bank_msg = BankMsg::Send {
//         to_address: recipient.to_string(),
//         amount: vec![Coin {
//             denom: "uxion".to_string(),
//             amount: payout,
//         }],
//     };

//     Ok(Response::new()
//         .add_message(bank_msg)
//         .add_attribute("method", "distribute_payout")
//         .add_attribute("plan_id", plan_id.to_string())
//         .add_attribute("recipient", recipient.to_string())
//         .add_attribute("amount", payout.to_string()))
// }


#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetPlan { plan_id } => {
            let plan = query_plan(deps, plan_id)
                .map_err(|e| StdError::generic_err(e.to_string()))?;
            to_json_binary(&plan)
        }
		QueryMsg::GetPlansByCreator { creator } => {
			let res = query_plans_by_creator(deps, creator)?;
			to_json_binary(&res)
		}
		QueryMsg::GetPlanCount {} => { 
			let count = PLAN_COUNT.load(deps.storage)?;
			to_json_binary(&count)
		}
		QueryMsg::GetJoinRequests { plan_id } => {
			let res = query_join_requests(deps, plan_id)?;
			to_json_binary(&res)
		}
		QueryMsg::GetParticipantCycleStatus { plan_id, participant } => {
            to_json_binary(&query_participant_cycle_status(deps, plan_id, participant)?)
        }
    }
}

fn query_plan(deps: Deps, plan_id: u64) -> Result<PlanResponse, ContractError> {
    let plan = PLANS.may_load(deps.storage, plan_id)?;
    Ok(PlanResponse { plan })
}

fn query_plans_by_creator(
	deps: Deps,
	creator: String
) -> StdResult<Vec<PlanResponse>> {
    let creator_addr = deps.api.addr_validate(&creator)?;
    let ids = PLANS_BY_CREATOR.may_load(deps.storage, &creator_addr)?.unwrap_or_default();

    let mut plans = Vec::new();
    for id in ids {
        if let Some(plan) = PLANS.may_load(deps.storage, id)? {
            plans.push(PlanResponse { plan: Some(plan) });
        }
    }

    Ok(plans)
}

pub fn request_to_join_plan(
    deps: DepsMut,
    info: MessageInfo,
    plan_id: u64,
) -> Result<Response, ContractError> {
    let requester = info.sender.clone();

    // Check for existing request
    if JOIN_REQUESTS.has(deps.storage, (plan_id, requester.clone())) {
        return Err(ContractError::AlreadyRequested {});
    }

    let new_request = JoinRequest {
        plan_id,
        requester: requester.clone(),
        approvals: vec![],
		denials: vec![],
    };

    JOIN_REQUESTS.save(deps.storage, (plan_id, requester.clone()), &new_request)?;

    Ok(Response::new()
        .add_attribute("action", "request_to_join_plan")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("requester", requester))
}

pub fn approve_join_request(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    plan_id: u64,
    requester: String,
) -> Result<Response, ContractError> {
    let requester_addr = deps.api.addr_validate(&requester)?;
    let mut plan = PLANS.load(deps.storage, plan_id)?;
    let key = (plan_id, requester_addr.clone());

    // First, update approvals inside the closure
    let updated_request = JOIN_REQUESTS.update::<_, ContractError>(deps.storage, key.clone(), |maybe_request| {
        let mut request = maybe_request.ok_or(ContractError::NotFound {})?;

        if request.approvals.contains(&info.sender) || request.denials.contains(&info.sender) {
            return Ok::<JoinRequest, ContractError>(request);
        }

        request.approvals.push(info.sender.clone());
        Ok::<JoinRequest, ContractError>(request)
    })?;

    // Now apply side effects *after* the update to avoid borrow conflict
    if updated_request.approvals.len() * 2 >= plan.participants.len() {
        // 50%+ approved: add to participants, save plan, remove request
        plan.participants.push(requester_addr.to_string());
        PLANS.save(deps.storage, plan_id, &plan)?;
        JOIN_REQUESTS.remove(deps.storage, key);
    }

    Ok(Response::new()
        .add_attribute("action", "approve_join_request")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("requester", requester))
}


fn query_join_requests(deps: Deps, plan_id: u64) -> StdResult<JoinRequestsResponse> {
    let requests = JOIN_REQUESTS
        .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
        .filter_map(|item| {
            match item {
                Ok(((stored_plan_id, _addr), join_request)) if stored_plan_id == plan_id => Some(join_request),
                _ => None,
            }
        })
        .collect();

    Ok(JoinRequestsResponse { requests })
}

pub fn deny_join_request(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    plan_id: u64,
    requester: String,
) -> Result<Response, ContractError> {
    let requester_addr = deps.api.addr_validate(&requester)?;
    let plan = PLANS.load(deps.storage, plan_id)?;
    let key = (plan_id, requester_addr.clone());

    let updated_request = JOIN_REQUESTS.update::<_, ContractError>(deps.storage, key.clone(), |maybe_request| {
        let mut request = maybe_request.ok_or(ContractError::NotFound {})?;

        if request.approvals.contains(&info.sender) || request.denials.contains(&info.sender) {
            return Ok::<JoinRequest, ContractError>(request);
        }

        request.denials.push(info.sender.clone());
        Ok::<JoinRequest, ContractError>(request)
    })?;

    if updated_request.denials.len() * 2 > plan.participants.len() {
        // More than 50% denied: remove request
        JOIN_REQUESTS.remove(deps.storage, key);
    }

    Ok(Response::new()
        .add_attribute("action", "deny_join_request")
        .add_attribute("plan_id", plan_id.to_string())
        .add_attribute("requester", requester))
}


fn query_participant_cycle_status(
    deps: Deps,
    plan_id: u64,
    participant: String,
) -> StdResult<ParticipantCycleStatusResponse> {
    let plan = PLANS.load(deps.storage, plan_id)?;
    let addr = deps.api.addr_validate(&participant)?;
    let cycle = plan.current_cycle;

    let contributed = CONTRIBUTIONS_BY_CYCLE
        .may_load(deps.storage, (plan_id, cycle, addr))?
        .unwrap_or_default();

    let required = plan.contribution_amount;
    let remaining = required.saturating_sub(contributed);
    let fully = contributed >= required;

    Ok(ParticipantCycleStatusResponse {
        required,
        contributed_this_cycle: contributed,
        remaining_this_cycle: remaining,
        fully_contributed: fully,
    })
}
