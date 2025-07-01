import { Request, Response } from 'express';
import { PlanService } from '../services/planService';
import { Plan } from '../models/Plan';

export class PlanController {
  private planService: PlanService;

  constructor() {
    this.planService = new PlanService();
  }

  getAllPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const plans = await this.planService.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      res.status(500).json({ error: 'Failed to fetch plans' });
    }
  };

  createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Received plan creation request:', req.body);
      
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
      } = req.body;

      console.log('Extracted contract fields:', { contractAddress, contractTxHash });

      if (!name || !contributionAmount || !maxMembers || !duration) {
        res.status(400).json({ error: 'Required fields are missing' });
        return;
      }

      const planData: Omit<Plan, 'id' | 'createdAt'> = {
        name,
        description: description || '',
        initiator: initiator || '',
        totalParticipants: totalParticipants || maxMembers,
        contributionAmount,
        maxMembers,
        frequency: frequency || 'Monthly',
        duration,
        totalAmount: totalAmount || contributionAmount * maxMembers * duration,
        trustScoreRequired: trustScoreRequired || 0,
        allowPartial: allowPartial || false,
        contractAddress,
        contractTxHash,
        currentParticipants: 0,
        members: [],
        contributions: [],
        status: 'Open',
      };

      console.log('Plan data to be saved:', planData);

      const newPlan = await this.planService.createPlan(planData);
      console.log('Plan created successfully:', newPlan);
      res.status(201).json(newPlan);
    } catch (error) {
      console.error('Error creating plan:', error);
      res.status(500).json({ error: 'Failed to create plan' });
    }
  };

  getPlanById = async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await this.planService.getPlanById(req.params.id);
      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }
      res.json(plan);
    } catch (error) {
      console.error('Error fetching plan:', error);
      res.status(500).json({ error: 'Failed to fetch plan' });
    }
  };

  updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const updatedPlan = await this.planService.updatePlan(req.params.id, req.body);
      if (!updatedPlan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }
      res.json(updatedPlan);
    } catch (error) {
      console.error('Error updating plan:', error);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  };

  deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const success = await this.planService.deletePlan(req.params.id);
      if (!success) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting plan:', error);
      res.status(500).json({ error: 'Failed to delete plan' });
    }
  };

  joinPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        res.status(400).json({ error: 'Member ID is required' });
        return;
      }

      const plan = await this.planService.joinPlan(req.params.id, memberId);
      if (!plan) {
        res.status(404).json({ error: 'Plan not found or is full' });
        return;
      }
      res.json(plan);
    } catch (error) {
      console.error('Error joining plan:', error);
      res.status(500).json({ error: 'Failed to join plan' });
    }
  };

  leavePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId } = req.body;
      if (!memberId) {
        res.status(400).json({ error: 'Member ID is required' });
        return;
      }

      const plan = await this.planService.leavePlan(req.params.id, memberId);
      if (!plan) {
        res.status(404).json({ error: 'Plan not found' });
        return;
      }
      res.json(plan);
    } catch (error) {
      console.error('Error leaving plan:', error);
      res.status(500).json({ error: 'Failed to leave plan' });
    }
  };
} 