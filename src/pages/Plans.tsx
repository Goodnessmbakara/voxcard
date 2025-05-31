import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
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

const Plans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans from the backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/plans', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched plans:', data); // Debug log
        setPlans(data);
      } catch (err) {
        console.error('Error fetching plans:', err); // Debug log
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Filter plans based on search term and status
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="relative container py-8">
        {/* Animated background blob */}
        <motion.div
          className="hidden md:block absolute -top-20 -right-20 w-96 h-96 bg-vox-accent/20 rounded-full blur-3xl z-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10">
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

        {/* Filters - sticky on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 mb-8 sticky top-16 z-20 bg-white/80 backdrop-blur rounded-xl p-4 md:p-0 shadow md:shadow-none"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-3 text-vox-secondary/40" />
            <Input
              placeholder="Search plans by name or description..."
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
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {loading ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-heading font-semibold mb-2 text-vox-secondary">Loading plans...</h3>
            </motion.div>
          ) : error ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-heading font-semibold mb-2 text-red-500">{error}</h3>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 gradient-bg text-white font-sans hover:opacity-90 transition-opacity"
              >
                Try Again
              </Button>
            </motion.div>
          ) : filteredPlans.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
            >
              {filteredPlans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ duration: 0.4 }}
                >
                  <PlanCard plan={plan} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-heading font-semibold mb-2 text-vox-secondary">No plans found</h3>
              <p className="text-vox-secondary/70 mb-6 font-sans">Try changing your search or filter criteria.</p>
              <Link to="/create-plan">
                <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
                  Create a new plan
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Plans;
