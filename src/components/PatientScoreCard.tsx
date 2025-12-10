import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientScore {
  id: string;
  patient_id: string;
  score: number;
  weight_evolution: number;
  fat_evolution: number;
  muscle_evolution: number;
  criticality: string;
  rank_position: number | null;
}

interface PatientScoreCardProps {
  patientId: string;
  patientName?: string;
}

const getCriticalityColor = (criticality: string) => {
  switch (criticality) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'normal':
      return 'bg-sky-500';
    case 'attention':
      return 'bg-amber-500';
    case 'critical':
      return 'bg-rose-500';
    default:
      return 'bg-gray-500';
  }
};

const getCriticalityBgColor = (criticality: string) => {
  switch (criticality) {
    case 'healthy':
      return 'bg-emerald-100 dark:bg-emerald-950/30';
    case 'normal':
      return 'bg-sky-100 dark:bg-sky-950/30';
    case 'attention':
      return 'bg-amber-100 dark:bg-amber-950/30';
    case 'critical':
      return 'bg-rose-100 dark:bg-rose-950/30';
    default:
      return 'bg-gray-100 dark:bg-gray-950/30';
  }
};

const getCriticalityLabel = (criticality: string) => {
  switch (criticality) {
    case 'healthy':
      return 'Excelente';
    case 'normal':
      return 'Bom';
    case 'attention':
      return 'Atenção';
    case 'critical':
      return 'Crítico';
    default:
      return 'Sem dados';
  }
};

const normalizeScore = (score: number): number => {
  // Normalize score to 0-100 range for progress bar
  // Scores typically range from -100 to +100
  const normalized = Math.min(100, Math.max(0, (score + 100) / 2));
  return normalized;
};

export function PatientScoreCard({ patientId, patientName }: PatientScoreCardProps) {
  const [score, setScore] = useState<PatientScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScore = async () => {
      const { data, error } = await supabase
        .from('patient_scores')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (!error && data) {
        setScore(data);
      }
      setLoading(false);
    };

    loadScore();
  }, [patientId]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Sem dados de evolução ainda</p>
        </CardContent>
      </Card>
    );
  }

  const normalizedScore = normalizeScore(score.score);

  return (
    <Card className={cn("overflow-hidden", getCriticalityBgColor(score.criticality))}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {score.rank_position && score.rank_position <= 3 && (
              <Trophy className={cn(
                "h-5 w-5",
                score.rank_position === 1 && "text-yellow-500",
                score.rank_position === 2 && "text-gray-400",
                score.rank_position === 3 && "text-amber-700"
              )} />
            )}
            Seu Score de Evolução
          </span>
          <span className="text-2xl font-bold">
            {score.score.toFixed(0)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className={cn(
              "font-medium",
              score.criticality === 'healthy' && "text-emerald-600",
              score.criticality === 'normal' && "text-sky-600",
              score.criticality === 'attention' && "text-amber-600",
              score.criticality === 'critical' && "text-rose-600"
            )}>
              {getCriticalityLabel(score.criticality)}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={normalizedScore} 
              className="h-3 bg-muted/50"
            />
            <div 
              className={cn(
                "absolute top-0 left-0 h-3 rounded-full transition-all",
                getCriticalityColor(score.criticality)
              )}
              style={{ width: `${normalizedScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {score.weight_evolution > 0 ? (
                <TrendingDown className="h-4 w-4 text-emerald-500" />
              ) : score.weight_evolution < 0 ? (
                <TrendingUp className="h-4 w-4 text-rose-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
              <span className={cn(
                "text-sm font-semibold",
                score.weight_evolution > 0 ? "text-emerald-600" : 
                score.weight_evolution < 0 ? "text-rose-600" : "text-gray-500"
              )}>
                {score.weight_evolution.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Peso</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {score.fat_evolution > 0 ? (
                <TrendingDown className="h-4 w-4 text-emerald-500" />
              ) : score.fat_evolution < 0 ? (
                <TrendingUp className="h-4 w-4 text-rose-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
              <span className={cn(
                "text-sm font-semibold",
                score.fat_evolution > 0 ? "text-emerald-600" : 
                score.fat_evolution < 0 ? "text-rose-600" : "text-gray-500"
              )}>
                {score.fat_evolution.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Gordura</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {score.muscle_evolution > 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : score.muscle_evolution < 0 ? (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              ) : (
                <Minus className="h-4 w-4 text-gray-400" />
              )}
              <span className={cn(
                "text-sm font-semibold",
                score.muscle_evolution > 0 ? "text-emerald-600" : 
                score.muscle_evolution < 0 ? "text-rose-600" : "text-gray-500"
              )}>
                {score.muscle_evolution.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Músculo</span>
          </div>
        </div>

        {score.rank_position && (
          <div className="text-center pt-2 border-t border-muted/30">
            <span className="text-sm text-muted-foreground">
              Posição no ranking: <strong className="text-foreground">#{score.rank_position}</strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
