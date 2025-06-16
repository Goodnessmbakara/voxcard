import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useContract } from "../services/contract";
import { useApi } from "../services/api";
import { Plan } from "../lib/mock-data";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

const planSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  targetAmount: z.number().min(1, "Target amount must be greater than 0"),
  contributionAmount: z
    .number()
    .min(1, "Contribution amount must be greater than 0"),
  duration: z.number().min(1, "Duration must be greater than 0"),
  maxMembers: z.number().min(1, "Maximum members must be greater than 0"),
});

type PlanFormData = z.infer<typeof planSchema>;

export function CreatePlan() {
  const navigate = useNavigate();
  const { deployContract } = useContract();
  const { createPlan } = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
  });

  const onSubmit = async (data: PlanFormData) => {
    try {
      setIsSubmitting(true);

      // Create plan object
      const plan: Plan = {
        id: crypto.randomUUID(),
        name: data.name,
        description: "",
        initiator: "",
        totalParticipants: data.maxMembers,
        currentParticipants: 0,
        contributionAmount: data.contributionAmount,
        maxMembers: data.maxMembers,
        members: [],
        contributions: [],
        frequency: "Monthly",
        duration: data.duration,
        totalAmount: data.contributionAmount * data.maxMembers * data.duration,
        status: "Open",
        trustScoreRequired: 0,
        createdAt: new Date(),
        allowPartial: false,
      };

      // Deploy smart contract
      const { address, txHash } = await deployContract(plan);

      // Store plan data with contract address
      const savedPlan = await createPlan({
        ...plan,
        contractAddress: address,
        contractTxHash: txHash,
      });

      toast.success("Plan created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error("Failed to create plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Create New Savings Plan</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter plan name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAmount">Target Amount (XION)</Label>
          <Input
            id="targetAmount"
            type="number"
            {...register("targetAmount", { valueAsNumber: true })}
            placeholder="Enter target amount"
          />
          {errors.targetAmount && (
            <p className="text-red-500 text-sm">
              {errors.targetAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contributionAmount">Contribution Amount (XION)</Label>
          <Input
            id="contributionAmount"
            type="number"
            {...register("contributionAmount", { valueAsNumber: true })}
            placeholder="Enter contribution amount"
          />
          {errors.contributionAmount && (
            <p className="text-red-500 text-sm">
              {errors.contributionAmount.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (days)</Label>
          <Input
            id="duration"
            type="number"
            {...register("duration", { valueAsNumber: true })}
            placeholder="Enter duration in days"
          />
          {errors.duration && (
            <p className="text-red-500 text-sm">{errors.duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxMembers">Maximum Members</Label>
          <Input
            id="maxMembers"
            type="number"
            {...register("maxMembers", { valueAsNumber: true })}
            placeholder="Enter maximum number of members"
          />
          {errors.maxMembers && (
            <p className="text-red-500 text-sm">{errors.maxMembers.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Plan..." : "Create Plan"}
        </Button>
      </form>
    </div>
  );
}
