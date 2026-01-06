import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Treinamentos from "./pages/Treinamentos";
import KPIs from "./pages/KPIs";
import OKRs from "./pages/OKRs";
import Processos from "./pages/Processos";
import GestaoVisual from "./pages/GestaoVisual";
import Matrizes from "./pages/Matrizes";
import Agenda from "./pages/Agenda";
import Mural from "./pages/Mural";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "next-themes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/treinamentos" element={<Treinamentos />} />
                <Route path="/kpis" element={<KPIs />} />
                <Route path="/okrs" element={<OKRs />} />
                <Route path="/processos" element={<Processos />} />
                <Route path="/gestao-visual" element={<GestaoVisual />} />
                <Route path="/matrizes" element={<Matrizes />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/mural" element={<Mural />} />
                <Route path="/configuracoes" element={<AdminRoute><Configuracoes /></AdminRoute>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
