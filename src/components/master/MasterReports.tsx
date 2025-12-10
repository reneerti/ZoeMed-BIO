import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingDown, TrendingUp, Users, Scale, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  name: string;
  latestWeight?: number;
  weightChange?: number;
}

interface MasterReportsProps {
  patients: Patient[];
}

interface BioimpedanceRecord {
  patient_id: string;
  weight: number;
  bmi: number;
  body_fat_percent: number;
  measurement_date: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const MasterReports = ({ patients }: MasterReportsProps) => {
  const [selectedMetric, setSelectedMetric] = useState("weight");
  const [bioData, setBioData] = useState<BioimpedanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBioimpedanceData();
  }, []);

  const loadBioimpedanceData = async () => {
    try {
      const { data, error } = await supabase
        .from("bioimpedance")
        .select("patient_id, weight, bmi, body_fat_percent, measurement_date")
        .not("patient_id", "is", null)
        .order("measurement_date", { ascending: true });

      if (error) throw error;
      setBioData(data || []);
    } catch (error) {
      console.error("Error loading bioimpedance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare evolution data for line chart
  const evolutionData = patients.map(patient => {
    const patientBio = bioData
      .filter(b => b.patient_id === patient.id)
      .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime());
    
    return {
      name: patient.name,
      data: patientBio.map(b => ({
        date: new Date(b.measurement_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        value: selectedMetric === "weight" ? b.weight : selectedMetric === "bmi" ? b.bmi : b.body_fat_percent
      }))
    };
  }).filter(p => p.data.length > 0);

  // Prepare weight loss ranking
  const weightLossRanking = patients
    .filter(p => p.weightChange !== undefined && p.weightChange !== 0)
    .sort((a, b) => (a.weightChange || 0) - (b.weightChange || 0))
    .slice(0, 10)
    .map(p => ({
      name: p.name.split(" ")[0],
      value: Math.abs(p.weightChange || 0),
      isLoss: (p.weightChange || 0) < 0
    }));

  // Prepare status distribution
  const statusDistribution = [
    { name: "Com Progresso", value: patients.filter(p => (p.weightChange || 0) < 0).length },
    { name: "Estável", value: patients.filter(p => (p.weightChange || 0) === 0).length },
    { name: "Ganho", value: patients.filter(p => (p.weightChange || 0) > 0).length }
  ].filter(s => s.value > 0);

  // Get all unique dates and create combined chart data
  const allDates = [...new Set(bioData.map(b => b.measurement_date))].sort();
  const combinedChartData = allDates.map(date => {
    const entry: any = { date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) };
    patients.forEach(patient => {
      const record = bioData.find(b => b.patient_id === patient.id && b.measurement_date === date);
      if (record) {
        entry[patient.name] = selectedMetric === "weight" ? record.weight : 
                             selectedMetric === "bmi" ? record.bmi : record.body_fat_percent;
      }
    });
    return entry;
  });

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse text-muted-foreground">Carregando relatórios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif">Relatórios de Evolução</CardTitle>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight">Peso (kg)</SelectItem>
                <SelectItem value="bmi">IMC</SelectItem>
                <SelectItem value="fat">Gordura (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {combinedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={combinedChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                {patients.slice(0, 6).map((patient, index) => (
                  <Line
                    key={patient.id}
                    type="monotone"
                    dataKey={patient.name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado de bioimpedância encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weight Loss Ranking */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Ranking de Evolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weightLossRanking.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weightLossRanking} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${props.payload.isLoss ? "-" : "+"}${value.toFixed(1)} kg`,
                      "Variação"
                    ]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Sem dados suficientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Distribuição de Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "#10B981" : index === 1 ? "#F59E0B" : "#EF4444"} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Sem dados suficientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Perdendo Peso</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {patients.filter(p => (p.weightChange || 0) < 0).length}
              </p>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Estável</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {patients.filter(p => !p.weightChange || p.weightChange === 0).length}
              </p>
            </div>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <span className="text-sm text-muted-foreground">Ganhando Peso</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {patients.filter(p => (p.weightChange || 0) > 0).length}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Total Medições</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {bioData.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterReports;