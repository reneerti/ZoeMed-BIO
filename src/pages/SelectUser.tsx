import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown, TrendingUp, Scale, Activity, Plus, BarChart3, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ComparativeCharts from "@/components/ComparativeCharts";
import ProteinCalculator from "@/components/ProteinCalculator";
import { toast } from "sonner";
import reneerAvatar from "@/assets/reneer-avatar.png";
import anaPaulaAvatar from "@/assets/ana-paula-avatar.png";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface UserSummary {
  name: string;
  latestWeight: number;
  initialWeight: number;
  weightChange: number;
  latestFat: number;
  latestMuscle: number;
  latestVisceralFat: number;
  latestBmi: number;
  latestBmr: number;
  measurements: number;
  chartData: { week: number; weight: number }[];
  fatHistory: { week: number; fat: number }[];
}

interface UserProfile {
  user_person: string;
  avatar_url: string | null;
  display_name: string | null;
}

const SelectUser = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [reneerData, setReneerData] = useState<UserSummary | null>(null);
  const [anaPaulaData, setAnaPaulaData] = useState<UserSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [profiles, setProfiles] = useState<{ reneer: UserProfile | null; anaPaula: UserProfile | null }>({
    reneer: null,
    anaPaula: null,
  });
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }
    if (user) {
      loadData();
      loadProfiles();
    }
  }, [user, loading, navigate]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*");
      
      if (error) throw error;
      
      const reneerProfile = data?.find(p => p.user_person === 'reneer') || null;
      const anaPaulaProfile = data?.find(p => p.user_person === 'ana_paula') || null;
      
      setProfiles({
        reneer: reneerProfile,
        anaPaula: anaPaulaProfile,
      });
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const handleAvatarUpload = async (person: "reneer" | "ana_paula", file: File) => {
    setUploading(person);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${person}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('bioimpedance-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bioimpedance-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_person', person);

      if (updateError) throw updateError;

      toast.success("Foto atualizada com sucesso!");
      loadProfiles();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Erro ao fazer upload da foto");
    } finally {
      setUploading(null);
    }
  };

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
          latestVisceralFat: Number(last.visceral_fat),
          latestBmi: Number(last.bmi),
          latestBmr: Number(last.bmr),
          measurements: reneerRecords.length,
          chartData: reneerRecords.map((r) => ({
            week: r.week_number || 0,
            weight: Number(r.weight),
          })),
          fatHistory: reneerRecords.map((r) => ({
            week: r.week_number || 0,
            fat: Number(r.body_fat_percent),
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
          latestVisceralFat: Number(last.visceral_fat),
          latestBmi: Number(last.bmi),
          latestBmr: Number(last.bmr),
          measurements: anaPaulaRecords.length,
          chartData: anaPaulaRecords.map((r) => ({
            week: r.week_number || 0,
            weight: Number(r.weight),
          })),
          fatHistory: anaPaulaRecords.map((r) => ({
            week: r.week_number || 0,
            fat: Number(r.body_fat_percent),
          })),
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const UserCard = ({ data, person }: { data: UserSummary | null; person: "reneer" | "ana_paula" }) => {
    const isReneer = person === "reneer";
    const primaryColor = isReneer ? 'hsl(217, 91%, 60%)' : 'hsl(340, 82%, 62%)';
    const bgClass = isReneer ? 'bg-reneer-primary' : 'bg-ana-paula-primary';
    const defaultAvatar = isReneer ? reneerAvatar : anaPaulaAvatar;
    const profile = isReneer ? profiles.reneer : profiles.anaPaula;
    const avatarUrl = profile?.avatar_url || defaultAvatar;
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Arquivo muito grande. Máximo 5MB.");
          return;
        }
        handleAvatarUpload(person, file);
      }
    };

    return (
      <Card 
        className="card-elevated border-0 overflow-hidden"
      >
        <div className={`h-1 ${bgClass}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="relative group/avatar">
              <img 
                src={avatarUrl} 
                alt={isReneer ? "Reneer" : "Ana Paula"} 
                className={`w-14 h-14 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background cursor-pointer ${isReneer ? 'ring-reneer-primary' : 'ring-ana-paula-primary'}`}
                onClick={() => navigate(`/dashboard/${person}`)}
              />
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className={`absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity ${uploading === person ? 'opacity-100' : ''}`}
                  disabled={uploading === person}
                >
                  {uploading === person ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileSelect}
              />
            </div>
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => navigate(`/dashboard/${person}`)}
            >
              <CardTitle className={`text-2xl font-serif group-hover:${isReneer ? 'text-reneer-primary' : 'text-ana-paula-primary'} transition-colors`}>
                {profile?.display_name || data?.name || (isReneer ? "Reneer" : "Ana Paula")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {data ? `${data.measurements} medições` : "Carregando..."}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent 
          className="space-y-4 cursor-pointer"
          onClick={() => navigate(`/dashboard/${person}`)}
        >
          {data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-center">
                  <p className="text-[10px] text-white/70 uppercase">Peso</p>
                  <p className="text-sm font-bold text-white">{data.latestWeight.toFixed(1)} kg</p>
                  <span className={`text-[10px] ${data.weightChange < 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {data.weightChange < 0 ? '↓' : '↑'} {Math.abs((data.weightChange / data.initialWeight) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 text-center">
                  <p className="text-[10px] text-white/70 uppercase">Gordura</p>
                  <p className="text-sm font-bold text-white">{data.latestFat.toFixed(1)}%</p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-center">
                  <p className="text-[10px] text-white/70 uppercase">Músculo</p>
                  <p className="text-sm font-bold text-white">{data.latestMuscle.toFixed(1)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-center">
                  <p className="text-[10px] text-white/70 uppercase">IMC</p>
                  <p className="text-sm font-bold text-white">{data.latestBmi.toFixed(1)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 text-center">
                  <p className="text-[10px] text-white/70 uppercase">G. Visceral</p>
                  <p className="text-sm font-bold text-white">{data.latestVisceralFat.toFixed(0)}</p>
                </div>
                <ProteinCalculator weight={data.latestWeight} person={person} />
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
                        stroke={primaryColor} 
                        strokeWidth={2}
                        dot={{ fill: primaryColor, r: 3 }}
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

  const comparisonData = reneerData && anaPaulaData ? {
    reneer: {
      weight: reneerData.latestWeight,
      fat: reneerData.latestFat,
      muscle: reneerData.latestMuscle,
      visceralFat: reneerData.latestVisceralFat,
      bmi: reneerData.latestBmi,
      bmr: reneerData.latestBmr,
      weightHistory: reneerData.chartData,
      fatHistory: reneerData.fatHistory,
      initialWeight: reneerData.initialWeight,
      weightChange: reneerData.weightChange,
      measurements: reneerData.measurements,
    },
    anaPaula: {
      weight: anaPaulaData.latestWeight,
      fat: anaPaulaData.latestFat,
      muscle: anaPaulaData.latestMuscle,
      visceralFat: anaPaulaData.latestVisceralFat,
      bmi: anaPaulaData.latestBmi,
      bmr: anaPaulaData.latestBmr,
      weightHistory: anaPaulaData.chartData,
      fatHistory: anaPaulaData.fatHistory,
      initialWeight: anaPaulaData.initialWeight,
      weightChange: anaPaulaData.weightChange,
      measurements: anaPaulaData.measurements,
    },
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={handleSignOut}
          >
            <ArrowLeft className="w-4 h-4" />
            Sair
          </Button>
          <div className="flex gap-2">
            <Button
              variant={showComparison ? "default" : "outline"}
              className="gap-2"
              onClick={() => setShowComparison(!showComparison)}
            >
              <BarChart3 className="w-4 h-4" />
              {showComparison ? "Ver Perfis" : "Comparar"}
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/adicionar")}
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-2">
            Resumo Health
          </h1>
          <p className="text-lg text-muted-foreground">Família de Jesus</p>
        </div>

        {showComparison && comparisonData ? (
          <ComparativeCharts data={comparisonData} />
        ) : (
          <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
            <UserCard data={reneerData} person="reneer" />
            <UserCard data={anaPaulaData} person="ana_paula" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectUser;
