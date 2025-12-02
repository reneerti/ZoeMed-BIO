import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AddMeasurement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_person: "",
    measurement_date: new Date().toISOString().split("T")[0],
    week_number: "",
    monjaro_dose: "",
    status: "",
    weight: "",
    bmi: "",
    body_fat_percent: "",
    fat_mass: "",
    lean_mass: "",
    muscle_mass: "",
    muscle_rate_percent: "",
    skeletal_muscle_percent: "",
    bone_mass: "",
    protein_mass: "",
    protein_percent: "",
    body_water_percent: "",
    moisture_content: "",
    subcutaneous_fat_percent: "",
    visceral_fat: "",
    bmr: "",
    metabolic_age: "",
    whr: "",
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_person) {
      toast.error("Selecione um usuário");
      return;
    }

    setLoading(true);

    try {
      const dataToInsert = {
        user_person: formData.user_person as "reneer" | "ana_paula",
        measurement_date: formData.measurement_date,
        week_number: formData.week_number ? parseInt(formData.week_number) : null,
        monjaro_dose: formData.monjaro_dose ? parseFloat(formData.monjaro_dose) : null,
        status: formData.status || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
        body_fat_percent: formData.body_fat_percent ? parseFloat(formData.body_fat_percent) : null,
        fat_mass: formData.fat_mass ? parseFloat(formData.fat_mass) : null,
        lean_mass: formData.lean_mass ? parseFloat(formData.lean_mass) : null,
        muscle_mass: formData.muscle_mass ? parseFloat(formData.muscle_mass) : null,
        muscle_rate_percent: formData.muscle_rate_percent ? parseFloat(formData.muscle_rate_percent) : null,
        skeletal_muscle_percent: formData.skeletal_muscle_percent ? parseFloat(formData.skeletal_muscle_percent) : null,
        bone_mass: formData.bone_mass ? parseFloat(formData.bone_mass) : null,
        protein_mass: formData.protein_mass ? parseFloat(formData.protein_mass) : null,
        protein_percent: formData.protein_percent ? parseFloat(formData.protein_percent) : null,
        body_water_percent: formData.body_water_percent ? parseFloat(formData.body_water_percent) : null,
        moisture_content: formData.moisture_content ? parseFloat(formData.moisture_content) : null,
        subcutaneous_fat_percent: formData.subcutaneous_fat_percent ? parseFloat(formData.subcutaneous_fat_percent) : null,
        visceral_fat: formData.visceral_fat ? parseFloat(formData.visceral_fat) : null,
        bmr: formData.bmr ? parseInt(formData.bmr) : null,
        metabolic_age: formData.metabolic_age ? parseInt(formData.metabolic_age) : null,
        whr: formData.whr ? parseFloat(formData.whr) : null,
      };

      const { error } = await supabase.from("bioimpedance").insert(dataToInsert);

      if (error) throw error;

      toast.success("Medição adicionada com sucesso!");
      navigate("/selecionar");
    } catch (error) {
      console.error("Error adding measurement:", error);
      toast.error("Erro ao adicionar medição");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "week_number", label: "Semana", type: "number" },
    { name: "monjaro_dose", label: "Monjaro (mg)", type: "number", step: "0.5" },
    { name: "status", label: "Status", type: "text" },
    { name: "weight", label: "Peso (kg)", type: "number", step: "0.1" },
    { name: "bmi", label: "IMC", type: "number", step: "0.1" },
    { name: "body_fat_percent", label: "Gordura Corporal (%)", type: "number", step: "0.1" },
    { name: "fat_mass", label: "Massa Gorda (kg)", type: "number", step: "0.1" },
    { name: "lean_mass", label: "Massa Livre de Gordura (kg)", type: "number", step: "0.1" },
    { name: "muscle_mass", label: "Massa Muscular (kg)", type: "number", step: "0.1" },
    { name: "muscle_rate_percent", label: "Taxa Muscular (%)", type: "number", step: "0.1" },
    { name: "skeletal_muscle_percent", label: "Musc. Esquelética (%)", type: "number", step: "0.1" },
    { name: "bone_mass", label: "Massa Óssea (kg)", type: "number", step: "0.1" },
    { name: "protein_mass", label: "Massa Protéica (kg)", type: "number", step: "0.1" },
    { name: "protein_percent", label: "Proteína (%)", type: "number", step: "0.1" },
    { name: "body_water_percent", label: "Água Corporal (%)", type: "number", step: "0.1" },
    { name: "moisture_content", label: "Teor de Umidade (kg)", type: "number", step: "0.1" },
    { name: "subcutaneous_fat_percent", label: "Gordura Subcutânea (%)", type: "number", step: "0.1" },
    { name: "visceral_fat", label: "Gordura Visceral", type: "number", step: "0.1" },
    { name: "bmr", label: "TMB (kcal)", type: "number" },
    { name: "metabolic_age", label: "Idade Metabólica", type: "number" },
    { name: "whr", label: "WHR (Cintura/Quadril)", type: "number", step: "0.01" },
  ];

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate("/selecionar")}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card className="card-elevated border-0">
          <div className="h-1 gradient-primary" />
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Adicionar Medição de Bioimpedância</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usuário *</Label>
                  <Select value={formData.user_person} onValueChange={(v) => handleChange("user_person", v)}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reneer">Reneer</SelectItem>
                      <SelectItem value="ana_paula">Ana Paula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data da Medição *</Label>
                  <Input
                    type="date"
                    value={formData.measurement_date}
                    onChange={(e) => handleChange("measurement_date", e.target.value)}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label className="text-sm">{field.label}</Label>
                    <Input
                      type={field.type}
                      step={field.step}
                      value={formData[field.name as keyof typeof formData]}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="h-10 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 transition-opacity text-lg font-medium"
                disabled={loading}
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? "Salvando..." : "Salvar Medição"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMeasurement;
