import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Calendar, Weight, Activity, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnalysisRecord {
  id: string;
  user_person: string;
  analysis_date: string;
  summary: string;
  full_analysis: string;
  weight_at_analysis: number | null;
  bmi_at_analysis: number | null;
  fat_at_analysis: number | null;
}

interface AnalysisHistoryProps {
  userPerson: string;
  isAdmin?: boolean;
}

const AnalysisHistory = ({ userPerson, isAdmin = false }: AnalysisHistoryProps) => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [userPerson]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_analysis_history")
        .select("*")
        .eq("user_person", userPerson)
        .order("analysis_date", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading analysis history:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from("ai_analysis_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setHistory(prev => prev.filter(h => h.id !== id));
      toast.success("Análise removida");
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast.error("Erro ao remover análise");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card className="card-elevated border-0">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="card-elevated border-0">
        <CardContent className="p-6 text-center text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma análise IA gerada ainda.</p>
          <p className="text-sm mt-1">Use o botão "Forçar Análise com IA" para gerar a primeira análise.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Análises IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((record) => (
          <Dialog key={record.id}>
            <div className="flex items-center gap-2">
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto hover:bg-violet-500/10 group"
                  onClick={() => setSelectedAnalysis(record)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 rounded-lg bg-violet-500/20">
                      <Calendar className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">
                        {format(new Date(record.analysis_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {record.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      {record.weight_at_analysis && (
                        <span className="flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          {record.weight_at_analysis.toFixed(1)}kg
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Button>
              </DialogTrigger>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteAnalysis(record.id)}
                  disabled={deleting === record.id}
                >
                  {deleting === record.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="font-serif flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-500" />
                  Análise de {format(new Date(record.analysis_date), "dd/MM/yyyy 'às' HH:mm")}
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-4">
                  {/* Metrics at time of analysis */}
                  <div className="grid grid-cols-3 gap-3">
                    {record.weight_at_analysis && (
                      <div className="p-3 rounded-lg bg-blue-500/20 text-center">
                        <p className="text-[10px] text-blue-300 uppercase">Peso</p>
                        <p className="text-lg font-bold text-blue-400">{record.weight_at_analysis.toFixed(1)} kg</p>
                      </div>
                    )}
                    {record.bmi_at_analysis && (
                      <div className="p-3 rounded-lg bg-indigo-500/20 text-center">
                        <p className="text-[10px] text-indigo-300 uppercase">IMC</p>
                        <p className="text-lg font-bold text-indigo-400">{record.bmi_at_analysis.toFixed(1)}</p>
                      </div>
                    )}
                    {record.fat_at_analysis && (
                      <div className="p-3 rounded-lg bg-rose-500/20 text-center">
                        <p className="text-[10px] text-rose-300 uppercase">Gordura</p>
                        <p className="text-lg font-bold text-rose-400">{record.fat_at_analysis.toFixed(1)}%</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Full analysis */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm">{record.full_analysis}</div>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        ))}
      </CardContent>
    </Card>
  );
};

export default AnalysisHistory;
