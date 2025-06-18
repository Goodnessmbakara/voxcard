use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo,
    Response, StdResult, Uint128, CosmosMsg, BankMsg, Coin,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use cw_storage_plus::{Item, Map};

// Contract state
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: String,
    pub min_balance: Uint128,
    pub max_gas_subsidy: Uint128,
    pub whitelisted_contracts: Vec<String>,
}

// Messages that can be sent to the contract
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    UpdateConfig {
        min_balance: Option<Uint128>,
        max_gas_subsidy: Option<Uint128>,
        whitelisted_contracts: Option<Vec<String>>,
    },
    AddWhitelistedContract {
        contract_address: String,
    },
    RemoveWhitelistedContract {
        contract_address: String,
    },
    ExecuteGaslessTransaction {
        contract_address: String,
        msg: Binary,
        gas_amount: Uint128,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    GetConfig {},
    IsContractWhitelisted {
        contract_address: String,
    },
    GetTreasuryBalance {},
}

// State storage
const CONFIG: Item<Config> = Item::new("config");
const TRANSACTION_COUNTER: Item<u64> = Item::new("transaction_counter");
const GAS_USAGE: Map<&str, Uint128> = Map::new("gas_usage");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let config = Config {
        admin: info.sender.to_string(),
        min_balance: msg.min_balance,
        max_gas_subsidy: msg.max_gas_subsidy,
        whitelisted_contracts: msg.whitelisted_contracts,
    };
    CONFIG.save(deps.storage, &config)?;
    TRANSACTION_COUNTER.save(deps.storage, &0u64)?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", info.sender))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::UpdateConfig { min_balance, max_gas_subsidy, whitelisted_contracts } => {
            execute_update_config(deps, info, min_balance, max_gas_subsidy, whitelisted_contracts)
        }
        ExecuteMsg::AddWhitelistedContract { contract_address } => {
            execute_add_whitelisted_contract(deps, info, contract_address)
        }
        ExecuteMsg::RemoveWhitelistedContract { contract_address } => {
            execute_remove_whitelisted_contract(deps, info, contract_address)
        }
        ExecuteMsg::ExecuteGaslessTransaction { contract_address, msg, gas_amount } => {
            execute_gasless_transaction(deps, env, info, contract_address, msg, gas_amount)
        }
    }
}

pub fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    min_balance: Option<Uint128>,
    max_gas_subsidy: Option<Uint128>,
    whitelisted_contracts: Option<Vec<String>>,
) -> StdResult<Response> {
    let mut config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    if let Some(min_balance) = min_balance {
        config.min_balance = min_balance;
    }
    if let Some(max_gas_subsidy) = max_gas_subsidy {
        config.max_gas_subsidy = max_gas_subsidy;
    }
    if let Some(whitelisted_contracts) = whitelisted_contracts {
        config.whitelisted_contracts = whitelisted_contracts;
    }

    CONFIG.save(deps.storage, &config)?;
    Ok(Response::new().add_attribute("method", "update_config"))
}

pub fn execute_add_whitelisted_contract(
    deps: DepsMut,
    info: MessageInfo,
    contract_address: String,
) -> StdResult<Response> {
    let mut config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    if !config.whitelisted_contracts.contains(&contract_address) {
        config.whitelisted_contracts.push(contract_address.clone());
        CONFIG.save(deps.storage, &config)?;
    }

    Ok(Response::new()
        .add_attribute("method", "add_whitelisted_contract")
        .add_attribute("contract_address", contract_address))
}

pub fn execute_remove_whitelisted_contract(
    deps: DepsMut,
    info: MessageInfo,
    contract_address: String,
) -> StdResult<Response> {
    let mut config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(StdError::generic_err("Unauthorized"));
    }

    config.whitelisted_contracts.retain(|x| x != &contract_address);
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "remove_whitelisted_contract")
        .add_attribute("contract_address", contract_address))
}

pub fn execute_gasless_transaction(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    contract_address: String,
    msg: Binary,
    gas_amount: Uint128,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;
    
    // Verify contract is whitelisted
    if !config.whitelisted_contracts.contains(&contract_address) {
        return Err(StdError::generic_err("Contract not whitelisted"));
    }

    // Verify gas subsidy is within limits
    if gas_amount > config.max_gas_subsidy {
        return Err(StdError::generic_err("Gas subsidy exceeds maximum allowed"));
    }

    // Check treasury balance
    let balance = deps.querier.query_balance(&env.contract.address, "uxion")?;
    if balance.amount < config.min_balance {
        return Err(StdError::generic_err("Insufficient treasury balance"));
    }

    // Increment transaction counter
    let counter = TRANSACTION_COUNTER.load(deps.storage)? + 1;
    TRANSACTION_COUNTER.save(deps.storage, &counter)?;

    // Record gas usage
    let user_address = info.sender.to_string();
    let current_gas_usage = GAS_USAGE.may_load(deps.storage, &user_address)?.unwrap_or(Uint128::zero());
    GAS_USAGE.save(deps.storage, &user_address, &(current_gas_usage + gas_amount))?;

    // Create message to forward to target contract with gas subsidy
    let forward_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: contract_address.clone(),
        amount: vec![Coin {
            denom: "uxion".to_string(),
            amount: gas_amount,
        }],
    });

    Ok(Response::new()
        .add_message(forward_msg)
        .add_attribute("method", "execute_gasless_transaction")
        .add_attribute("contract_address", contract_address)
        .add_attribute("gas_amount", gas_amount)
        .add_attribute("transaction_id", counter.to_string()))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetConfig {} => to_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::IsContractWhitelisted { contract_address } => {
            let config = CONFIG.load(deps.storage)?;
            to_binary(&config.whitelisted_contracts.contains(&contract_address))
        }
        QueryMsg::GetTreasuryBalance {} => {
            let balance = deps.querier.query_balance(_env.contract.address, "uxion")?;
            to_binary(&balance)
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub min_balance: Uint128,
    pub max_gas_subsidy: Uint128,
    pub whitelisted_contracts: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{coins, from_binary};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let msg = InstantiateMsg {
            min_balance: Uint128::new(1000000),
            max_gas_subsidy: Uint128::new(500000),
            whitelisted_contracts: vec!["contract1".to_string()],
        };
        let info = mock_info("creator", &[]);
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());

        // Query the config
        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetConfig {}).unwrap();
        let config: Config = from_binary(&res).unwrap();
        assert_eq!(config.admin, "creator");
        assert_eq!(config.min_balance, Uint128::new(1000000));
        assert_eq!(config.max_gas_subsidy, Uint128::new(500000));
        assert_eq!(config.whitelisted_contracts, vec!["contract1".to_string()]);
    }

    #[test]
    fn test_add_whitelisted_contract() {
        let mut deps = mock_dependencies();
        
        // Initialize contract
        let msg = InstantiateMsg {
            min_balance: Uint128::new(1000000),
            max_gas_subsidy: Uint128::new(500000),
            whitelisted_contracts: vec![],
        };
        let info = mock_info("creator", &[]);
        instantiate(deps.as_mut(), mock_env(), info.clone(), msg).unwrap();

        // Add whitelisted contract
        let msg = ExecuteMsg::AddWhitelistedContract {
            contract_address: "new_contract".to_string(),
        };
        let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(res.attributes.len(), 2);

        // Query to verify
        let res = query(
            deps.as_ref(),
            mock_env(),
            QueryMsg::IsContractWhitelisted {
                contract_address: "new_contract".to_string(),
            },
        )
        .unwrap();
        let is_whitelisted: bool = from_binary(&res).unwrap();
        assert!(is_whitelisted);
    }
} 