use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey}
use cardano/assets.{PolicyId}
use cardano/transaction.{OutputReference, Transaction}

// Types
pub type VerificationKeyHash =
  Hash<Blake2b_224, VerificationKey>

pub type MemberContribution {
  address: VerificationKeyHash,
  contributed: Int,
  last_contribution: Int  // Timestamp of last contribution
}

pub type PlanState {
  owner: VerificationKeyHash,
  name: String,
  description: String,
  target_amount: Int,
  contribution_amount: Int,
  max_members: Int,
  allow_partial: Bool,
  members: List<MemberContribution>,
  total_contributed: Int,
  frequency: String,  // 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly'
  duration: Int,      // Duration in months
  trust_score_required: Int,
  status: String,     // 'Open' | 'Active' | 'Completed'
  created_at: Int,    // Timestamp
  counter: Int        // For STT
}

pub type Redeemer {
  Create
  Join
  Contribute { amount: Int }
  Withdraw
  Close
}

// Helper functions
fn find_member(members: List<MemberContribution>, who: VerificationKeyHash) -> Option<MemberContribution> {
  list.find(members, fn(m: MemberContribution) { m.address == who })
}

pub fn is_member(members: List<MemberContribution>, who: VerificationKeyHash) -> Bool {
  find_member(members, who) != None
}

pub fn member_count(members: List<MemberContribution>) -> Int {
  list.length(members)
}

pub fn calculate_total_amount(contribution: Int, max_members: Int, duration: Int) -> Int {
  contribution * max_members * duration
}

// Main validator with STT
validator savings_plan(_utxo_ref: OutputReference) {
  // Minting policy for STT
  mint(_redeemer: Data, _policy_id: PolicyId, _self: Transaction) {
    True
  }

  // Spending validator
  spend(
    _optional_datum: Option<PlanState>,
    _redeemer: Redeemer,
    _own_ref: OutputReference,
    _self: Transaction,
  ) {
    True
  }
}
