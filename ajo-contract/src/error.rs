use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Plan not found with id {0}")]
    PlanNotFound(u64),

    #[error("Plan is already active")]
    PlanActive {},

    #[error("Plan is not active")]
    PlanNotActive {},

    #[error("Plan is already full")]
    PlanFull {},

    #[error("You are already a participant")]
    AlreadyParticipant {},

    #[error("You are not a participant")]
    NotParticipant {},

    #[error("Your trust score is too low to join this plan")]
    InsufficientTrustScore {},

    #[error("Not enough total contributions to distribute payout")]
    InsufficientContributions {},

	#[error("Join request already exists")]
    AlreadyRequested {},

    #[error("Join request not found")]
    JoinRequestNotFound {},

    #[error("Already approved")]
    AlreadyApproved {},

	#[error("Item not found")]
    NotFound,
}
