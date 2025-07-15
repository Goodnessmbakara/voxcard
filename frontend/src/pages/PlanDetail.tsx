import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Footer";
import TrustScoreBadge from "@/components/shared/TrustScoreBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/context/ContractProvider";
import { Plan } from "@/types/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Calendar, Check, Clock, Users } from "lucide-react";
import JoinPlanModal from "@/components/modals/JoinPlanModal";
import ContributeModal from "@/components/modals/ContributeModal";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { shortenAddress } from "@/services/utils";

const PlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  const [plan, setPlan] = useState<Plan | null>(null);

  const { data: account } = useAbstraxionAccount();
  const { getPlanById } = useContract();
  const address = (account?.bech32Address || "").toLowerCase();
  const participants = Array.isArray(plan?.participants) ? plan.participants : [];
  const isParticipantOrAdmin =
    participants.map((addr) => addr.toLowerCase()).includes(address) ||
    plan?.created_by?.toLowerCase() === address;

  useEffect(() => {
    const fetchPlan = async () => {
      if (planId) {
        const res = await getPlanById(Number(planId));
        if (res?.plan) setPlan(res.plan);
      }
    };
    fetchPlan();
  }, [planId, address]);

  const handleJoinPlan = () => {
    toast({
      title: "Wallet not connected",
      description: "Please connect your wallet first to join this plan",
      variant: "destructive",
    });
  };

  const handleContribute = (roundNumber: number) => {
    setSelectedRound(roundNumber);
    setContributeModalOpen(true);
  };

  if (!plan) {
    return (
		<>
			<div className="container py-16 text-center">
			<h1 className="text-3xl font-heading font-bold mb-4 text-vox-secondary">
				Loading Plan...
			</h1>
			<p className="mb-8 text-vox-secondary/70 font-sans">
				Please wait while we fetch plan details.
			</p>
			<Link to="/plans">
				<Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
				Back to Plans
				</Button>
			</Link>
			</div>
		</>
        
    );
  }

  const participationRate = plan.total_participants > 0
    ? (participants.length / plan.total_participants) * 100
    : 0;

  return (
    <>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-heading font-bold text-vox-secondary">{plan.name}</h1>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-vox-primary/10 text-vox-primary capitalize">
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-vox-secondary/70 mt-2 font-sans">{plan.description}</p>
            </div>

            {!isParticipantOrAdmin && (
              <Button
                className="mt-4 md:mt-0 gradient-bg text-white"
                onClick={handleJoinPlan}
              >
                Request to Join
              </Button>
            )}
			
			{plan?.created_by?.toLowerCase() === address && (
				<Button
					className="mt-4 md:mt-0 gradient-bg text-white"
					onClick={() => {
					// Call your activate/deactivate function here
					console.log("Toggle plan active state");
					}}
				>
					{plan?.is_active ? "Deactivate" : "Activate"}
				</Button>
			)}

            {isParticipantOrAdmin && (
              <div className="mt-4 md:mt-0 flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-md">
                <Check size={16} />
                <span>You're a participant</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-vox-secondary/60">Contribution</p>
                    <p className="font-bold text-lg">{plan.contribution_amount} XION</p>
                    <p className="text-xs text-vox-secondary/60">{plan.frequency.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-vox-secondary/60">Duration</p>
                    <p className="font-bold text-lg">{plan.duration_months}</p>
                    <p className="text-xs text-vox-secondary/60">
                      {plan.duration_months === 1 ? "month" : "months"}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <Users size={16} className="mr-1 text-vox-secondary/50" />
                      <span className="text-sm">{participants.length}/{plan.total_participants} participants</span>
                    </div>
                    <span className="text-sm">{participationRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={participationRate} className="h-2" />
                </div>

                <div className="flex justify-between pt-2">
                  <span className="text-sm text-vox-secondary/60">Initiator</span>
                  <span className="text-sm">{shortenAddress(plan.created_by)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-vox-secondary/60">Min Trust Score</span>
                  <span className="text-sm">{plan.trust_score_required}/100</span>
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

              {/* Overview */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>How This Plan Works</CardTitle>
                    <CardDescription>Understand the savings rotation process.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>This is a {plan.frequency.toLowerCase()} plan where each member contributes {plan.contribution_amount} XION for {plan.duration_months} {plan.duration_months === 1 ? "month" : "months"}.</p>
                    <p>One member gets the pooled amount each cycle. The order is based on trust scores and join order.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Members */}
              <TabsContent value="members">
                <Card>
                  <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {participants.map((participant, idx) => (
                      <div key={idx} className="flex justify-between p-3 border rounded">
                        <span className="font-mono">{participant}</span>
                        <TrustScoreBadge score={50} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Payout Schedule */}
              <TabsContent value="schedule">
                <Card>
                  <CardHeader><CardTitle>Payout Schedule</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {participants.map((participant, idx) => (
                      <div key={idx} className={`flex justify-between p-3 border rounded ${idx === plan.payout_index ? 'bg-green-50' : ''}`}>
                        <span>{idx + 1}. {participant}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <JoinPlanModal planName={plan.name} planId={plan.id} open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
      <ContributeModal plan={plan} roundNumber={selectedRound} open={contributeModalOpen} onClose={() => setContributeModalOpen(false)} />
    </>
  );
};

export default PlanDetail;
