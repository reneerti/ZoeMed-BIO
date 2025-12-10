import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SelectUser from "./pages/SelectUser";
import Dashboard from "./pages/Dashboard";
import AddMeasurement from "./pages/AddMeasurement";
import Upload from "./pages/Upload";
import Install from "./pages/Install";
import MasterDashboard from "./pages/MasterDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/selecionar" element={<SelectUser />} />
            <Route path="/dashboard/:person" element={<Dashboard />} />
            <Route path="/adicionar" element={<AddMeasurement />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/instalar" element={<Install />} />
            <Route path="/master" element={<MasterDashboard />} />
            <Route path="/paciente/:patientId" element={<PatientDashboard />} />
            <Route path="/adicionar-medida/:patientId" element={<AddMeasurement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;