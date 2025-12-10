import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Syringe, Calendar, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MonjaroRecord {
  id: string;
  dose: number;
  application_date: string;
  week_number: number | null;
  notes: string | null;
  side_effects: string | null;
}

interface MonjaroTrackingProps {
  patientId: string;
  isAdmin: boolean;
}

const MonjaroTracking = ({ patientId, isAdmin }: MonjaroTrackingProps) => {
  const [records, setRecords] = useState<MonjaroRecord[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MonjaroRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dose: "",
    application_date: "",
    week_number: "",
    notes: "",
    side_effects: ""
  });

  useEffect(() => {
    loadRecords();
  }, [patientId]);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("monjaro_treatments")
        .select("*")
        .eq("patient_id", patientId)
        .order("application_date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error loading Monjaro records:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      dose: "",
      application_date: new Date().toISOString().split("T")[0],
      week_number: "",
      notes: "",
      side_effects: ""
    });
  };

  const handleAddRecord = async () => {
    if (!formData.dose || !formData.application_date) {
      toast.error("Dose e data são obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("monjaro_treatments")
        .insert({
          patient_id: patientId,
          dose: parseFloat(formData.dose),
          application_date: formData.application_date,
          week_number: formData.week_number ? parseInt(formData.week_number) : null,
          notes: formData.notes || null,
          side_effects: formData.side_effects || null
        });

      if (error) throw error;

      toast.success("Registro de Monjaro adicionado!");
      setIsAddDialogOpen(false);
      resetForm();
      loadRecords();
    } catch (error) {
      console.error("Error adding Monjaro record:", error);
      toast.error("Erro ao adicionar registro");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("monjaro_treatments")
        .delete()
        .eq("id", selectedRecord.id);

      if (error) throw error;

      toast.success("Registro removido!");
      setDeleteDialogOpen(false);
      setSelectedRecord(null);
      loadRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Erro ao remover registro");
    } finally {
      setIsLoading(false);
    }
  };

  const getDoseColor = (dose: number) => {
    if (dose <= 2.5) return "bg-green-500";
    if (dose <= 5) return "bg-blue-500";
    if (dose <= 7.5) return "bg-amber-500";
    if (dose <= 10) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Syringe className="w-5 h-5 text-primary" />
            Protocolo Monjaro
          </CardTitle>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary rounded-xl" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Registro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Aplicação de Monjaro</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dose">Dose (mg) *</Label>
                      <Input
                        id="dose"
                        type="number"
                        step="0.5"
                        placeholder="Ex: 2.5"
                        value={formData.dose}
                        onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="application_date">Data *</Label>
                      <Input
                        id="application_date"
                        type="date"
                        value={formData.application_date}
                        onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="week_number">Semana do Tratamento</Label>
                    <Input
                      id="week_number"
                      type="number"
                      placeholder="Ex: 4"
                      value={formData.week_number}
                      onChange={(e) => setFormData({ ...formData, week_number: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Anotações sobre a aplicação..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="rounded-xl resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="side_effects">Efeitos Colaterais</Label>
                    <Textarea
                      id="side_effects"
                      placeholder="Relate quaisquer efeitos colaterais..."
                      value={formData.side_effects}
                      onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
                      className="rounded-xl resize-none"
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleAddRecord} 
                    className="w-full gradient-primary rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? "Salvando..." : "Adicionar Registro"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Syringe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum registro de Monjaro</p>
            {isAdmin && (
              <p className="text-sm mt-2">Adicione a primeira aplicação para começar o acompanhamento</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-12 rounded-full ${getDoseColor(record.dose)}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{record.dose} mg</span>
                      {record.week_number && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Semana {record.week_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(record.application_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {record.side_effects && (
                    <div className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span className="hidden md:inline">Efeitos relatados</span>
                    </div>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedRecord(record);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dose Guide */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm font-medium mb-3">Guia de Doses:</p>
          <div className="flex flex-wrap gap-2">
            {[2.5, 5, 7.5, 10, 12.5, 15].map((dose) => (
              <div key={dose} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getDoseColor(dose)}`} />
                <span className="text-xs text-muted-foreground">{dose}mg</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de Monjaro?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRecord}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MonjaroTracking;