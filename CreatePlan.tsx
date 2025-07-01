import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { emptyPlan } from "@/lib/mock-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useContract } from "@/context/ContractProvider";

const formSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  totalParticipants: z.number().min(2).max(100),
  contributionAmount: z.number().min(10).max(100000),
  frequency: z.enum(["Daily", "Weekly", "Monthly"]),
  duration: z.number().min(1).max(36),
  trustScoreRequired: z.number().min(0).max(100),
  allowPartial: z.boolean().default(false),
});

const CreatePlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPlan, address } = useContract();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyPlan,
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createPlan({
        name: values.name,
        description: values.description,
        total_participants: values.totalParticipants,
        contribution_amount: values.contributionAmount.toString(),
        frequency: values.frequency,
        duration_months: values.duration,
        trust_score_required: values.trustScoreRequired,
        allow_partial: values.allowPartial,
      });

      toast({
        title: "Plan created on chain!",
        description: "Transaction submitted successfully.",
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast({
        title: "Blockchain error",
        description: "Failed to create plan. Check logs and retry.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-heading font-bold mb-6 text-vox-secondary">
          Create New Savings Plan
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-vox-primary">
              Plan Details
            </CardTitle>
            <CardDescription className="text-vox-secondary/80 font-sans">
              Define your savings circle parameters. Once created, the plan will
              be visible to potential participants but will only start when the
              required number of members join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Fields remain unchanged */}
                {/* ... */}
                <div className="flex flex-col items-center sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity w-full"
                  >
                    {isSubmitting ? "Creating..." : "Create Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreatePlan;
