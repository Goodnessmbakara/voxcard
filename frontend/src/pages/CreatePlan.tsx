import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Footer";
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
import { useContract } from "../context/ContractProvider";
import { CreatePlanInput } from "@/types/utils";


// Form schema with validation
const formSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(500),
  total_participants: z.number().min(2).max(100),
  contribution_amount: z.string().min(1), // string for contract
  frequency: z.enum(["Daily", "Weekly", "Monthly"]),
  duration_months: z.number().min(1).max(36),
  trust_score_required: z.number().min(0).max(100),
  allow_partial: z.boolean().default(false),
});

const CreatePlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPlan, address } = useContract();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
		name: "",
		description: "",
		total_participants: 2,
		contribution_amount: "10",
		frequency: "Monthly",
		duration_months: 1,
		trust_score_required: 0,
		allow_partial: false,
	},
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
	console.log(values)
    try {
      await createPlan(values as CreatePlanInput);

      toast({
        title: "Group created on chain!",
        description: "Transaction submitted successfully.",
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast({
        title: "Blockchain error",
        description: "Failed to create group. Check logs and retry.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="container py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-heading font-bold mb-6 text-vox-secondary">
          Create New Savings Group
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-vox-primary">
              Group Details
            </CardTitle>
            <CardDescription className="text-vox-secondary/80 font-sans">
              Define your savings circle parameters. Once created, the group will
              be visible to potential participants but will only start when the
              required number of members join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Community Savings Circle"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a clear, memorable name for your savings group.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose and goals of this savings circle..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details that will help potential members
                        understand the group.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="total_participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 2)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contribution_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Amount (XION)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (months)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="trust_score_required"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Minimum Trust Score Required: {field.value}
                      </FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          max={100}
                          step={1}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the minimum trust score required for participants to
                        join.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allow_partial"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Allow Partial Payments
                        </FormLabel>
                        <FormDescription>
                          Enable participants to make partial contributions
                          based on their cash flow.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-amber-800 mb-1">
                      Important Information
                    </h3>
                    <p className="text-sm text-amber-700">
                      Creating a group will require a transaction on the XION
                      blockchain. Make sure you are signed in and have
                      sufficient XION for transaction fees.
                    </p>
                  </div>

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
                      {isSubmitting ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreatePlan;
