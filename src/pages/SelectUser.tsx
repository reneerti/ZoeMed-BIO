import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, TrendingDown, TrendingUp, Scale, Activity, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface UserSummary {
  name: string;
  latestWeight: number;
  initialWeight: number;
  weightChange: number;
  latestFat: number;
  latestMuscle: number;
  measurements: number;
  chartData: { week: number; weight: number }[];
}

const SelectUser = () => {
  const navigate = useNavigate();
  const [reneerData, setReneerData] = useState<UserSummary | null>(null);
  const [anaPaulaData, setAnaPaulaData] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const { data: reneerRecords } = await supabase
        .from("bioimpedance")
        .select("*")
        .eq("user_person", "reneer")
        .order("measurement_date", { ascending: true });

      const { data: anaPaulaRecords } = await supabase
        .from("bioimpedance")
        .select("*")
        .eq("user_person", "ana_paula")
        .order("measurement_date", { ascending: true });

      if (reneerRecords && reneerRecords.length > 0) {
        const first = reneerRecords[0];
        const last = reneerRecords[reneerRecords.length - 1];
        setReneerData({
          name: "Reneer",
          latestWeight: Number(last.weight),
          initialWeight: Number(first.weight),
          weightChange: Number(last.weight) - Number(first.weight),
          latestFat: Number(last.body_fat_percent),
          latestMuscle: Number(last.muscle_rate_percent),
          measurements: reneerRecords.length,
          chartData: reneerRecords.map((r) => ({
            week: r.week_number || 0,
            weight: Number(r.weight),
          })),
        });
      }

      if (anaPaulaRecords && anaPaulaRecords.length > 0) {
        const first = anaPaulaRecords[0];
        const last = anaPaulaRecords[anaPaulaRecords.length - 1];
        setAnaPaulaData({
          name: "Ana Paula",
          latestWeight: Number(last.weight),
          initialWeight: Number(first.weight),
          weightChange: Number(last.weight) - Number(first.weight),
          latestFat: Number(last.body_fat_percent),
          latestMuscle: Number(last.muscle_rate_percent),
          measurements: anaPaulaRecords.length,
          chartData: anaPaulaRecords.map((r) => ({
            week: r.week_number || 0,
            weight: Number(r.weight),
          })),
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const UserCard = ({ data, person }: { data: UserSummary | null; person: "reneer" | "ana_paula" }) => {
    const isReneer = person === "reneer";
    
    return (
      <Card 
        className="card-elevated border-0 cursor-pointer group overflow-hidden"
        onClick={() => navigate(`/dashboard/${person}`)}
      >
        <div className={`h-1 ${isReneer ? 'bg-blue-500' : 'gradient-primary'}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isReneer ? 'bg-blue-100 text-blue-600' : 'bg-coral/20 text-coral'}`}>
              <User className="w-7 h-7" />
            </div>
            <div>
              <CardTitle className="text-2xl font-serif group-hover:text-primary transition-colors">
                {data?.name || (isReneer ? "Reneer" : "Ana Paula")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.measurements} medições` : "Carregando..."}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Scale className="w-4 h-4" />
                    Peso Atual
                  </div>
                  <p className="text-xl font-semibold">{data.latestWeight.toFixed(1)} kg</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    {data.weightChange < 0 ? (
                      <TrendingDown className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-destructive" />
                    )}
                    Variação
                  </div>
                  <p className={`text-xl font-semibold ${data.weightChange < 0 ? 'text-success' : 'text-destructive'}`}>
                    {data.weightChange > 0 ? '+' : ''}{data.weightChange.toFixed(1)} kg
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Activity className="w-4 h-4" />
                    Gordura
                  </div>
                  <p className="text-xl font-semibold">{data.latestFat.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Activity className="w-4 h-4" />
                    Músculo
                  </div>
                  <p className="text-xl font-semibold">{data.latestMuscle.toFixed(1)}%</p>
                </div>
              </div>

              {data.chartData.length > 1 && (
                <div className="h-32 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartData}>
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke={isReneer ? '#3b82f6' : '#FF6B6B'} 
                        strokeWidth={2}
                        dot={{ fill: isReneer ? '#3b82f6' : '#FF6B6B', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => {
              localStorage.removeItem("isAuthenticated");
              navigate("/");
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Sair
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/adicionar")}
          >
            <Plus className="w-4 h-4" />
            Adicionar Medição
          </Button>
        </div>

        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
            Resumo Health
          </h1>
          <p className="text-lg text-muted-foreground">Família de Jesus</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
          <UserCard data={reneerData} person="reneer" />
          <UserCard data={anaPaulaData} person="ana_paula" />
        </div>
      </div>
    </div>
  );
};

export default SelectUser;
