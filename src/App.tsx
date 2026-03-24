import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CRMLayout } from "@/components/CRMLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthStore, CityStore, FunnelStore } from "@/lib/storage";
import { useEffect } from "react";

// Pages
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DealsPage from "./pages/DealsPage.tsx";
import PeoplePage from "./pages/PeoplePage.tsx";
import CompaniesPage from "./pages/CompaniesPage.tsx";
import TasksPage from "./pages/TasksPage.tsx";
import SequencesPage from "./pages/SequencesPage.tsx";
import WhatsAppPage from "./pages/WhatsAppPage.tsx";
import CRMPage from "./pages/CRMPage.tsx";
import DataEnrichmentPage from "./pages/DataEnrichmentPage.tsx";
import AIAssistantPage from "./pages/AIAssistantPage.tsx";
import GrowthLabPage from "./pages/GrowthLabPage.tsx";
import AgentsPage from "./pages/AgentsPage.tsx";
import MetasPage from "./pages/MetasPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import UsersPage from "./pages/UsersPage.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AuthStore.seed();
    CityStore.seed();
    FunnelStore.seed();
  }, []);
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppInit>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/deals" element={<ProtectedRoute><CRMLayout><DealsPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/people" element={<ProtectedRoute><CRMLayout><PeoplePage /></CRMLayout></ProtectedRoute>} />
              <Route path="/companies" element={<ProtectedRoute><CRMLayout><CompaniesPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><CRMLayout><TasksPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/sequences" element={<ProtectedRoute><CRMLayout><SequencesPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/whatsapp" element={<ProtectedRoute><CRMLayout><WhatsAppPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/data-enrichment" element={<ProtectedRoute><CRMLayout><DataEnrichmentPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/ai-assistant" element={<ProtectedRoute><CRMLayout><AIAssistantPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/signals" element={<ProtectedRoute><CRMLayout><CRMPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/growth-lab" element={<ProtectedRoute><CRMLayout><GrowthLabPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/agents" element={<ProtectedRoute><CRMLayout><AgentsPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/metas" element={<ProtectedRoute><CRMLayout><MetasPage /></CRMLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute adminOnly><CRMLayout><UsersPage /></CRMLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppInit>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
