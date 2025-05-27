import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { mockPlans, mockUsers, getPlanParticipants, defaultUser } from '@/lib/mock-data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Check, Clock, Clock8, Users } from 'lucide-react';
import JoinPlanModal from '@/components/modals/JoinPlanModal';
import ContributeModal from '@/components/modals/ContributeModal';
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";


const PlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);

  const {
    isConnected,
  } = useCardano();

  // Find the plan from mock data
  const plan = mockPlans.find((p) => p.id === planId);

  // Get participants for this plan
  const participants = getPlanParticipants(planId || '');

  // Check if current user is already a participant
  const isParticipant = defaultUser.plans.includes(planId || '');

  // Calculate participation rate
  const participationRate = plan
    ? (plan.currentParticipants / plan.totalParticipants) * 100
    : 0;

  // Payout schedule calculation based on participants
  const payoutSchedule = [...participants, ...Array(plan && plan.totalParticipants - participants.length).fill(null)]
    .map((participant, index) => ({
      round: index + 1,
      date: new Date(new Date().getTime() + index * 30 * 24 * 60 * 60 * 1000),
      participant
    }));

  const handleJoinPlan = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first to join this plan",
        variant: "destructive",
      });
      return;
    }

    setJoinModalOpen(true);
  };

  const handleContribute = (roundNumber: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first to make a contribution",
        variant: "destructive",
      });
      return;
    }

    setSelectedRound(roundNumber);
    setContributeModalOpen(true);
  };

  if (!plan) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-3xl font-heading font-bold mb-4 text-vox-secondary">Plan not found</h1>
          <p className="mb-8 text-vox-secondary/70 font-sans">The savings plan you're looking for doesn't exist.</p>
          <Link to="/plans">
            <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">Browse Other Plans</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Plan Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-vox-secondary/60 mb-2 font-sans">
            <Link to="/plans" className="hover:text-vox-primary transition-colors">Plans</Link>
            <span>/</span>
            <span className="truncate">{plan.name}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading font-bold text-vox-secondary">{plan.name}</h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-vox-primary/10 text-vox-primary capitalize">
                  {plan.status}
                </span>
              </div>
              <p className="text-vox-secondary/70 mt-2 font-sans">{plan.description}</p>
            </div>

            {!isParticipant && plan.status === 'Open' && (
              <Button
                className="mt-4 md:mt-0 gradient-bg text-white font-sans hover:opacity-90 transition-opacity"
                onClick={handleJoinPlan}
              >
                Request to Join
              </Button>
            )}

            {isParticipant && (
              <div className="mt-4 md:mt-0 flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-md font-sans">
                <Check size={16} />
                <span>You're a participant</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-vox-primary">Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-vox-secondary/60 font-sans">Contribution</p>
                    <p className="font-bold text-lg text-vox-secondary">{plan.contributionAmount} ADA</p>
                    <p className="text-xs text-vox-secondary/60 font-sans">
                      {plan.frequency.toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-vox-secondary/60 font-sans">Duration</p>
                    <p className="font-bold text-lg text-vox-secondary">{plan.duration}</p>
                    <p className="text-xs text-vox-secondary/60 font-sans">
                      {plan.duration === 1 ? 'month' : 'months'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Users size={16} className="text-vox-secondary/40 mr-1" />
                      <span className="text-sm text-vox-secondary/60 font-sans">
                        {plan.currentParticipants}/{plan.totalParticipants} participants
                      </span>
                    </div>
                    <span className="text-sm text-vox-secondary/60 font-sans">
                      {participationRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={participationRate} className="h-2 bg-vox-primary/10" />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-vox-secondary/40 mr-1" />
                    <span className="text-sm text-vox-secondary/60 font-sans">Created</span>
                  </div>
                  <span className="text-sm font-medium text-vox-secondary font-sans">
                    {plan.createdAt.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users size={16} className="text-vox-secondary/40 mr-1" />
                    <span className="text-sm text-vox-secondary/60 font-sans">Initiator</span>
                  </div>
                  <span className="text-sm font-medium text-vox-secondary font-sans">
                    {plan.initiator}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrustScoreBadge score={plan.trustScoreRequired} size="sm" showLabel={false} />
                    <span className="text-sm text-gray-500 ml-1">Min. Trust Score</span>
                  </div>
                  <span className="text-sm font-medium">{plan.trustScoreRequired}/100</span>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full">View on Blockchain</Button>
                </div>
              </CardContent>
            </Card>

            {/* Total Pool Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Pool Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Pool Size</p>
                    <p className="font-bold text-2xl">{plan.totalAmount} ADA</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Current Round</p>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-ajo-light flex items-center justify-center text-ajo-tertiary font-medium">
                        1
                      </div>
                      <span className="ml-2 font-medium">of {plan.totalParticipants}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Next Payout</p>
                    <div className="flex items-center mt-1">
                      <Clock size={16} className="text-gray-500 mr-1" />
                      <span className="font-medium">May 8, 2025</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="schedule">Payout Schedule</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>How This Plan Works</CardTitle>
                    <CardDescription>
                      Understanding the savings rotation and contribution process.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      This is a {plan.frequency.toLowerCase()} rotating savings plan where each member
                      contributes {plan.contributionAmount} ADA {plan.frequency.toLowerCase()} for a period
                      of {plan.duration} {plan.duration === 1 ? 'month' : 'months'}.
                    </p>

                    <p>
                      Each {plan.frequency.toLowerCase()}, all members contribute to the pool, and one member
                      receives the entire pool amount. The order of recipients is determined by trust scores
                      and when they joined the plan.
                    </p>

                    <h3 className="font-bold text-lg mt-6">Key Features</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Smart contract-secured funds</li>
                      <li>Automatic payment execution</li>
                      <li>{plan.allowPartial ? 'Partial payments allowed' : 'Full payments required'}</li>
                      <li>Trust score-based recipient ordering</li>
                      <li>Community governance through voting</li>
                    </ul>
                  </CardContent>
                </Card>

                {isParticipant && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Your Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-green-800">Round 1 Contribution</p>
                              <p className="font-bold text-green-800">{plan.contributionAmount} ADA</p>
                            </div>
                            <div className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded flex items-center">
                              <Check size={12} className="mr-1" />
                              Paid
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg border p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-800">Round 2 Contribution</p>
                              <p className="font-bold">{plan.contributionAmount} ADA</p>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock8 size={14} className="mr-1" />
                              Due May 8, 2025
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              className="w-full bg-ajo-primary hover:bg-ajo-secondary text-white"
                              onClick={() => handleContribute(2)}
                            >
                              Make Contribution
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Plan Participants</CardTitle>
                      <div className="text-sm text-gray-500">
                        {plan.currentParticipants}/{plan.totalParticipants} members
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {participants.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600">
                              {participant.name.substring(0, 1)}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">{participant.name}</p>
                              <p className="text-xs text-gray-500">{participant.walletAddress}</p>
                            </div>
                          </div>
                          <TrustScoreBadge score={participant.trustScore} />
                        </div>
                      ))}

                      {/* Placeholder for empty slots */}
                      {Array(plan.totalParticipants - participants.length).fill(0).map((_, idx) => (
                        <div key={`empty-${idx}`} className="flex items-center justify-between p-3 border rounded-lg border-dashed">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              ?
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-400">Waiting for member</p>
                              <p className="text-xs text-gray-400">Open slot</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            Slot {participants.length + idx + 1}/{plan.totalParticipants}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader>
                    <CardTitle>Payout Schedule</CardTitle>
                    <CardDescription>
                      The order may change based on trust scores as the plan progresses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {payoutSchedule.map((payout, index) => (
                        <div
                          key={`payout-${index}`}
                          className={`flex items-center justify-between p-3 border rounded-lg ${index === 0 ? 'bg-ajo-light/20 border-ajo-light' : ''
                            }`}
                        >
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-ajo-primary flex items-center justify-center text-white font-medium">
                              {payout.round}
                            </div>
                            <div className="ml-3">
                              {payout.participant ? (
                                <>
                                  <p className="font-medium">{payout.participant.name}</p>
                                  <div className="flex items-center text-xs text-gray-500">
                                    <TrustScoreBadge score={payout.participant.trustScore} size="sm" showLabel={false} />
                                    <span className="ml-1">Score: {payout.participant.trustScore}</span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-gray-400">Waiting for participant</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{plan.contributionAmount * plan.totalParticipants} ADA</p>
                            <p className="text-xs text-gray-500">{payout.date.toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      {plan && (
        <>
          <JoinPlanModal
            planName={plan.name}
            planId={plan.id}
            open={joinModalOpen}
            onClose={() => setJoinModalOpen(false)}
          />

          <ContributeModal
            plan={plan}
            roundNumber={selectedRound}
            open={contributeModalOpen}
            onClose={() => setContributeModalOpen(false)}
          />
        </>
      )}
    </Layout>
  );
};

export default PlanDetail;
