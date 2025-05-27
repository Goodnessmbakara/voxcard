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
import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';

const Dashboard = () => {
  const { isConnected } = useCardano();
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
            <h1 className="text-3xl font-heading font-bold mb-2 text-vox-secondary">Dashboard</h1>
            <p className="text-vox-secondary/70 font-sans">Manage your savings plans and track your progress.</p>
          </div>
          {isConnected && (
            <Link to="/create-plan" className="mt-4 md:mt-0">
              <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
                <Plus size={16} className="mr-2" />
                Create Plan
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {isConnected && (
              <>
                {/* User Profile Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-vox-primary">Your Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-vox-secondary/60 font-sans">Wallet Address</p>
                        <p className="font-mono text-sm font-medium text-vox-secondary">{user.walletAddress}</p>
                      </div>
                      <TrustScoreBadge score={user.trustScore} />
                    </div>
                    <div>
                      <p className="text-sm text-vox-secondary/60 font-sans mb-1">Trust Score Progress</p>
                      <Progress value={user.trustScore} className="h-2 bg-vox-primary/10" />
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full font-sans border-vox-primary text-vox-primary hover:bg-vox-primary/10">
                        <Wallet size={16} className="mr-2" />
                        Manage Wallet
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-vox-primary">Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-vox-secondary/60 font-sans">Active Plans</p>
                        <p className="text-xl font-bold text-vox-secondary">{userPlans.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-vox-secondary/60 font-sans">Total Contributed</p>
                        <p className="text-xl font-bold text-vox-secondary">350 ADA</p>
                      </div>
                    </div>

                    {upcomingPayout && (
                      <div className="bg-vox-accent/10 border border-vox-accent rounded-lg p-4">
                        <div className="flex items-center text-vox-accent mb-2">
                          <Calendar size={16} className="mr-2" />
                          <p className="text-sm font-medium">Upcoming Payout</p>
                        </div>
                        <p className="font-bold text-lg text-vox-accent">{upcomingPayout.amount} ADA</p>
                        <div className="flex items-center text-sm text-vox-secondary/60 mt-1">
                          <Clock size={14} className="mr-1" />
                          <p>{upcomingPayout.scheduledDate.toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {isConnected ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="plans">Your Plans</TabsTrigger>
                  <TabsTrigger value="contributions">Contributions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  {userPlans.length > 0 ? (
                    <div className="space-y-6">
                      <h2 className="text-xl font-heading font-semibold text-vox-secondary">Your Active Plans</h2>
                      {userPlans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} isParticipant />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-heading text-vox-primary">Welcome to VoxCard!</CardTitle>
                        <CardDescription className="text-vox-secondary/70 font-sans">
                          You haven't joined any savings plans yet. Get started by creating or joining a plan.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center py-6">
                        <div className="w-24 h-24 rounded-full bg-vox-primary/10 flex items-center justify-center mb-4">
                          <Wallet size={36} className="text-vox-primary" />
                        </div>
                        <p className="text-center text-vox-secondary/70 mb-6 max-w-md font-sans">
                          Join a community savings plan to start pooling resources with others,
                          or create your own plan and invite friends and family.
                        </p>
                      </CardContent>
                      <CardFooter className="flex flex-col sm:flex-row gap-3">
                        <Link to="/plans" className="w-full sm:w-auto">
                          <Button variant="outline" className="w-full font-sans border-vox-primary text-vox-primary hover:bg-vox-primary/10">Browse Plans</Button>
                        </Link>
                        <Link to="/create-plan" className="w-full sm:w-auto">
                          <Button className="w-full gradient-bg text-white font-sans hover:opacity-90 transition-opacity">Create a Plan</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="plans">
                  <div className="space-y-6">
                    <h2 className="text-xl font-heading font-semibold text-vox-secondary">All Your Plans</h2>
                    {userPlans.length > 0 ? (
                      userPlans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} isParticipant />
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-vox-secondary/70 mb-4 font-sans">You haven't joined any plans yet.</p>
                        <Link to="/plans">
                          <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">Browse Plans</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="contributions">
                  <div className="space-y-4">
                    <h2 className="text-xl font-heading font-semibold text-vox-secondary">Your Recent Contributions</h2>

                    <div className="rounded-lg border overflow-hidden">
                      <div className="grid grid-cols-12 bg-vox-primary/5 p-3 border-b">
                        <div className="col-span-4 font-medium font-sans text-vox-secondary">Plan</div>
                        <div className="col-span-3 font-medium font-sans text-vox-secondary">Amount</div>
                        <div className="col-span-3 font-medium font-sans text-vox-secondary">Date</div>
                        <div className="col-span-2 font-medium font-sans text-vox-secondary">Round</div>
                      </div>

                      {/* Mock contributions */}
                      <div className="grid grid-cols-12 p-3 border-b">
                        <div className="col-span-4 font-sans">Community Savings</div>
                        <div className="col-span-3 font-sans">100 ADA</div>
                        <div className="col-span-3 font-sans">Apr 15, 2025</div>
                        <div className="col-span-2 font-sans">2 of 12</div>
                      </div>
                      <div className="grid grid-cols-12 p-3 border-b">
                        <div className="col-span-4 font-sans">Emergency Fund</div>
                        <div className="col-span-3 font-sans">75 ADA</div>
                        <div className="col-span-3 font-sans">Mar 10, 2025</div>
                        <div className="col-span-2 font-sans">1 of 8</div>
                      </div>
                      {/* ...more mock rows as needed... */}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-vox-primary">Connect Your Wallet</CardTitle>
                  <CardDescription className="text-vox-secondary/70 font-sans">
                    Please connect your Cardano wallet to view your dashboard and manage your plans.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-6">
                  <div className="w-24 h-24 rounded-full bg-vox-primary/10 flex items-center justify-center mb-4">
                    <Wallet size={36} className="text-vox-primary" />
                  </div>
                  <p className="text-center text-vox-secondary/70 mb-6 max-w-md font-sans">
                    Once connected, you can join, create, and manage your savings plans securely on VoxCard.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;