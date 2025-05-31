import { Plan } from '../models/Plan';
import pool from '../config/database';

export class PlanService {
  async getAllPlans(): Promise<Plan[]> {
    const result = await pool.query('SELECT * FROM plans ORDER BY created_at DESC');
    return result.rows;
  }

  async createPlan(planData: Omit<Plan, 'id' | 'createdAt'>): Promise<Plan> {
    const {
      name,
      description,
      initiator,
      totalParticipants,
      contributionAmount,
      maxMembers,
      frequency,
      duration,
      totalAmount,
      trustScoreRequired,
      allowPartial,
      contractAddress,
      contractTxHash,
    } = planData;

    const result = await pool.query(
      `INSERT INTO plans (
        name, description, initiator, total_participants, contribution_amount,
        max_members, frequency, duration, total_amount, trust_score_required,
        allow_partial, contract_address, contract_tx_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name,
        description,
        initiator,
        totalParticipants,
        contributionAmount,
        maxMembers,
        frequency,
        duration,
        totalAmount,
        trustScoreRequired,
        allowPartial,
        contractAddress,
        contractTxHash,
      ]
    );

    return result.rows[0];
  }

  async getPlanById(id: string): Promise<Plan | null> {
    const result = await pool.query('SELECT * FROM plans WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async updatePlan(id: string, planData: Partial<Plan>): Promise<Plan | null> {
    const setClause = Object.keys(planData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(planData);
    
    const result = await pool.query(
      `UPDATE plans SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows[0] || null;
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM plans WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async joinPlan(planId: string, memberId: string): Promise<Plan | null> {
    const result = await pool.query(
      `UPDATE plans 
       SET members = array_append(members, $1),
           current_participants = current_participants + 1
       WHERE id = $2 
         AND current_participants < max_members
         AND NOT ($1 = ANY(members))
       RETURNING *`,
      [memberId, planId]
    );
    return result.rows[0] || null;
  }

  async leavePlan(planId: string, memberId: string): Promise<Plan | null> {
    const result = await pool.query(
      `UPDATE plans 
       SET members = array_remove(members, $1),
           current_participants = current_participants - 1
       WHERE id = $2
       RETURNING *`,
      [memberId, planId]
    );
    return result.rows[0] || null;
  }
} 