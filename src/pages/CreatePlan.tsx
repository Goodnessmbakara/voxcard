import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { emptyPlan } from '@/lib/mock-data';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { planApi } from '@/services/api';

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(3, { message: 'Plan name must be at least 3 characters' }).max(50),
  description: z.string().min(10, { message: 'Please provide a more detailed description' }).max(500),
  totalParticipants: z.number().min(2).max(100),
  contributionAmount: z.number().min(10).max(100000),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly']),
  duration: z.number().min(1).max(36),
  trustScoreRequired: z.number().min(0).max(100),
  allowPartial: z.boolean().default(false),
});

const CreatePlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: emptyPlan.name,
      description: emptyPlan.description,
      totalParticipants: emptyPlan.totalParticipants,
      contributionAmount: emptyPlan.contributionAmount,
      frequency: emptyPlan.frequency,
      duration: emptyPlan.duration,
      trustScoreRequired: emptyPlan.trustScoreRequired,
      allowPartial: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Create plan using the API
      const plan = await planApi.createPlan({
        name: values.name,
        description: values.description,
        maxMembers: values.totalParticipants,
        contributionAmount: values.contributionAmount,
        frequency: values.frequency,
        duration: values.duration,
        trustScoreRequired: values.trustScoreRequired,
        allowPartial: values.allowPartial,
      });
      
      toast({
        title: "Plan created successfully!",
        description: "Your plan has been created and is now open for participants.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error creating plan",
        description: "There was a problem creating your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-heading font-bold mb-6 text-vox-secondary">Create New Savings Plan</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-vox-primary">Plan Details</CardTitle>
            <CardDescription className="text-vox-secondary/80 font-sans">
              Define your savings circle parameters. Once created, the plan will be visible to potential 
              participants but will only start when the required number of members join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Community Savings Circle" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a clear, memorable name for your savings plan.
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
                        Provide details that will help potential members understand the plan.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="totalParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 2)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contributionAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Amount (ADA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 10)}
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
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (months)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="trustScoreRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Trust Score Required: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          max={100}
                          step={1}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <FormDescription>
                        Set the minimum trust score required for participants to join.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allowPartial"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Partial Payments</FormLabel>
                        <FormDescription>
                          Enable participants to make partial contributions based on their cash flow.
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
                    <h3 className="font-medium text-amber-800 mb-1">Important Information</h3>
                    <p className="text-sm text-amber-700">
                      Creating a plan will require a transaction on the Cardano blockchain. Make sure
                      your wallet is connected and has sufficient ADA for transaction fees.
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center sm:flex-row gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity w-full">
                      {isSubmitting ? 'Creating...' : 'Create Plan'}
                    </Button>
                  </div>
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
