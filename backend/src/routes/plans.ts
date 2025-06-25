import { Router } from 'express';
import { PlanController } from '../controllers/planController';

const router = Router();
const planController = new PlanController();

// Get all plans
router.get('/', planController.getAllPlans);

// Create a new plan
router.post('/', planController.createPlan);

// Get plan by ID
router.get('/:id', planController.getPlanById);

// Update plan
router.patch('/:id', planController.updatePlan);

// Delete plan
router.delete('/:id', planController.deletePlan);

// Join plan
router.post('/:id/join', planController.joinPlan);

// Leave plan
router.post('/:id/leave', planController.leavePlan);

// Get plans by initiator
router.get('/initiator/:initiatorAddress', planController.getPlansByInitiator);

export default router; 
