import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ArrowLeft, Activity, Scale, Percent, Droplet, 
  Heart, Brain, Plus, Syringe, BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import BioimpedanceTable from "@/components/BioimpedanceTable";
import MonjaroTracking from "@/components/MonjaroTracking";
import GoalsProgress from "@/components/GoalsProgress";
import MetricsRadarChart from "@/components/MetricsRadarChart";
import { PatientScoreCard } from "@/components/PatientScoreCard";
import { LeaderboardTop3 } from "@/components/LeaderboardTop3";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  height: number | null;
  avatar_url: string | null;
  status: string;
}

interface BioimpedanceRecord {
  id: string;
  weight: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  muscle_rate_percent: number | null;
  visceral_fat: number | null;
  metabolic_age: number | null;
  bmr: number | null;
  measurement_date: string;
  week_number: number | null;
}

const PatientDashboard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [bioData, setBioData] = useState<BioimpedanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Load patient info
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Load bioimpedance data
      const { data: bioimpedance, error: bioError } = await supabase
        .from("bioimpedance")
        .select("*")
        .eq("patient_id", patientId)
        .order("measurement_date", { ascending: false });

      if (bioError) throw bioError;
      setBioData(bioimpedance || []);

    } catch (error) {
      console.error("Error loading patient data:", error);
      toast.error("Erro ao carregar dados do paciente");
      navigate("/master");
    } finally {
      setLoading(false);
    }
  };

  const latestRecord = bioData[0];
  const previousRecord = bioData[1];

  const calculateChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-muted-foreground">Paciente não encontrado</div>
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
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={patient.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {patient.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-serif font-bold">{patient.name}</h1>
                  <p className="text-xs text-muted-foreground">
                    {patient.gender === "male" ? "Masculino" : patient.gender === "female" ? "Feminino" : ""} 
                    {patient.height && ` • ${patient.height}cm`}
                  </p>
                </div>
              </div>
            </div>
            {isAdmin && (
              <Button 
                className="gradient-primary rounded-xl"
                onClick={() => navigate(`/adicionar-medida/${patientId}`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Medição
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Score Card and Leaderboard */}
        <div className="grid md:grid-cols-2 gap-4">
          <PatientScoreCard patientId={patientId!} patientName={patient.name} />
          <LeaderboardTop3 />
        </div>

        {/* Current Stats */}
        {latestRecord && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard
              icon={<Scale className="w-5 h-5" />}
              label="Peso"
              value={latestRecord.weight ? `${latestRecord.weight.toFixed(1)} kg` : "-"}
              change={calculateChange(latestRecord.weight, previousRecord?.weight)}
              color="blue"
            />
            <MetricCard
              icon={<Activity className="w-5 h-5" />}
              label="IMC"
              value={latestRecord.bmi ? latestRecord.bmi.toFixed(1) : "-"}
              change={calculateChange(latestRecord.bmi, previousRecord?.bmi)}
              color="indigo"
            />
            <MetricCard
              icon={<Percent className="w-5 h-5" />}
              label="Gordura"
              value={latestRecord.body_fat_percent ? `${latestRecord.body_fat_percent.toFixed(1)}%` : "-"}
              change={calculateChange(latestRecord.body_fat_percent, previousRecord?.body_fat_percent)}
              color="rose"
              invertColor
            />
            <MetricCard
              icon={<Droplet className="w-5 h-5" />}
              label="Músculo"
              value={latestRecord.muscle_rate_percent ? `${latestRecord.muscle_rate_percent.toFixed(1)}%` : "-"}
              change={calculateChange(latestRecord.muscle_rate_percent, previousRecord?.muscle_rate_percent)}
              color="emerald"
            />
            <MetricCard
              icon={<Heart className="w-5 h-5" />}
              label="G. Visceral"
              value={latestRecord.visceral_fat ? latestRecord.visceral_fat.toString() : "-"}
              change={calculateChange(latestRecord.visceral_fat, previousRecord?.visceral_fat)}
              color="amber"
              invertColor
            />
            <MetricCard
              icon={<Brain className="w-5 h-5" />}
              label="Idade Metab."
              value={latestRecord.metabolic_age ? `${latestRecord.metabolic_age} anos` : "-"}
              change={calculateChange(latestRecord.metabolic_age, previousRecord?.metabolic_age)}
              color="purple"
              invertColor
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="bioimpedance" className="space-y-4">
          <TabsList className="bg-card border">
            <TabsTrigger value="bioimpedance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Bioimpedância
            </TabsTrigger>
            <TabsTrigger value="monjaro" className="flex items-center gap-2">
              <Syringe className="w-4 h-4" />
              Monjaro
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Metas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bioimpedance">
            <Card className="card-elevated overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Histórico de Bioimpedância</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BioimpedanceTable 
                  records={bioData as any} 
                  isMale={patient.gender === "male"}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monjaro">
            <MonjaroTracking patientId={patientId!} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsProgress 
              userPerson={patient.gender === "male" ? "reneer" : "ana_paula"}
              currentMetrics={{
                weight: latestRecord?.weight ?? null,
                body_fat_percent: latestRecord?.body_fat_percent ?? null,
                muscle_rate_percent: latestRecord?.muscle_rate_percent ?? null,
                visceral_fat: latestRecord?.visceral_fat ?? null,
                bmi: latestRecord?.bmi ?? null
              }}
              initialMetrics={{
                weight: bioData[bioData.length - 1]?.weight ?? null,
                body_fat_percent: bioData[bioData.length - 1]?.body_fat_percent ?? null,
                muscle_rate_percent: bioData[bioData.length - 1]?.muscle_rate_percent ?? null,
                visceral_fat: bioData[bioData.length - 1]?.visceral_fat ?? null,
                bmi: bioData[bioData.length - 1]?.bmi ?? null
              }}
              isAdmin={isAdmin}
              isMale={patient.gender === "male"}
            />
          </TabsContent>
        </Tabs>

        {/* Radar Chart */}
        {latestRecord && (
          <MetricsRadarChart 
            currentMetrics={{
              bmi: latestRecord?.bmi,
              body_fat_percent: latestRecord?.body_fat_percent,
              muscle_rate_percent: latestRecord?.muscle_rate_percent,
              visceral_fat: latestRecord?.visceral_fat,
              body_water_percent: (latestRecord as any)?.body_water_percent,
              protein_percent: (latestRecord as any)?.protein_percent
            }}
            historicalRecords={bioData as any}
            isMale={patient.gender === "male"}
          />
        )}
      </main>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string | null;
  color: string;
  invertColor?: boolean;
}

const MetricCard = ({ icon, label, value, change, color, invertColor = false }: MetricCardProps) => {
  const isPositive = change && parseFloat(change) > 0;
  const isNegative = change && parseFloat(change) < 0;
  
  let changeColor = "text-muted-foreground";
  if (invertColor) {
    changeColor = isPositive ? "text-red-600" : isNegative ? "text-green-600" : "text-muted-foreground";
  } else {
    changeColor = isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground";
  }

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600",
    indigo: "bg-indigo-500/10 text-indigo-600",
    rose: "bg-rose-500/10 text-rose-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    purple: "bg-purple-500/10 text-purple-600"
  };

  return (
    <Card className="card-elevated">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
        {change && (
          <p className={`text-xs ${changeColor}`}>
            {parseFloat(change) > 0 ? "+" : ""}{change}%
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientDashboard;