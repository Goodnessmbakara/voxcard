
import { Plan } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlanCardProps {
  plan: Plan;
  isParticipant?: boolean;
}

export const PlanCard = ({ plan, isParticipant = false }: PlanCardProps) => {
  const participationRate = (plan.currentParticipants / plan.totalParticipants) * 100;
  
  const frequencyToText = {
    Daily: 'day',
    Weekly: 'week',
    Biweekly: '2 weeks',
    Monthly: 'month',
  };

  return (
    <Card className="ajo-card">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg md:text-xl">{plan.name}</CardTitle>
            <CardDescription className="text-sm mt-1">{plan.description}</CardDescription>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-ajo-light text-ajo-tertiary">
            {plan.status}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Contribution</p>
            <p className="font-bold text-lg">{plan.contributionAmount} ADA</p>
            <p className="text-xs text-gray-500">per {frequencyToText[plan.frequency]}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-bold text-lg">{plan.duration}</p>
            <p className="text-xs text-gray-500">
              {plan.duration === 1 ? 'month' : 'months'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm ml-1 text-gray-500">
              {plan.currentParticipants}/{plan.totalParticipants} participants
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {participationRate.toFixed(0)}%
          </span>
        </div>
        <Progress value={participationRate} className="h-2" />

        <div className="mt-4 flex items-center text-sm text-gray-500">
          <CalendarIcon size={16} className="mr-1" />
          <span>Created {plan.createdAt.toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        {isParticipant ? (
          <Link to={`/plans/${plan.id}`} className="w-full">
            <Button className="w-full" variant="outline">View Details</Button>
          </Link>
        ) : plan.status === 'Open' ? (
          <Link to={`/plans/${plan.id}`} className="w-full">
            <Button className="w-full bg-ajo-primary hover:bg-ajo-secondary text-white">Join Plan</Button>
          </Link>
        ) : (
          <Button disabled className="w-full">Plan {plan.status}</Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;