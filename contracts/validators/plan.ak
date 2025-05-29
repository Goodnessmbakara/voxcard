use aiken/collection/list
use aiken/crypto.{Blake2b_224, Hash, VerificationKey}
use cardano/address.{Credential, Script}
use cardano/assets.{PolicyId}
// use aiken/transaction.{ScriptContext, Spend, find_input, find_output}
// use aiken/transaction/value.{ AssetName, Value, }

use cardano/transaction.{Datum, OutputReference, Redeemer, Transaction}

// Data types for our plan system
pub type PubKeyHash =
  Hash<Blake2b_224, VerificationKey>

pub type PlanId =
  ByteArray

pub type PlanStatus {
  Active
  Full
  Cancelled
}

pub type Plan {
  id: PlanId,
  creator: PubKeyHash,
  title: ByteArray,
  description: ByteArray,
  max_participants: Int,
  current_participants: List<PubKeyHash>,
  required_deposit: Int,
  // in lovelace
  deadline: Int,
  // POSIX timestamp
  status: PlanStatus,
}

pub type PlanDatum {
  plan: Plan,
}

// Redeemer actions for the validator
pub type PlanRedeemer {
  CreatePlan
  JoinPlan { participant: PubKeyHash }
  CancelPlan
  CompletePlan
}

// Validator for plan operations
validator plan_validator(utxo_ref: OutputReference) {
  // fn (datum: PlanDatum, redeemer: PlanRedeemer, context: ScriptContext) -> Bool {
  //   when redeemer is {
  //     CreatePlan -> validate_create_plan(datum, context)
  //     JoinPlan { participant } -> validate_join_plan(datum, participant, context)
  //     CancelPlan -> validate_cancel_plan(datum, context)
  //     CompletePlan -> validate_complete_plan(datum, context)
  //   }
  // }

  validate_create_plan(datum: PlanDatum, context: ScriptContext) {
    let ScriptContext { transaction, purpose } = context
    when purpose is {
      Spend(output_reference) -> {
        // Check that the plan is properly initialized
        let plan = datum.plan
        // Ensure plan has valid parameters
        plan.max_participants > 0 && plan.required_deposit >= 0 && plan.deadline > 0 && plan.status == Active && list.length(
          plan.current_participants,
        ) == 0 && // Check that creator signed the transaction
        list.has(transaction.extra_signatories, plan.creator)
      }
      _ -> False
    }
  }

  validate_join_plan(
    datum: PlanDatum,
    participant: PubKeyHash,
    context: ScriptContext,
  ) {
    let ScriptContext { transaction, purpose } = context
    when purpose is {
      Spend(output_reference) -> {
        let plan = datum.plan
        // Find the output that continues this contract
        expect Some(output) = list.find(transaction.outputs, fn(out) { True })
        expect PlanDatum { plan: updated_plan } = output.datum
        // Validation conditions
        let can_join =
          plan.status == Active && !list.has(
            plan.current_participants,
            participant,
          ) && list.length(plan.current_participants) < plan.max_participants && list.has(
            transaction.extra_signatories,
            participant,
          )
        let correctly_updated =
          updated_plan.id == plan.id && updated_plan.creator == plan.creator && updated_plan.title == plan.title && updated_plan.description == plan.description && updated_plan.max_participants == plan.max_participants && updated_plan.required_deposit == plan.required_deposit && updated_plan.deadline == plan.deadline && list.has(
            updated_plan.current_participants,
            participant,
          ) && list.length(updated_plan.current_participants) == list.length(
            plan.current_participants,
          ) + 1
        // Check if plan becomes full after joining
        let status_updated =
          if list.length(updated_plan.current_participants) == plan.max_participants {
            updated_plan.status == Full
          } else {
            updated_plan.status == Active
          }
        // Check that required deposit is paid
        let deposit_paid = True
        // Simplified for now - implement proper value checking
        can_join && correctly_updated && status_updated && deposit_paid
      }
      _ -> False
    }
  }

  alidate_cancel_plan(datum: PlanDatum, context: ScriptContext) {
    let ScriptContext { transaction, purpose } = context
    when purpose is {
      Spend(output_reference) -> {
        let plan = datum.plan
        // Only creator can cancel, and only if plan is not full
        plan.status != Full && list.has(
          transaction.extra_signatories,
          plan.creator,
        )
      }
      _ -> False
    }
  }

  validate_complete_plan(datum: PlanDatum, context: ScriptContext) {
    let ScriptContext { transaction, purpose } = context
    when purpose is {
      Spend(output_reference) -> {
        let plan = datum.plan
        // Plan can be completed if it's full
        plan.status == Full && list.has(
          transaction.extra_signatories,
          plan.creator,
        )
      }
      _ -> False
    }
  }

  else(_) {
    fail
  }
}

// Helper functions removed for now - implement as needed for specific use cases

// Utility functions for off-chain code

pub fn create_plan_datum(
  id: PlanId,
  creator: PubKeyHash,
  title: ByteArray,
  description: ByteArray,
  max_participants: Int,
  required_deposit: Int,
  deadline: Int,
) -> PlanDatum {
  PlanDatum {
    plan: Plan {
      id,
      creator,
      title,
      description,
      max_participants,
      current_participants: [],
      required_deposit,
      deadline,
      status: Active,
    },
  }
}

pub fn get_plan_info(
  datum: PlanDatum,
) -> (PlanId, ByteArray, ByteArray, Int, Int, Int, PlanStatus) {
  let plan = datum.plan
  (
    plan.id,
    plan.title,
    plan.description,
    plan.max_participants,
    list.length(plan.current_participants),
    plan.required_deposit,
    plan.status,
  )
}

pub fn can_join_plan(datum: PlanDatum, participant: PubKeyHash) -> Bool {
  let plan = datum.plan
  plan.status == Active && !list.has(plan.current_participants, participant) && list.length(
    plan.current_participants,
  ) < plan.max_participants
}

pub fn is_plan_full(datum: PlanDatum) -> Bool {
  let plan = datum.plan
  list.length(plan.current_participants) >= plan.max_participants
}
