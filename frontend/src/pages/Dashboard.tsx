
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { mockPlans, mockPayouts, getUserPlans, defaultUser } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import PlanCard from '@/components/shared/PlanCard';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Plus, Wallet } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data usage
  const user = defaultUser;
  const userPlans = getUserPlans(user.id);
  
  // Upcoming payout (mock)
  const upcomingPayout = mockPayouts.find(
    (payout) => payout.recipientId === user.id && payout.status === 'Scheduled'
  );

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your savings plans and track your progress.</p>
          </div>
          <Link to="/create-plan" className="mt-4 md:mt-0">
            <Button className="bg-ajo-primary hover:bg-ajo-secondary text-white">
              <Plus size={16} className="mr-2" />
              Create Plan
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    <p className="font-mono text-sm font-medium">{user.walletAddress}</p>
                  </div>
                  <TrustScoreBadge score={user.trustScore} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Trust Score Progress</p>
                  <Progress value={user.trustScore} className="h-2" />
                </div>
                <div className="pt-2">
                  <Button variant="outline" className="w-full">
                    <Wallet size={16} className="mr-2" />
                    Manage Wallet
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Active Plans</p>
                    <p className="text-xl font-bold">{userPlans.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Contributed</p>
                    <p className="text-xl font-bold">350 ADA</p>
                  </div>
                </div>

                {upcomingPayout && (
                  <div className="bg-ajo-light/30 border border-ajo-light rounded-lg p-4">
                    <div className="flex items-center text-ajo-tertiary mb-2">
                      <Calendar size={16} className="mr-2" />
                      <p className="text-sm font-medium">Upcoming Payout</p>
                    </div>
                    <p className="font-bold text-lg">{upcomingPayout.amount} ADA</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock size={14} className="mr-1" />
                      <p>{upcomingPayout.scheduledDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="plans">Your Plans</TabsTrigger>
                <TabsTrigger value="contributions">Contributions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                {userPlans.length > 0 ? (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Your Active Plans</h2>
                    {userPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} isParticipant />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Welcome to VoxCard!</CardTitle>
                      <CardDescription>
                        You haven't joined any savings plans yet. Get started by creating or joining a plan.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-6">
                      <div className="w-24 h-24 rounded-full bg-ajo-light/30 flex items-center justify-center mb-4">
                        <Wallet size={36} className="text-ajo-primary" />
                      </div>
                      <p className="text-center text-gray-500 mb-6 max-w-md">
                        Join a community savings plan to start pooling resources with others, 
                        or create your own plan and invite friends and family.
                      </p>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row gap-3">
                      <Link to="/plans" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full">Browse Plans</Button>
                      </Link>
                      <Link to="/create-plan" className="w-full sm:w-auto">
                        <Button className="w-full bg-ajo-primary text-white">Create a Plan</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="plans">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">All Your Plans</h2>
                  {userPlans.length > 0 ? (
                    userPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} isParticipant />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">You haven't joined any plans yet.</p>
                      <Link to="/plans">
                        <Button className="bg-ajo-primary hover:bg-ajo-secondary text-white">
                          Browse Plans
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="contributions">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Your Recent Contributions</h2>
                  
                  <div className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-12 bg-gray-50 p-3 border-b">
                      <div className="col-span-4 font-medium">Plan</div>
                      <div className="col-span-3 font-medium">Amount</div>
                      <div className="col-span-3 font-medium">Date</div>
                      <div className="col-span-2 font-medium">Round</div>
                    </div>
                    
                    {/* Mock contributions */}
                    <div className="grid grid-cols-12 p-3 border-b">
                      <div className="col-span-4">Community Savings</div>
                      <div className="col-span-3">100 ADA</div>
                      <div className="col-span-3">Apr 15, 2025</div>
                      <div className="col-span-2">2 of 12</div>
                    </div>
                    <div className="grid grid-cols-12 p-3 border-b">
                      <div className="col-span-4">Emergency Fund</div>
                      <div className="col-span-3">75 ADA</div>
                      <div className="col-span-3">Apr 10, 2025</div>
                      <div className="col-span-2">1 of 6</div>
                    </div>
                    <div className="grid grid-cols-12 p-3">
                      <div className="col-span-4">Community Savings</div>
                      <div className="col-span-3">100 ADA</div>
                      <div className="col-span-3">Mar 15, 2025</div>
                      <div className="col-span-2">1 of 12</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;