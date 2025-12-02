import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Supplement {
  id: string;
  supplement_name: string;
  dosage: string;
  notes: string | null;
}

interface SupplementationCardProps {
  userPerson: "reneer" | "ana_paula";
  title?: string;
  isAdmin?: boolean;
}

const SupplementationCard = ({ userPerson, title, isAdmin = false }: SupplementationCardProps) => {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ supplement_name: "", dosage: "", notes: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ supplement_name: "", dosage: "", notes: "" });

  useEffect(() => {
    loadSupplements();
  }, [userPerson]);

  const loadSupplements = async () => {
    const { data, error } = await supabase
      .from("supplementation")
      .select("*")
      .eq("user_person", userPerson)
      .order("created_at");

    if (error) {
      toast.error("Erro ao carregar suplementação");
      return;
    }
    setSupplements(data || []);
    setLoading(false);
  };

  const startEdit = (supp: Supplement) => {
    setEditingId(supp.id);
    setEditForm({
      supplement_name: supp.supplement_name,
      dosage: supp.dosage,
      notes: supp.notes || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ supplement_name: "", dosage: "", notes: "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const { error } = await supabase
      .from("supplementation")
      .update({
        supplement_name: editForm.supplement_name,
        dosage: editForm.dosage,
        notes: editForm.notes || null,
      })
      .eq("id", editingId);

    if (error) {
      toast.error("Erro ao salvar");
      return;
    }

    toast.success("Suplemento atualizado");
    cancelEdit();
    loadSupplements();
  };

  const deleteSupp = async (id: string) => {
    const { error } = await supabase.from("supplementation").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir");
      return;
    }

    toast.success("Suplemento excluído");
    loadSupplements();
  };

  const addSupp = async () => {
    if (!newForm.supplement_name || !newForm.dosage) {
      toast.error("Preencha nome e dosagem");
      return;
    }

    const { error } = await supabase.from("supplementation").insert({
      user_person: userPerson,
      supplement_name: newForm.supplement_name,
      dosage: newForm.dosage,
      notes: newForm.notes || null,
    });

    if (error) {
      toast.error("Erro ao adicionar");
      return;
    }

    toast.success("Suplemento adicionado");
    setIsAdding(false);
    setNewForm({ supplement_name: "", dosage: "", notes: "" });
    loadSupplements();
  };

  const displayTitle = title || (userPerson === "reneer" ? "Suplementação Reneer" : "Suplementação Ana Paula");

  return (
    <Card className="card-elevated border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif text-xl">💊 {displayTitle}</CardTitle>
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <>
            {isAdmin && isAdding && (
              <div className="p-3 border rounded-lg space-y-2 bg-secondary/20">
                <Input
                  placeholder="Nome do suplemento"
                  value={newForm.supplement_name}
                  onChange={(e) => setNewForm({ ...newForm, supplement_name: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Dosagem"
                  value={newForm.dosage}
                  onChange={(e) => setNewForm({ ...newForm, dosage: e.target.value })}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Observações (opcional)"
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addSupp} className="h-7 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAdding(false);
                      setNewForm({ supplement_name: "", dosage: "", notes: "" });
                    }}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" /> Cancelar
                  </Button>
                </div>
              </div>
            )}

            {supplements.map((supp) => (
              <div key={supp.id}>
                {editingId === supp.id ? (
                  <div className="p-3 border rounded-lg space-y-2 bg-secondary/20">
                    <Input
                      value={editForm.supplement_name}
                      onChange={(e) => setEditForm({ ...editForm, supplement_name: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editForm.dosage}
                      onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Observações"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} className="h-7 text-xs">
                        <Check className="h-3 w-3 mr-1" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs">
                        <X className="h-3 w-3 mr-1" /> Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded group">
                    <div className="flex-1">
                      <span className="font-medium text-sm">{supp.supplement_name}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {supp.dosage}</span>
                      {supp.notes && <span className="text-xs text-muted-foreground ml-2">({supp.notes})</span>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(supp)} className="h-7 w-7 p-0">
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSupp(supp.id)}
                          className="h-7 w-7 p-0 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {supplements.length === 0 && !isAdding && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum suplemento cadastrado.{isAdmin && " Clique em + para adicionar."}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplementationCard;
