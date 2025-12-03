import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BioimpedanceTable from "@/components/BioimpedanceTable";
import AnaPaulaProtocol from "@/components/AnaPaulaProtocol";
import ReneerProtocol from "@/components/ReneerProtocol";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface BioimpedanceRecord {
  id: string;
  measurement_date: string;
  week_number: number | null;
  monjaro_dose: number | null;
  status: string | null;
  weight: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  fat_mass: number | null;
  lean_mass: number | null;
  muscle_mass: number | null;
  muscle_rate_percent: number | null;
  skeletal_muscle_percent: number | null;
  bone_mass: number | null;
  protein_mass: number | null;
  protein_percent: number | null;
  body_water_percent: number | null;
  moisture_content: number | null;
  subcutaneous_fat_percent: number | null;
  visceral_fat: number | null;
  bmr: number | null;
  metabolic_age: number | null;
  whr: number | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { person } = useParams<{ person: string }>();
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [records, setRecords] = useState<BioimpedanceRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isReneer = person === "reneer";
  const personName = isReneer ? "Reneer" : "Ana Paula";

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }
    if (user) {
      loadData();
    }
  }, [person, user, loading, navigate]);

  const loadData = async () => {
    try {
      const userPerson = person as "reneer" | "ana_paula";
      const { data, error } = await supabase
        .from("bioimpedance")
        .select("*")
        .eq("user_person", userPerson)
        .order("measurement_date", { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const chartData = records.map((r) => ({
    semana: r.week_number || 0,
    peso: Number(r.weight),
    gordura: Number(r.body_fat_percent),
    musculo: Number(r.muscle_rate_percent),
  }));

  const exportToCSV = () => {
    const headers = [
      "Semana", "Data", "Monjaro (mg)", "Status", "Peso (kg)", "IMC", "Gordura (%)",
      "Massa Gorda (kg)", "Massa Livre (kg)", "Massa Musc (kg)", "Taxa Musc (%)",
      "Musc Esq (%)", "Massa Óssea (kg)", "Massa Proteica (kg)", "Proteína (%)",
      "Água Corp (%)", "G. Subcutânea (%)", "G. Visceral", "TMB (kcal)", "Idade Metabólica", "WHR"
    ];
    
    const rows = records.map(r => [
      r.week_number, r.measurement_date, r.monjaro_dose, r.status, r.weight, r.bmi,
      r.body_fat_percent, r.fat_mass, r.lean_mass, r.muscle_mass, r.muscle_rate_percent,
      r.skeletal_muscle_percent, r.bone_mass, r.protein_mass, r.protein_percent,
      r.body_water_percent, r.subcutaneous_fat_percent, r.visceral_fat, r.bmr,
      r.metabolic_age, r.whr
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bioimpedancia_${person}.csv`;
    a.click();
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="gap-2" onClick={() => navigate("/selecionar")}>
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" className="gap-2" onClick={() => navigate("/adicionar")}>
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={exportToCSV}>
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <div className="text-center mb-8 animate-fade-in">
          <h1 className={`text-4xl md:text-5xl font-serif font-bold mb-2 ${isReneer ? 'text-blue-600' : 'text-gradient'}`}>
            {personName}
          </h1>
          <p className="text-lg text-muted-foreground">
            Protocolo Monjaro & Recomposição Corporal
          </p>
        </div>

        {/* Summary Cards */}
        {records.length > 0 && (() => {
          const latest = records[records.length - 1];
          const first = records[0];
          const recentRecords = records.slice(-6); // Last 6 records for sparkline
          
          // Helper to get performance indicator with percentage
          const getPerformanceIndicator = (current: number, initial: number, lowerIsBetter: boolean) => {
            const diff = current - initial;
            const percent = Math.abs((diff / initial) * 100).toFixed(1);
            const threshold = Math.abs(initial * 0.01);
            
            if (Math.abs(diff) <= threshold) return { icon: "→", percent: "0%", color: "text-yellow-200", stroke: "#facc15" };
            if (lowerIsBetter) {
              return diff < 0 
                ? { icon: "↓", percent: `-${percent}%`, color: "text-emerald-300", stroke: "#6ee7b7" }
                : { icon: "↑", percent: `+${percent}%`, color: "text-red-300", stroke: "#fca5a5" };
            }
            return diff > 0 
              ? { icon: "↑", percent: `+${percent}%`, color: "text-emerald-300", stroke: "#6ee7b7" }
              : { icon: "↓", percent: `-${percent}%`, color: "text-red-300", stroke: "#fca5a5" };
          };

          const summaryItems = [
            { 
              label: "Peso", 
              value: `${Number(latest.weight).toFixed(1)} kg`,
              bg: "bg-gradient-to-br from-blue-500 to-blue-700",
              performance: getPerformanceIndicator(Number(latest.weight), Number(first.weight), true),
              sparkData: recentRecords.map(r => ({ v: Number(r.weight) }))
            },
            { 
              label: "IMC", 
              value: Number(latest.bmi).toFixed(1),
              bg: "bg-gradient-to-br from-indigo-500 to-indigo-700",
              performance: getPerformanceIndicator(Number(latest.bmi), Number(first.bmi), true),
              sparkData: recentRecords.map(r => ({ v: Number(r.bmi) }))
            },
            { 
              label: "Gordura", 
              value: `${Number(latest.body_fat_percent).toFixed(1)}%`,
              bg: "bg-gradient-to-br from-rose-100 to-rose-200",
              textColor: "text-rose-700",
              performance: getPerformanceIndicator(Number(latest.body_fat_percent), Number(first.body_fat_percent), true),
              sparkData: recentRecords.map(r => ({ v: Number(r.body_fat_percent) }))
            },
            { 
              label: "Músculo", 
              value: `${Number(latest.muscle_rate_percent).toFixed(1)}%`,
              bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
              performance: getPerformanceIndicator(Number(latest.muscle_rate_percent), Number(first.muscle_rate_percent), false),
              sparkData: recentRecords.map(r => ({ v: Number(r.muscle_rate_percent) }))
            },
            { 
              label: "G. Visceral", 
              value: Number(latest.visceral_fat).toFixed(0),
              bg: "bg-gradient-to-br from-orange-500 to-orange-700",
              performance: getPerformanceIndicator(Number(latest.visceral_fat), Number(first.visceral_fat), true),
              sparkData: recentRecords.map(r => ({ v: Number(r.visceral_fat) }))
            },
            { 
              label: "Idade Met.", 
              value: `${latest.metabolic_age}`,
              bg: "bg-gradient-to-br from-purple-500 to-purple-700",
              performance: getPerformanceIndicator(Number(latest.metabolic_age), Number(first.metabolic_age), true),
              sparkData: recentRecords.map(r => ({ v: Number(r.metabolic_age) }))
            },
          ];

          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 animate-slide-up">
              {summaryItems.map((item, i) => (
                <Card key={i} className={`card-elevated border-0 ${item.bg} shadow-lg overflow-hidden`}>
                  <CardContent className="p-3 text-center relative">
                    <p className={`text-[10px] uppercase tracking-wide mb-0.5 ${item.textColor ? item.textColor + '/70' : 'text-white/70'}`}>{item.label}</p>
                    <p className={`text-xl font-serif font-bold leading-tight ${item.textColor || 'text-white'}`}>{item.value}</p>
                    <span className={`text-[10px] font-medium ${item.performance.color}`}>
                      {item.performance.icon} {item.performance.percent}
                    </span>
                    {item.sparkData.length > 1 && (
                      <div className="h-8 mt-1 -mx-3 -mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={item.sparkData}>
                            <Line 
                              type="monotone" 
                              dataKey="v" 
                              stroke={item.performance.stroke}
                              strokeWidth={1.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle className="font-serif">Evolução do Peso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="semana" />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="peso" stroke={isReneer ? '#3b82f6' : '#FF6B6B'} strokeWidth={2} name="Peso (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle className="font-serif">Composição Corporal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="semana" />
                    <YAxis domain={[20, 70]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gordura" stroke="#FF6B6B" strokeWidth={2} name="Gordura (%)" />
                    <Line type="monotone" dataKey="musculo" stroke="#06D6A0" strokeWidth={2} name="Músculo (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Data and Protocol */}
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dados">📊 Dados</TabsTrigger>
            <TabsTrigger value="protocolo">📋 Protocolo</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <Card className="card-elevated border-0">
              <CardHeader>
                <CardTitle className="font-serif">Bioimpedância Completa</CardTitle>
                <p className="text-sm text-muted-foreground">Clique no + de cada coluna para ver a diferença até o valor ideal</p>
              </CardHeader>
              <CardContent className="p-2">
                <BioimpedanceTable records={records} isReneer={isReneer} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocolo">
            {isReneer ? <ReneerProtocol isAdmin={isAdmin} /> : <AnaPaulaProtocol isAdmin={isAdmin} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
