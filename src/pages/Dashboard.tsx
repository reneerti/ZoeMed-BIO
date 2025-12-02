import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnaPaulaProtocol from "@/components/AnaPaulaProtocol";
import ReneerProtocol from "@/components/ReneerProtocol";
import { useAuth } from "@/hooks/useAuth";

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
            <Button variant="outline" className="gap-2" onClick={() => navigate("/adicionar")}>
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
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
          
          // Helper to get performance indicator (arrow and small text)
          const getPerformanceIndicator = (current: number, initial: number, lowerIsBetter: boolean) => {
            const diff = current - initial;
            const percent = ((diff / initial) * 100).toFixed(1);
            const threshold = Math.abs(initial * 0.01);
            
            if (Math.abs(diff) <= threshold) return { icon: "→", color: "text-amber-200" };
            if (lowerIsBetter) {
              return diff < 0 
                ? { icon: "↓", color: "text-emerald-300" }
                : { icon: "↑", color: "text-red-300" };
            }
            return diff > 0 
              ? { icon: "↑", color: "text-emerald-300" }
              : { icon: "↓", color: "text-red-300" };
          };

          const summaryItems = [
            { 
              label: "Peso Atual", 
              value: `${Number(latest.weight).toFixed(1)} kg`,
              bg: "bg-gradient-to-br from-blue-500 to-blue-700",
              performance: getPerformanceIndicator(Number(latest.weight), Number(first.weight), true)
            },
            { 
              label: "IMC", 
              value: Number(latest.bmi).toFixed(1),
              bg: "bg-gradient-to-br from-indigo-500 to-indigo-700",
              performance: getPerformanceIndicator(Number(latest.bmi), Number(first.bmi), true)
            },
            { 
              label: "Gordura", 
              value: `${Number(latest.body_fat_percent).toFixed(1)}%`,
              bg: "bg-gradient-to-br from-rose-500 to-rose-700",
              performance: getPerformanceIndicator(Number(latest.body_fat_percent), Number(first.body_fat_percent), true)
            },
            { 
              label: "Músculo", 
              value: `${Number(latest.muscle_rate_percent).toFixed(1)}%`,
              bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
              performance: getPerformanceIndicator(Number(latest.muscle_rate_percent), Number(first.muscle_rate_percent), false)
            },
            { 
              label: "G. Visceral", 
              value: Number(latest.visceral_fat).toFixed(0),
              bg: "bg-gradient-to-br from-amber-500 to-amber-700",
              performance: getPerformanceIndicator(Number(latest.visceral_fat), Number(first.visceral_fat), true)
            },
            { 
              label: "Idade Met.", 
              value: `${latest.metabolic_age} anos`,
              bg: "bg-gradient-to-br from-purple-500 to-purple-700",
              performance: getPerformanceIndicator(Number(latest.metabolic_age), Number(first.metabolic_age), true)
            },
          ];

          return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8 animate-slide-up">
              {summaryItems.map((item, i) => (
                <Card key={i} className={`card-elevated border-0 ${item.bg} shadow-lg`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-xs uppercase tracking-wide mb-1 text-white/80">{item.label}</p>
                    <p className="text-2xl font-serif font-bold text-white">{item.value}</p>
                    <span className={`text-xs ${item.performance.color}`}>{item.performance.icon}</span>
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
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-charcoal hover:bg-charcoal">
                        <TableHead className="text-primary-foreground font-semibold">Semana</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Monjaro</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Status</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Peso</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">IMC</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Gordura %</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">M. Gorda</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">M. Livre</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">M. Musc</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Taxa Musc %</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">M. Óssea</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Proteína %</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Água %</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">G. Subcut %</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">G. Visceral</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">TMB</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">Id. Met.</TableHead>
                        <TableHead className="text-primary-foreground font-semibold">WHR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record, i) => {
                        const isHiato = record.status?.includes("HIATO");
                        const prev = i > 0 ? records[i - 1] : null;
                        
                        // Get cell color based on evolution
                        const getCellColor = (current: number | null, previous: number | null, lowerIsBetter: boolean) => {
                          if (!prev || current === null || previous === null) return "";
                          const diff = current - previous;
                          const threshold = Math.abs(previous * 0.005); // 0.5% threshold
                          
                          if (Math.abs(diff) <= threshold) return "bg-warning/30 text-warning-foreground"; // Yellow - stagnant
                          if (lowerIsBetter) {
                            return diff < 0 ? "bg-success/30 text-success" : "bg-destructive/30 text-destructive"; 
                          }
                          return diff > 0 ? "bg-success/30 text-success" : "bg-destructive/30 text-destructive";
                        };
                        
                        return (
                          <TableRow 
                            key={record.id} 
                            className={`${isHiato ? 'bg-warning/20' : i % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}`}
                          >
                            <TableCell className="font-semibold">{record.week_number} {isHiato && '⚠️'}</TableCell>
                            <TableCell>{record.monjaro_dose} mg</TableCell>
                            <TableCell>{record.status}</TableCell>
                            <TableCell className={`font-semibold ${getCellColor(Number(record.weight), prev ? Number(prev.weight) : null, true)}`}>
                              {Number(record.weight).toFixed(1)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.bmi), prev ? Number(prev.bmi) : null, true)}>
                              {Number(record.bmi).toFixed(1)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.body_fat_percent), prev ? Number(prev.body_fat_percent) : null, true)}>
                              {Number(record.body_fat_percent).toFixed(1)}%
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.fat_mass), prev ? Number(prev.fat_mass) : null, true)}>
                              {Number(record.fat_mass).toFixed(1)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.lean_mass), prev ? Number(prev.lean_mass) : null, false)}>
                              {Number(record.lean_mass).toFixed(1)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.muscle_mass), prev ? Number(prev.muscle_mass) : null, false)}>
                              {Number(record.muscle_mass).toFixed(1)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.muscle_rate_percent), prev ? Number(prev.muscle_rate_percent) : null, false)}>
                              {Number(record.muscle_rate_percent).toFixed(1)}%
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.bone_mass), prev ? Number(prev.bone_mass) : null, false)}>
                              {Number(record.bone_mass).toFixed(1)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.protein_percent), prev ? Number(prev.protein_percent) : null, false)}>
                              {Number(record.protein_percent).toFixed(1)}%
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.body_water_percent), prev ? Number(prev.body_water_percent) : null, false)}>
                              {Number(record.body_water_percent).toFixed(1)}%
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.subcutaneous_fat_percent), prev ? Number(prev.subcutaneous_fat_percent) : null, true)}>
                              {Number(record.subcutaneous_fat_percent).toFixed(1)}%
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.visceral_fat), prev ? Number(prev.visceral_fat) : null, true)}>
                              {Number(record.visceral_fat).toFixed(0)}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.bmr), prev ? Number(prev.bmr) : null, false)}>
                              {record.bmr}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.metabolic_age), prev ? Number(prev.metabolic_age) : null, true)}>
                              {record.metabolic_age}
                            </TableCell>
                            <TableCell className={getCellColor(Number(record.whr), prev ? Number(prev.whr) : null, true)}>
                              {Number(record.whr).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocolo">
            {isReneer ? <ReneerProtocol /> : <AnaPaulaProtocol />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
