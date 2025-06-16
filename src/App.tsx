import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import CreatePlan from "./pages/CreatePlan";
import NotFound from "./pages/NotFound";
import About from './pages/About';
import { AbstraxionProvider } from "@burnt-labs/abstraxion";


const queryClient = new QueryClient();

const treasuryConfig = {
  treasury: import.meta.env.VITE_TREASURY_ADDRESS,
  rpcUrl: import.meta.env.VITE_RPC_URL || "https://rpc.xion-testnet-2.burnt.com:443",
  restUrl: import.meta.env.VITE_REST_URL || "https://api.xion-testnet-2.burnt.com",
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
			<AbstraxionProvider
			config={treasuryConfig}>
				<AnimatePresence mode="wait">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/create-plan" element={<CreatePlan />} />
					{/* <Route path="/plans" element={<Plans />} />
					<Route path="/plans/:planId" element={<PlanDetail />} />
					
					<Route path="/about" element={<About />} />

					<Route path="*" element={<NotFound />} /> */}
				</Routes>
				</AnimatePresence>
			</AbstraxionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
