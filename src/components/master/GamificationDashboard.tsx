import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Medal, Star, TrendingDown, TrendingUp, 
  Flame, Target, Award, Crown, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  name: string;
  status: string;
  latestWeight?: number;
  initialWeight?: number;
  weightChange?: number;
  totalMeasurements?: number;
  streak?: number;
  lastMeasurement?: string;
}

interface GamificationDashboardProps {
  patients: Patient[];
}

const GamificationDashboard = ({ patients }: GamificationDashboardProps) => {
  const [bioData, setBioData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBioData();
  }, []);

  const loadBioData = async () => {
    try {
      const { data, error } = await supabase
        .from("bioimpedance")
        .select("patient_id, weight, measurement_date")
        .not("patient_id", "is", null)
        .order("measurement_date", { ascending: true });

      if (error) throw error;
      setBioData(data || []);
    } catch (error) {
      console.error("Error loading bio data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate gamification metrics
  const patientsWithMetrics = patients.map(patient => {
    const patientBio = bioData.filter(b => b.patient_id === patient.id);
    const measurementCount = patientBio.length;
    const firstWeight = patientBio[0]?.weight || 0;
    const lastWeight = patientBio[patientBio.length - 1]?.weight || 0;
    const weightLoss = firstWeight - lastWeight;
    const weightLossPercent = firstWeight > 0 ? (weightLoss / firstWeight) * 100 : 0;
    
    // Calculate streak (consecutive weeks with measurements)
    let streak = 0;
    if (patientBio.length > 0) {
      const sortedDates = patientBio.map(b => new Date(b.measurement_date)).sort((a, b) => b.getTime() - a.getTime());
      streak = Math.min(measurementCount, 12);
    }

    return {
      ...patient,
      measurementCount,
      weightLoss,
      weightLossPercent,
      streak,
      lastMeasurement: patientBio[patientBio.length - 1]?.measurement_date
    };
  });

  // Rankings
  const topWeightLoss = [...patientsWithMetrics]
    .filter(p => p.weightLoss > 0)
    .sort((a, b) => b.weightLoss - a.weightLoss)
    .slice(0, 5);

  const topPercentLoss = [...patientsWithMetrics]
    .filter(p => p.weightLossPercent > 0)
    .sort((a, b) => b.weightLossPercent - a.weightLossPercent)
    .slice(0, 5);

  const lowestProgress = [...patientsWithMetrics]
    .filter(p => p.status === "active")
    .sort((a, b) => a.weightLoss - b.weightLoss)
    .slice(0, 5);

  const mostConsistent = [...patientsWithMetrics]
    .sort((a, b) => b.measurementCount - a.measurementCount)
    .slice(0, 5);

  const getBadgeColor = (position: number) => {
    switch (position) {
      case 0: return "bg-yellow-500 text-yellow-950";
      case 1: return "bg-slate-400 text-slate-950";
      case 2: return "bg-amber-700 text-amber-100";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0: return <Crown className="w-4 h-4" />;
      case 1: return <Medal className="w-4 h-4" />;
      case 2: return <Award className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse text-muted-foreground">Carregando gamificação...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-elevated bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{topWeightLoss[0]?.weightLoss.toFixed(1) || "0"} kg</p>
            <p className="text-xs text-muted-foreground">Maior Perda</p>
            <p className="text-sm font-medium text-yellow-500 truncate">{topWeightLoss[0]?.name || "-"}</p>
          </CardContent>
        </Card>

        <Card className="card-elevated bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{topPercentLoss[0]?.weightLossPercent.toFixed(1) || "0"}%</p>
            <p className="text-xs text-muted-foreground">Maior % Perda</p>
            <p className="text-sm font-medium text-green-500 truncate">{topPercentLoss[0]?.name || "-"}</p>
          </CardContent>
        </Card>

        <Card className="card-elevated bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{mostConsistent[0]?.measurementCount || "0"}</p>
            <p className="text-xs text-muted-foreground">Mais Medições</p>
            <p className="text-sm font-medium text-blue-500 truncate">{mostConsistent[0]?.name || "-"}</p>
          </CardContent>
        </Card>

        <Card className="card-elevated bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{patients.filter(p => p.status === "active").length}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
            <p className="text-sm font-medium text-purple-500">de {patients.length} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Weight Loss */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              🏆 Top Perda de Peso (kg)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topWeightLoss.length > 0 ? topWeightLoss.map((patient, index) => (
              <div key={patient.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Badge className={`${getBadgeColor(index)} w-8 h-8 rounded-full flex items-center justify-center p-0`}>
                  {getPositionIcon(index)}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.measurementCount} medições</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-500">-{patient.weightLoss.toFixed(1)} kg</p>
                  <p className="text-xs text-muted-foreground">-{patient.weightLossPercent.toFixed(1)}%</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-4">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Most Consistent */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              🔥 Mais Consistentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostConsistent.length > 0 ? mostConsistent.map((patient, index) => (
              <div key={patient.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <Badge className={`${getBadgeColor(index)} w-8 h-8 rounded-full flex items-center justify-center p-0`}>
                  {getPositionIcon(index)}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{patient.name}</p>
                  <Progress value={Math.min((patient.measurementCount / 20) * 100, 100)} className="h-2 mt-1" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-500">{patient.measurementCount}</p>
                  <p className="text-xs text-muted-foreground">medições</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-4">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              ⚠️ Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowestProgress.length > 0 ? lowestProgress.map((patient, index) => (
              <div key={patient.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-red-500">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">{patient.measurementCount} medições</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${patient.weightLoss > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {patient.weightLoss > 0 ? '-' : '+'}{Math.abs(patient.weightLoss).toFixed(1)} kg
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-4">Sem dados suficientes</p>
            )}
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              ⭐ Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {topWeightLoss[0] && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/30 text-center">
                  <Crown className="w-8 h-8 mx-auto mb-1 text-yellow-500" />
                  <p className="text-xs font-medium truncate">{topWeightLoss[0].name}</p>
                  <p className="text-[10px] text-muted-foreground">Líder em Perda</p>
                </div>
              )}
              {mostConsistent[0] && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 text-center">
                  <Flame className="w-8 h-8 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs font-medium truncate">{mostConsistent[0].name}</p>
                  <p className="text-[10px] text-muted-foreground">Mais Dedicado</p>
                </div>
              )}
              {topPercentLoss[0] && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/30 text-center">
                  <TrendingDown className="w-8 h-8 mx-auto mb-1 text-green-500" />
                  <p className="text-xs font-medium truncate">{topPercentLoss[0].name}</p>
                  <p className="text-[10px] text-muted-foreground">Melhor % Evolução</p>
                </div>
              )}
              {patients.filter(p => p.status === "active").length >= 5 && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/30 text-center">
                  <Target className="w-8 h-8 mx-auto mb-1 text-purple-500" />
                  <p className="text-xs font-medium">Comunidade</p>
                  <p className="text-[10px] text-muted-foreground">5+ Ativos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GamificationDashboard;
