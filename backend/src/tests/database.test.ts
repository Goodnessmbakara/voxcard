import pool from '../config/database';
import { PlanService } from '../services/planService';
import { Plan } from '../models/Plan';

async function testDatabaseConnection() {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to database');
    client.release();

    // Test plan creation
    const planService = new PlanService();
    const dummyPlan: Omit<Plan, 'id' | 'createdAt'> = {
      name: "Test Savings Plan",
      description: "A test plan to verify database connection",
      initiator: "test@example.com",
      totalParticipants: 5,
      currentParticipants: 1,
      contributionAmount: 1000,
      maxMembers: 10,
      members: [],
      contributions: [],
      frequency: "Monthly" as const,
      duration: 30,
      totalAmount: 5000,
      status: "Open" as const,
      trustScoreRequired: 0,
      allowPartial: false
    };

    const plan = await planService.createPlan(dummyPlan);
    console.log('✅ Successfully created test plan:', plan);

    // Clean up - delete the test plan
    await planService.deletePlan(plan.id);
    console.log('✅ Successfully cleaned up test plan');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test
testDatabaseConnection(); 
