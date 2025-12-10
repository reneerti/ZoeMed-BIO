import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank_position: number;
  patient_name: string;
  score: number;
}

export function LeaderboardTop3() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      // Use the RPC function to get top 3
      const { data, error } = await supabase
        .rpc('get_leaderboard_top3');

      if (!error && data) {
        setLeaderboard(data);
      }
      setLoading(false);
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-center text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Ranking em construção</p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBg = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top 3 Evolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.rank_position}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-[1.02]",
              getRankBg(entry.rank_position)
            )}
          >
            <div className="flex items-center gap-3">
              {getRankIcon(entry.rank_position)}
              <div>
                <span className="font-semibold text-sm">
                  #{entry.rank_position}
                </span>
                <span className="ml-2 text-sm">
                  {entry.patient_name}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={cn(
                "font-bold text-lg",
                entry.rank_position === 1 && "text-yellow-600 dark:text-yellow-400",
                entry.rank_position === 2 && "text-gray-600 dark:text-gray-300",
                entry.rank_position === 3 && "text-amber-700 dark:text-amber-400"
              )}>
                {entry.score.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">pts</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
