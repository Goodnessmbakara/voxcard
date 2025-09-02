export interface CreatePlanInput {
  name: string;
  description: string;
  total_participants: number;
  contribution_amount: string;
  frequency: string;
  duration_months: number;
  trust_score_required: number;
  allow_partial: boolean;
}

export interface Plan {
    id: string;
    name: string;
    description: string;
    created_by: string;
    total_participants: number;
    participants: string[];
    contribution_amount: string;
    frequency: 'Daily' | 'Weekly' | 'Monthly';
    duration_months: number;
    trust_score_required: number;
    allow_partial: boolean;
	current_cycle: number;
	is_active: boolean;
	payout_index: number;
}

export type ParticipantCycleStatus = {
  cycle: number;
  required: string;
  contributed_this_cycle: string;
  remaining_this_cycle: string;
  fully_contributed: boolean;
  debt: string;
};
