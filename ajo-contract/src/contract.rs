// src/contract.rs

use cosmwasm_std::{
    entry_point, to_json_binary, Addr, Binary, Deps, 
	DepsMut, Env, MessageInfo, Response, StdError, 
	StdResult, Uint128, BankMsg, Coin
};

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, 
	PlanResponse, QueryMsg, JoinRequestsResponse, 
	ParticipantCycleStatusResponse};
use crate::state::{Config, Frequency, JoinRequest, Plan, CONFIG, CONTRIBUTIONS, JOIN_REQUESTS, PARTICIPANT_START, PLANS, PLANS_BY_CREATOR, PLAN_COUNT, TRUST_SCORE, USER_DEBT};
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
			env,
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
	env: Env,
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
        balance: Uint128::zero(),
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
	let now = env.block.time.seconds();
	PARTICIPANT_START.save(deps.storage, (plan_id, info.sender.clone()), &now)?;

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
    env: Env,
    info: MessageInfo,
    plan_id: u64,
    amount: Uint128,
) -> Result<Response, ContractError> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;
	let sender = info.sender.clone();

    if !plan.is_active {
        return Err(ContractError::PlanNotActive {});
    }
    if !plan.participants.contains(&sender.to_string()) {
        return Err(ContractError::NotParticipant {});
    }

    // Validate funds sent in uxion cover the declared `amount`
    let sent = info.funds.iter().find(|c| c.denom == "uxion").map(|c| c.amount).unwrap_or_default();
    if sent < amount {
        return Err(ContractError::InvalidInput("Insufficient funds sent".to_string()));
    }

    // Must have a personal start time (set when approved)
    let start_opt = PARTICIPANT_START.may_load(deps.storage, (plan_id, sender.clone()))?;
    let start = start_opt.ok_or_else(|| ContractError::InvalidInput("participant not started".into()))?;

    // Current personal cycle
    let frequency_str = match &plan.frequency {
        Frequency::Daily => "Daily",
        Frequency::Weekly => "Weekly",
        Frequency::Monthly => "Monthly",
    };
    let cycle = current_cycle_for_participant(start, &env, frequency_str);

    // If first top-up in this cycle, roll last cycle's unpaid portion into debt
    let already = CONTRIBUTIONS
        .may_load(deps.storage, (plan_id, sender.clone(), cycle))?
        .unwrap_or_default();

    if cycle > 0 && already.is_zero() {
        // Look at previous cycle
        let prev_cycle = cycle - 1;
        let prev_paid = CONTRIBUTIONS
            .may_load(deps.storage, (plan_id, sender.clone(), prev_cycle))?
            .unwrap_or_default();
        let prev_debt = plan.contribution_amount.saturating_sub(prev_paid);
        if !prev_debt.is_zero() {
            let existing = USER_DEBT
                .may_load(deps.storage, (plan_id, sender.clone()))?
                .unwrap_or_default();
            USER_DEBT.save(deps.storage, (plan_id, sender.clone()), &(existing + prev_debt))?;
        }
    }

    // Debt carried from earlier cycles (does NOT include this cycle’s required amount)
    let debt = USER_DEBT
        .may_load(deps.storage, (plan_id, sender.clone()))?
        .unwrap_or_default();

    // Target for THIS cycle = normal + prior debt
    let required_this_cycle = plan.contribution_amount + debt;

    // If we already reached or exceeded target, block further payment
    if already >= required_this_cycle {
        return Err(ContractError::InvalidInput("Already fully contributed this cycle".to_string()));
    }

    // If partials not allowed, you must pay the exact remaining now
    let remaining = required_this_cycle.checked_sub(already).unwrap_or_default();
    if !plan.allow_partial && amount != remaining {
        return Err(ContractError::InvalidInput("Must contribute exact amount".to_string()));
    }

    // Do not allow over-payment beyond this cycle target
    if amount > remaining {
        return Err(ContractError::InvalidInput("Contribution exceeds remaining for this cycle".to_string()));
    }

    // --- Accumulate this cycle’s contribution ---
    let new_total = already + amount;

	let mut trust_score = TRUST_SCORE
		.may_load(deps.storage, &sender)?
		.unwrap_or(50);
	
	// Case 1: full payment at once
	if amount == plan.contribution_amount && debt.is_zero() && already.is_zero() {
		trust_score += 10;
	}

	// Case 2: partial payment allowed
	else if amount < plan.contribution_amount && plan.allow_partial {
		trust_score += 5;
	}

	// Case 3: late payment (previous cycle unpaid but now covering it)
	else if !debt.is_zero() && amount > Uint128::zero() {
		trust_score += 4;
	}

	// Case 4: missed cycle entirely (already handled above, mark penalty here)
	if cycle > 0 {
		let prev_cycle = cycle - 1;
		let prev_paid = CONTRIBUTIONS
			.may_load(deps.storage, (plan_id, sender.clone(), prev_cycle))?
			.unwrap_or_default();
		if prev_paid.is_zero() {
			trust_score -= 15;
		}
	}


	plan.balance += amount;
    // --- Update debt progressively ---
    // Payment applies first to this cycle's normal contribution amount.
    // Any excess beyond `contribution_amount` reduces old `debt`.
    // extra_applied_to_debt = max(0, new_total - contribution_amount)
    let extra_applied_to_debt = if new_total > plan.contribution_amount {
        new_total.checked_sub(plan.contribution_amount).unwrap_or_default()
    } else {
        Uint128::zero()
    };
    let new_debt = debt.saturating_sub(extra_applied_to_debt);

    // Persist state
    TRUST_SCORE.save(deps.storage, &sender, &trust_score)?;
    PLANS.save(deps.storage, plan_id, &plan)?;
    CONTRIBUTIONS.save(deps.storage, (plan_id, sender.clone(), cycle), &new_total)?;
    USER_DEBT.save(deps.storage, (plan_id, sender.clone()), &new_debt)?;

    // ...right before returning Ok(Response::new()...)
