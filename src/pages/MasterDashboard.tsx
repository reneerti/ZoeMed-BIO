import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Users, Activity, Settings, BarChart3, Search, 
  Plus, ArrowLeft, LogOut, TrendingUp, TrendingDown,
  UserPlus, Edit, Trash2, Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import PatientManagement from "@/components/master/PatientManagement";
import MasterReports from "@/components/master/MasterReports";
import CustomFieldsConfig from "@/components/master/CustomFieldsConfig";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  status: string;
  avatar_url: string | null;
  created_at: string;
  latestWeight?: number;
  latestBmi?: number;
  weightChange?: number;
}

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  totalMeasurements: number;
  avgWeightLoss: number;
}

const MasterDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePatients: 0,
    totalMeasurements: 0,
    avgWeightLoss: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
      navigate("/selecionar");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("*")
        .order("name");

      if (patientsError) throw patientsError;

      // Load bioimpedance data for stats
      const { data: bioData, error: bioError } = await supabase
        .from("bioimpedance")
        .select("patient_id, weight, bmi, measurement_date")
        .order("measurement_date", { ascending: false });

      if (bioError) throw bioError;

      // Calculate stats per patient
      const patientsWithStats = (patientsData || []).map(patient => {
        const patientBio = bioData?.filter(b => b.patient_id === patient.id) || [];
        const latestWeight = patientBio[0]?.weight;
        const latestBmi = patientBio[0]?.bmi;
        
        // Calculate weight change
        let weightChange = 0;
        if (patientBio.length >= 2) {
          const firstWeight = patientBio[patientBio.length - 1]?.weight;
          if (firstWeight && latestWeight) {
            weightChange = latestWeight - firstWeight;
          }
        }

        return {
          ...patient,
          latestWeight,
          latestBmi,
          weightChange
        };
      });

      setPatients(patientsWithStats);

      // Calculate dashboard stats
      const activeCount = patientsData?.filter(p => p.status === "active").length || 0;
      const totalBio = bioData?.length || 0;
      
      // Calculate average weight loss
      const weightChanges = patientsWithStats
        .filter(p => p.weightChange !== undefined && p.weightChange !== 0)
        .map(p => p.weightChange || 0);
      const avgLoss = weightChanges.length > 0 
        ? weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length 
        : 0;

      setStats({
        totalPatients: patientsData?.length || 0,
        activePatients: activeCount,
        totalMeasurements: totalBio,
        avgWeightLoss: avgLoss
      });

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/selecionar")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-serif font-bold">ZoeBio Master</h1>
                  <p className="text-xs text-muted-foreground">Painel Administrativo</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pacientes</p>
                  <p className="text-2xl font-bold">{stats.totalPatients}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activePatients}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medições</p>
                  <p className="text-2xl font-bold">{stats.totalMeasurements}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Média Perda</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.avgWeightLoss < 0 ? "" : "+"}{stats.avgWeightLoss.toFixed(1)} kg
                  </p>
                </div>
                {stats.avgWeightLoss < 0 ? (
                  <TrendingDown className="w-8 h-8 text-green-600" />
                ) : (
                  <TrendingUp className="w-8 h-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="patients" className="space-y-4">
          <TabsList className="bg-card border">
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <PatientManagement 
              patients={filteredPatients} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="reports">
            <MasterReports patients={patients} />
          </TabsContent>

          <TabsContent value="settings">
            <CustomFieldsConfig />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MasterDashboard;