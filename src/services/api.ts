import { Plan } from '@/lib/mock-data';

// API response types
interface ApiResponse<T> {
  data: T;
  error?: string;
}

const API_BASE_URL = 'http://localhost:3001																																																																																																																																																																																																																																																														/api';

export interface CreatePlanData {
  name: string;
  description: string;
  maxMembers: number;
  contributionAmount: number;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  duration: number;
  trustScoreRequired: number;
  allowPartial: boolean;
}

export const planApi = {
  createPlan: async (planData: CreatePlanData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create plan');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getAllPlans: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch plans');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getPlanById: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch plan');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }
};

// API service class
export class ApiService {
  private static instance: ApiService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Create a new plan
  async createPlan(plan: Plan): Promise<ApiResponse<Plan>> {
    try {
      const response = await fetch(`${this.apiUrl}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });

      if (!response.ok) {
        throw new Error('Failed to create plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Create plan error:', error);
      throw error;
    }
  }

  // Get all plans
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    try {
      const response = await fetch(`${this.apiUrl}/plans`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      return await response.json();
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  }

  // Get plan by ID
  async getPlanById(id: string): Promise<ApiResponse<Plan>> {
    try {
      const response = await fetch(`${this.apiUrl}/plans/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Get plan error:', error);
      throw error;
    }
  }

  // Update plan
  async updatePlan(id: string, plan: Partial<Plan>): Promise<ApiResponse<Plan>> {
    try {
      const response = await fetch(`${this.apiUrl}/plans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Update plan error:', error);
      throw error;
    }
  }

  // Delete plan
  async deletePlan(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.apiUrl}/plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete plan error:', error);
      throw error;
    }
  }
}

// Hook to use the API service
export const useApi = () => {
  const apiService = ApiService.getInstance();

  return {
    createPlan: apiService.createPlan.bind(apiService),
    getPlans: apiService.getPlans.bind(apiService),
    getPlanById: apiService.getPlanById.bind(apiService),
    updatePlan: apiService.updatePlan.bind(apiService),
    deletePlan: apiService.deletePlan.bind(apiService),
  };
};

