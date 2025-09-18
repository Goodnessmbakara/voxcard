import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Footer';
import PlanCard from '@/components/shared/PlanCard';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/context/ContractProvider';
import { Plan } from '@/types/utils';

const Plans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // adjust as needed

  const { account, getPaginatedPlans } = useContract();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { plans: paginatedPlans, totalCount } = await getPaginatedPlans(page, pageSize);

        setPlans(paginatedPlans);
        // Optionally store totalCount for pagination UI
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [page, account]); // re-run if page changes

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && plan.is_active) ||
      (statusFilter === 'inactive' && !plan.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="relative container py-8">
        {/* UI remains the same... */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 mb-8 sticky top-16 z-20 backdrop-blur rounded-xl p-4 md:p-0 shadow md:shadow-none"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-vox-secondary/40" />
            <Input
              placeholder="Search groups by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-sans border-vox-primary focus:ring-vox-primary rounded-lg"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full md:w-[180px] font-sans border-vox-primary focus:ring-vox-primary rounded-lg">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {loading ? (
            <motion.div className="text-center py-16">Loading groups...</motion.div>
          ) : error ? (
            <motion.div className="text-center py-16">{error}</motion.div>
          ) : filteredPlans.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </motion.div>
          ) : (
            <motion.div className="text-center py-16">No groups found.</motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Plans;
