import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Upload, Camera, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import splashLogo from "@/assets/zoemedbio-splash-logo.png";

interface Patient {
  id: string;
  name: string;
  gender: string | null;
}

const AddPatientMeasurement = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
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
    if (!authLoading && !user) {
      navigate("/");
      return;
    }
    if (patientId && user) {
      loadPatient();
    }
  }, [patientId, user, authLoading, navigate]);

  const loadPatient = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, gender")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error("Error loading patient:", error);
      toast.error("Erro ao carregar paciente");
      navigate("/master");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const processWithOCR = async () => {
    if (!selectedFile) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }

    setProcessing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      const base64Data = await base64Promise;

      // Call edge function for OCR
      const { data, error } = await supabase.functions.invoke("process-bioimpedance", {
        body: { image: base64Data }
      });

      if (error) throw error;

      if (data?.extractedData) {
        // Populate form with extracted data
        const extracted = data.extractedData;
        setFormData(prev => ({
          ...prev,
          weight: extracted.weight?.toString() || prev.weight,
          bmi: extracted.bmi?.toString() || prev.bmi,
          body_fat_percent: extracted.body_fat_percent?.toString() || prev.body_fat_percent,
          fat_mass: extracted.fat_mass?.toString() || prev.fat_mass,
          lean_mass: extracted.lean_mass?.toString() || prev.lean_mass,
          muscle_mass: extracted.muscle_mass?.toString() || prev.muscle_mass,
          muscle_rate_percent: extracted.muscle_rate_percent?.toString() || prev.muscle_rate_percent,
          skeletal_muscle_percent: extracted.skeletal_muscle_percent?.toString() || prev.skeletal_muscle_percent,
          bone_mass: extracted.bone_mass?.toString() || prev.bone_mass,
          protein_mass: extracted.protein_mass?.toString() || prev.protein_mass,
          protein_percent: extracted.protein_percent?.toString() || prev.protein_percent,
          body_water_percent: extracted.body_water_percent?.toString() || prev.body_water_percent,
          moisture_content: extracted.moisture_content?.toString() || prev.moisture_content,
          subcutaneous_fat_percent: extracted.subcutaneous_fat_percent?.toString() || prev.subcutaneous_fat_percent,
          visceral_fat: extracted.visceral_fat?.toString() || prev.visceral_fat,
          bmr: extracted.bmr?.toString() || prev.bmr,
          metabolic_age: extracted.metabolic_age?.toString() || prev.metabolic_age,
          whr: extracted.whr?.toString() || prev.whr,
        }));
        toast.success("Dados extraídos com sucesso! Revise e salve.");
      } else {
        toast.warning("Não foi possível extrair dados da imagem. Preencha manualmente.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Erro ao processar imagem. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast.error("Paciente não identificado");
      return;
    }

    setSubmitting(true);

    try {
      // Get bioimpedance count for week number
      const { count } = await supabase
        .from("bioimpedance")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patientId);

      const weekNumber = formData.week_number ? parseInt(formData.week_number) : (count || 0) + 1;

      const dataToInsert = {
        patient_id: patientId,
        user_person: "reneer" as const, // Default value for enum
        measurement_date: formData.measurement_date,
        week_number: weekNumber,
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
      navigate(`/paciente/${patientId}`);
    } catch (error) {
      console.error("Error adding measurement:", error);
      toast.error("Erro ao adicionar medição");
    } finally {
      setSubmitting(false);
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

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="gap-2" onClick={() => navigate(`/paciente/${patientId}`)}>
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <img src={splashLogo} alt="ZOEMEDBio" className="h-10" />
        </div>

        <Card className="card-elevated border-0">
          <div className="h-1 gradient-primary" />
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Adicionar Medição - {patient?.name || "Carregando..."}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="upload" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload OCR
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <div className="border-2 border-dashed rounded-xl p-8 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg object-contain"
                      />
                      <div className="flex gap-2 justify-center">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Remover
                        </Button>
                        <Button 
                          onClick={processWithOCR}
                          disabled={processing}
                          className="gap-2"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4" />
                              Extrair Dados
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer space-y-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-16 h-16 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Arraste uma imagem ou clique para selecionar</p>
                        <p className="text-sm text-muted-foreground">
                          Suporta JPG, PNG até 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Form fields below upload */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label>Semana</Label>
                      <Input
                        type="number"
                        value={formData.week_number}
                        onChange={(e) => handleChange("week_number", e.target.value)}
                        className="h-12 rounded-xl"
                        placeholder="Auto"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {fields.slice(2).map((field) => (
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
                    disabled={submitting}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {submitting ? "Salvando..." : "Salvar Medição"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="manual">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label>Semana</Label>
                      <Input
                        type="number"
                        value={formData.week_number}
                        onChange={(e) => handleChange("week_number", e.target.value)}
                        className="h-12 rounded-xl"
                        placeholder="Auto"
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
                    disabled={submitting}
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {submitting ? "Salvando..." : "Salvar Medição"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPatientMeasurement;