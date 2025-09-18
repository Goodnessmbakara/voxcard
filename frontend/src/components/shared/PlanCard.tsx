import { Plan } from '../../types/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';

export const PlanCard = ({ plan }: { plan: Plan }) => {
  const { data: account } = useAbstraxionAccount();
  const participants = Array.isArray(plan.participants) ? plan.participants : [];
  const address = (account?.bech32Address || "").toLowerCase();

  const isParticipantOrAdmin =
    participants.map(addr => addr.toLowerCase()).includes(address) ||
    plan.created_by?.toLowerCase() === address;

  const frequencyToText = {
    Daily: 'day',
    Weekly: 'week',
    Monthly: 'month',
  };
  return (
    <Card className="ajo-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl">{plan.name}</CardTitle>
            <CardDescription className="text-sm mt-1">
				{plan?.description?.length > 20
					? `${plan.description.slice(0, 20)}...`
					: plan.description}
			</CardDescription>

          </div>
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-[#5ba88e] text-white">
            {plan.is_active ? "Active" : "Inactive"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Contribution</p>
            <p className="font-bold text-lg">{plan.contribution_amount} XION</p>
            <p className="text-xs text-gray-500">per {frequencyToText[plan.frequency]}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-bold text-lg">{plan.duration_months}</p>
            <p className="text-xs text-gray-500">
              {plan.duration_months === 1 ? 'month' : 'months'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm ml-1 text-gray-500">
              {participants.length}/{plan.total_participants} participants
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {plan.total_participants > 0
              ? ((participants.length / plan.total_participants) * 100).toFixed(0)
              : 0
            }%
          </span>
        </div>
        <Progress
          value={
            plan.total_participants > 0
              ? (participants.length / plan.total_participants) * 100
              : 0
          }
          className="h-2"
        />
      </CardContent>
      <CardFooter>
        {isParticipantOrAdmin ? (
          <Link to={`/groups/${plan.id}`} className="w-full">
            <Button className="w-full" variant="outline">View Details</Button>
          </Link>
        ) : plan.is_active ? (
          <Link to={`/groups/${plan.id}`} className="w-full">
            <Button className="w-full bg-[#10B981] hover:bg-[#5ba88e] text-white">Join Plan</Button>
          </Link>
        ) : (
          <Button disabled className="w-full bg-[#5ba88e]">Group Inactive</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
