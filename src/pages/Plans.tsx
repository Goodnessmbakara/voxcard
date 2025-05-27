import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import PlanCard from '@/components/shared/PlanCard';
import { mockPlans } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const Plans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter plans based on search term and status
  const filteredPlans = mockPlans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2 text-vox-secondary">Savings Plans</h1>
            <p className="text-vox-secondary/70 font-sans">Browse and join community savings circles.</p>
          </div>
          <Link to="/create-plan" className="mt-4 md:mt-0">
            <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
              <Plus size={16} className="mr-2" />
              Create Plan
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-vox-secondary/40" />
            <Input
              placeholder="Search plans by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-sans border-vox-primary focus:ring-vox-primary"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-[180px] font-sans border-vox-primary focus:ring-vox-primary">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {filteredPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-heading font-semibold mb-2 text-vox-secondary">No plans found</h3>
            <p className="text-vox-secondary/70 mb-6 font-sans">Try changing your search or filter criteria.</p>
            <Link to="/create-plan">
              <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
                Create a new plan
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Plans;
