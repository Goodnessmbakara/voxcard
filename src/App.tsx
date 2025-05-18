
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




const queryClient = new QueryClient();

const App = () => {


  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/plans/:planId" element={<PlanDetail />} />
                <Route path="/create-plan" element={<CreatePlan />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>)
};

export default App;
