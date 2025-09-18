import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Check, Users } from "lucide-react";
import ContributeModal from "@/components/modals/ContributeModal";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { shortenAddress } from "@/services/utils";
import type { ParticipantCycleStatus } from "@/types/utils";


const PlanDetail = () => {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const { planId } = useParams<{ planId: string }>();
  const { 
	requestJoinPlan, 
	getJoinRequests,
	approveJoinRequest,
	denyJoinRequest,
	getParticipantCycleStatus,
	getTrustScore
 } = useContract();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const { data: account } = useAbstraxionAccount();
  const { getPlanById } = useContract();
  const address = (account?.bech32Address || "").toLowerCase();
  const participants = Array.isArray(plan?.participants) ? plan.participants : [];
  const isParticipantOrAdmin =
    participants.map((addr) => addr.toLowerCase()).includes(address) ||
    plan?.created_by?.toLowerCase() === address;

	const [cycleStatus, setCycleStatus] = useState<ParticipantCycleStatus | null>(null);

	const contributeDisabled =
		!isParticipantOrAdmin ||
		(cycleStatus?.fully_contributed ?? false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (planId) {
        const res = await getPlanById(Number(planId));
        if (res?.plan) setPlan(res.plan);
      }
    };
    fetchPlan();
  }, [planId, address, refreshNonce]);

  useEffect(() => {
	const fetchRequests = async () => {
		if (planId && isParticipantOrAdmin) {
		try {
			const res = await getJoinRequests(Number(planId));
			setJoinRequests(res?.requests ?? []);
		} catch (err) {
			console.error("Failed to fetch join requests:", err);
		}
		}
	};
	fetchRequests();
	}, [planId, isParticipantOrAdmin, refreshNonce]);

	useEffect(() => {
		const fetchStatus = async () => {
			if (!planId || !address) return;
			try {
			const res = await getParticipantCycleStatus(Number(planId), address);
			setCycleStatus(res);
			} catch (e) {
			console.error("GetParticipantCycleStatus failed:", e);
			setCycleStatus(null);
			}
		};
		fetchStatus();
	}, [planId, address, refreshNonce]);

	const refetchAll = () => setRefreshNonce(n => n + 1);
	
  const handleJoinPlan = async () => {
	if (!planId || !address) {
		toast({
		title: " You are not signed in",
		description: "Please sign up to join this group",
		variant: "destructive",
		});
		return;
	}

	try {
		setJoining(true);
		await requestJoinPlan(Number(planId));
		setJoined(true);
	} catch (error) {
		console.error(error.message)
		toast({
		title: "Join request failed",
		description: (error as Error).message || "Something went wrong",
		variant: "destructive",
		});
	} finally {
		setTimeout(() => {
		setJoining(false);
		setJoined(false);
		}, 2000);
	}
	};

	const handleAcceptOrDenyRequest = async (
		planId: number,
		requester: string,
		isApprove: boolean
		) => {
		try {
			if (isApprove) {
			await approveJoinRequest(planId, requester);
			toast({
				title: "Approved",
				description: `${requester} has been approved.`,
			});
			} else {
			await denyJoinRequest(planId, requester);
			toast({
				title: "Denied",
				description: `${requester} has been denied.`,
			});
			}

			// Remove from list after action
			setJoinRequests((prev) =>
			prev.filter((r) => r.requester !== requester)
			);
			refetchAll()
		} catch (err) {
			console.error(err.message)
			toast({
			title: "Error",
			description: (err as Error).message,
			variant: "destructive",
			});
		}
	};


	const filteredJoinRequests = joinRequests.filter(
		(request) =>
			!request.approvals.includes(address) && !request.denials.includes(address)
	);

  const handleContribute = async () => {
    setContributeModalOpen(true);
  };

  const [trustScores, setTrustScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchScores = async () => {
      const scores: Record<string, number> = {};
      for (const participant of participants) {
        const score = await getTrustScore(participant);
        scores[participant] = Number(score);
      }
      setTrustScores(scores);
    };

    fetchScores();
  }, [participants]);

  if (!plan) {
    return (
		<>
			<div className="container py-16 text-center">
			<h1 className="text-3xl font-heading font-bold mb-4 text-vox-secondary">
				Loading Group...
			</h1>
			<p className="mb-8 text-vox-secondary/70 font-sans">
				Please wait while we fetch group details.
			</p>
			<Link to="/groups">
				<Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
				Back to Groups
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
      <div className="container min-h-screen py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center">
            <div className="w-96">
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
					console.log("Toggle group active state");
					}}
				>
					{plan?.is_active ? "Deactivate" : "Activate"}
				</Button>
			)}

			<div className="flex gap-2">
				{isParticipantOrAdmin && (
				<div className="mt-4 md:mt-0 flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-md">
					<Check size={16} />
					<span>You're a participant</span>
				</div>
				)}

				{isParticipantOrAdmin && (
					<Button
						className="mt-4 md:mt-0 gradient-bg text-white"
						onClick={handleContribute}
						disabled={contributeDisabled}
						title={cycleStatus?.fully_contributed ? "You already contributed this cycle" : undefined}
					>
						{cycleStatus?.fully_contributed ? "Contributed" : "Contribute"}
					</Button>
				)}
			</div>
            
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Details</CardTitle>
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

			{isParticipantOrAdmin && (
				<Card>
					<CardHeader>
						<CardTitle>Your Contribution</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{cycleStatus?.fully_contributed ? (
							<p>You have completed payment for this cycle.</p>
						) : (
							<>
								<p>Xion contributed to Cycle: <b>{cycleStatus?.contributed_this_cycle} Xion</b></p>
								<p>Xion unpaid to Cycle: <b>{cycleStatus?.remaining_this_cycle} Xion</b></p>
							</>
						)}
					</CardContent>
				</Card>

			)}

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
                    <CardTitle>How This Group Works</CardTitle>
                    <CardDescription>Understand the savings rotation process.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>This is a {plan.frequency.toLowerCase()} group plan where each member contributes {plan.contribution_amount} XION for {plan.duration_months} {plan.duration_months === 1 ? "month" : "months"}.</p>
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
                        <TrustScoreBadge score={trustScores[participant] ?? 50} />
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
			
			{isParticipantOrAdmin && joinRequests.length > 0 && (
			<Card className="lg:col-span-3 mt-6">
				<CardHeader>
				<CardTitle>Pending Join Requests</CardTitle>
				<CardDescription>Approve or deny new members who want to join this group.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
				{filteredJoinRequests.map((requester, idx) => (
					<div key={idx} className="flex justify-between p-3 rounded items-center">
					<span className="font-mono">{requester.requester}</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							className="border-green-500 text-green-600 hover:bg-green-50"
							onClick={() =>
								handleAcceptOrDenyRequest(Number(planId), requester.requester, true)
							}
						>
							Approve
						</Button>
						<Button
							variant="outline"
							className="border-red-500 text-red-600 hover:bg-red-50"
							onClick={() =>
								handleAcceptOrDenyRequest(Number(planId), requester.requester, false)
							}
						>
							Deny
						</Button>
						</div>
					</div>
				))}
				</CardContent>
			</Card>
		  )}
          </div>

		  
        </div>
      </div>

      {/* Modals */}
      {joining && (
		<div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-white/90">
			{!joined ? (
			<>
				<div className="w-12 h-12 border-4 border-vox-primary border-t-transparent rounded-full animate-spin" />
				<p className="mt-4 text-vox-secondary font-semibold">Sending join request...</p>
			</>
			) : (
			<>
				<div className="text-green-600">
				<Check size={48} strokeWidth={3} />
				</div>
				<p className="mt-4 text-green-700 font-semibold">Request sent!</p>
			</>
			)}
		</div>
		)}

      <ContributeModal plan={plan} cycleStatus={cycleStatus} open={contributeModalOpen} onClose={() => setContributeModalOpen(false)} onSuccess={() => refetchAll()}/>
    </>
  );
};

export default PlanDetail;