let mut resp = Response::new()
    .add_attribute("action", "contribute")
    .add_attribute("plan_id", plan_id.to_string())
    .add_attribute("cycle", cycle.to_string())
    .add_attribute("from", info.sender)
    .add_attribute("amount", amount.to_string())
    .add_attribute("contributed_total_this_cycle", new_total.to_string())
    .add_attribute("debt_after", new_debt.to_string());

// attempt a payout if the pot has enough for one full round
if let Some(bank_msg) = try_auto_payout(deps, &env, plan_id)? {
    resp = resp
        .add_message(bank_msg)
        .add_attribute("auto_payout", "true");
}

Ok(resp)

}


fn try_auto_payout(
    deps: DepsMut,
    _env: &Env,
    plan_id: u64,
) -> Result<Option<BankMsg>, ContractError> {
    let mut plan = PLANS.load(deps.storage, plan_id)?;

    if !plan.is_active {
        return Ok(None);
    }

    let total_required =
        plan.contribution_amount * Uint128::from(plan.participants.len() as u128);

    // Only trigger when one full round is fundable
    if plan.balance < total_required {
        return Ok(None);
    }

    // Pay exactly one round; keep any extra in balance
    plan.balance = plan
        .balance
        .checked_sub(total_required)
        .map_err(|_| ContractError::InvalidInput("underflow".into()))?;

    // Round-robin recipient
    let recipient = deps
        .api
        .addr_validate(&plan.participants[plan.payout_index as usize])?;

    plan.payout_index = (plan.payout_index + 1) % plan.participants.len() as u32;
    plan.current_cycle += 1;

    // Optional: end plan after enough global cycles
    let total_cycles = plan.duration_months * cycles_per_month(&plan.frequency);
	if plan.current_cycle >= total_cycles {
		plan.is_active = false;
	}

    PLANS.save(deps.storage, plan_id, &plan)?;

    // NOTE: we are NOT zeroing per-user contributions here because your design uses
    // per-participant “personal cycles” (based on PARTICIPANT_START). If you later
    // switch to shared/global cycles, you’ll want to reset per-cycle buckets.

    let bank_msg = BankMsg::Send {
        to_address: recipient.to_string(),
        amount: vec![Coin {
            denom: "uxion".to_string(),
            amount: total_required,
        }],
    };

    Ok(Some(bank_msg))
}


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
            to_json_binary(&query_participant_cycle_status(deps, _env, plan_id, participant)?)
        }
        QueryMsg::GetTrustScore { user } => { 
            let res = query_trust_score(deps, user)?;
            to_json_binary(&res)
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

fn query_trust_score(
	deps: Deps,
	user: String
) -> StdResult<u64> {
	let account: Addr = deps.api.addr_validate(&user)?;

	let trust_score = TRUST_SCORE
		.may_load(deps.storage, &account)?
		.unwrap_or(50);

	Ok(trust_score)
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

	let mut trust_score = TRUST_SCORE
		.may_load(deps.storage, &requester_addr)?
		.unwrap_or(50);

    // Now apply side effects *after* the update to avoid borrow conflict
    if updated_request.approvals.len() * 2 >= plan.participants.len() {
        // 50%+ approved: add to participants, save plan, remove request
        let insert_at = plan.payout_index as usize;
		plan.participants.insert(insert_at, requester_addr.to_string());
		trust_score += 2;

        let now = _env.block.time.seconds();
        let requester_addr = deps.api.addr_validate(&requester)?;
        PARTICIPANT_START.save(deps.storage, (plan_id, requester_addr.clone()), &now)?;
        PLANS.save(deps.storage, plan_id, &plan)?;
        JOIN_REQUESTS.remove(deps.storage, key);
		TRUST_SCORE.save(deps.storage, &requester_addr, &trust_score)?;
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
    env: Env,
    plan_id: u64,
    participant: String,
) -> StdResult<ParticipantCycleStatusResponse> {
    let plan = PLANS.load(deps.storage, plan_id)?;
    let addr = deps.api.addr_validate(&participant)?;

    let start = PARTICIPANT_START.may_load(deps.storage, (plan_id, addr.clone()))?;
    
    let frequency_str = match &plan.frequency {
        Frequency::Daily => "Daily",
        Frequency::Weekly => "Weekly",
        Frequency::Monthly => "Monthly",
    };
    let cycle = current_cycle_for_participant(start.unwrap_or(0), &env, frequency_str);

    let contributed = CONTRIBUTIONS
        .may_load(deps.storage, (plan_id, addr.clone(), cycle))?
        .unwrap_or_else(Uint128::zero);

    let debt = USER_DEBT
        .may_load(deps.storage, (plan_id, addr.clone()))?
        .unwrap_or_else(Uint128::zero);

    let required = plan.contribution_amount;
    let remaining = required.saturating_sub(contributed);
    let fully = contributed >= required;

    Ok(ParticipantCycleStatusResponse {
        cycle: cycle,
        required,
        contributed_this_cycle: contributed,
        remaining_this_cycle: remaining,
        fully_contributed: fully,
        debt: debt,
    })
}

fn cycles_between(start: u64, now: u64, frequency: &str) -> u64 {
    if now <= start { return 0; }
    let seconds = now - start;
    match frequency {
        "Daily" | "daily" => seconds / 86_400,
        "Weekly" | "weekly" => seconds / (7 * 86_400),
        "Monthly" | "monthly" => seconds / (30 * 86_400),
        _ => 0,
    }
}

// Per-participant current cycle: uses their personal start time
fn current_cycle_for_participant(start_time: u64, env: &Env, frequency: &str) -> u64 {
    cycles_between(start_time, env.block.time.seconds(), frequency)
}

fn cycles_per_month(freq: &Frequency) -> u32 {
    match freq {
        Frequency::Daily => 30,   // rough month
        Frequency::Weekly => 4,   // 4 weeks ≈ month
        Frequency::Monthly => 1,
    }
}
