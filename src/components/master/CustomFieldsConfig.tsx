import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  options: any;
  is_required: boolean;
  display_order: number;
}

const CustomFieldsConfig = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newField, setNewField] = useState({
    field_name: "",
    field_label: "",
    field_type: "text",
    options: "",
    is_required: false
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_fields_config")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error("Error loading fields:", error);
    }
  };

  const handleAddField = async () => {
    if (!newField.field_name || !newField.field_label) {
      toast.error("Nome e rótulo são obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("custom_fields_config")
        .insert({
          field_name: newField.field_name.toLowerCase().replace(/\s+/g, "_"),
          field_label: newField.field_label,
          field_type: newField.field_type,
          options: newField.field_type === "select" && newField.options 
            ? newField.options.split(",").map(o => o.trim()) 
            : null,
          is_required: newField.is_required,
          display_order: fields.length
        });

      if (error) throw error;

      toast.success("Campo adicionado com sucesso!");
      setIsAddDialogOpen(false);
      setNewField({
        field_name: "",
        field_label: "",
        field_type: "text",
        options: "",
        is_required: false
      });
      loadFields();
    } catch (error) {
      console.error("Error adding field:", error);
      toast.error("Erro ao adicionar campo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      const { error } = await supabase
        .from("custom_fields_config")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Campo removido com sucesso!");
      loadFields();
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Erro ao remover campo");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Campos Personalizados
              </CardTitle>
              <CardDescription>
                Configure campos adicionais para os cadastros de pacientes
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Campo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Campo Personalizado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="field_label">Rótulo do Campo *</Label>
                    <Input
                      id="field_label"
                      placeholder="Ex: Objetivo Principal"
                      value={newField.field_label}
                      onChange={(e) => setNewField({ 
                        ...newField, 
                        field_label: e.target.value,
                        field_name: e.target.value.toLowerCase().replace(/\s+/g, "_")
                      })}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="field_type">Tipo do Campo</Label>
                    <Select 
                      value={newField.field_type} 
                      onValueChange={(value) => setNewField({ ...newField, field_type: value })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                        <SelectItem value="select">Lista de Opções</SelectItem>
                        <SelectItem value="textarea">Texto Longo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newField.field_type === "select" && (
                    <div className="space-y-2">
                      <Label htmlFor="options">Opções (separadas por vírgula)</Label>
                      <Input
                        id="options"
                        placeholder="Opção 1, Opção 2, Opção 3"
                        value={newField.options}
                        onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_required">Campo Obrigatório</Label>
                    <Switch
                      id="is_required"
                      checked={newField.is_required}
                      onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                    />
                  </div>

                  <Button 
                    onClick={handleAddField} 
                    className="w-full gradient-primary rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? "Adicionando..." : "Adicionar Campo"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum campo personalizado configurado</p>
              <p className="text-sm mt-2">Adicione campos para coletar informações específicas dos pacientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div>
                      <p className="font-medium">{field.field_label}</p>
                      <p className="text-sm text-muted-foreground">
                        Tipo: {field.field_type} 
                        {field.is_required && <span className="text-destructive ml-2">*Obrigatório</span>}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteField(field.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pre-configured Fields Info */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-serif">Campos Padrão do Sistema</CardTitle>
          <CardDescription>
            Estes campos estão sempre disponíveis para todos os pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "Nome", "Email", "Telefone", "Sexo", 
              "Data de Nascimento", "Altura", "Observações Médicas"
            ].map((field) => (
              <div 
                key={field}
                className="p-3 bg-primary/5 rounded-xl text-sm font-medium text-primary"
              >
                {field}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFieldsConfig;