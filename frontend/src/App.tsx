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
import { ContractProvider } from "./context/ContractProvider";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

const queryClient = new QueryClient();

const Config = {
  treasury: import.meta.env.VITE_TREASURY_ADDRESS,
  rpcUrl: "https://rpc.xion-testnet-2.burnt.com/",
  restUrl: "https://api.xion-testnet-2.burnt.com/"
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
			<AbstraxionProvider
				config={Config}
				>
				<div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">
					<Header />

					<main className="container mx-auto px-4 py-8 flex-1 w-full">
						<ContractProvider>
							<AnimatePresence mode="wait">
							<Routes>
								<Route path="/" element={<Home />} />
								<Route path="/dashboard" element={<Dashboard />} />
								<Route path="/create-group" element={<CreatePlan />} />
								<Route path="/about" element={<About />} />
								<Route path="*" element={<NotFound />} />
								<Route path="/groups" element={<Plans />} />
								<Route path="/groups/:planId" element={<PlanDetail />} />
							</Routes>
							</AnimatePresence>
						</ContractProvider>
					</main>
					

					<Footer />
				</div>
			</AbstraxionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
