import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload as UploadIcon, FileImage, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [insights, setInsights] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setExtractedData(null);
      setInsights(null);
    }
  };

  const processImage = async () => {
    if (!file || !selectedUser) {
      toast.error("Selecione um arquivo e um usuário");
      return;
    }

    setProcessing(true);

    try {
      // Upload image to storage
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("bioimpedance-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("bioimpedance-images")
        .getPublicUrl(fileName);

      // Call OCR edge function
      const { data: ocrResult, error: ocrError } = await supabase.functions.invoke("process-bioimpedance", {
        body: {
          imageUrl: urlData.publicUrl,
          userPerson: selectedUser,
        },
      });

      if (ocrError) throw ocrError;

      if (ocrResult?.data) {
        setExtractedData(ocrResult.data);
        setInsights(ocrResult.insights);
        toast.success("Dados extraídos com sucesso!");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Erro ao processar imagem");
    } finally {
      setProcessing(false);
    }
  };

  const saveData = async () => {
    if (!extractedData || !selectedUser) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("bioimpedance").insert({
        user_person: selectedUser as "reneer" | "ana_paula",
        ...extractedData,
      });

      if (error) throw error;

      toast.success("Dados salvos com sucesso!");
      navigate("/selecionar");
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Erro ao salvar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <Card className="card-elevated border-0 overflow-hidden">
          <div className="h-1 gradient-primary" />
          <CardHeader>
            <CardTitle className="text-2xl font-serif flex items-center gap-2">
              <UploadIcon className="w-6 h-6" />
              Upload de Bioimpedância
            </CardTitle>
            <CardDescription>
              Faça upload de uma foto da bioimpedância para extrair os dados automaticamente via OCR e IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Selecione o usuário..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reneer">Reneer</SelectItem>
                  <SelectItem value="ana_paula">Ana Paula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Imagem da Bioimpedância</Label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                  ${preview ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {preview ? (
                  <div className="space-y-4">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                    <p className="text-sm text-muted-foreground">{file?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileImage className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Clique ou arraste uma imagem aqui
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suporta JPG, PNG, HEIC
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!extractedData && (
              <Button
                onClick={processImage}
                disabled={!file || !selectedUser || processing}
                className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 transition-opacity"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Extrair Dados com OCR
                  </>
                )}
              </Button>
            )}

            {extractedData && (
              <div className="space-y-4 animate-slide-up">
                <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                  <div className="flex items-center gap-2 text-success font-medium mb-2">
                    <CheckCircle className="w-5 h-5" />
                    Dados Extraídos
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(extractedData).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {insights && (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <div className="flex items-center gap-2 text-warning font-medium mb-2">
                      <Sparkles className="w-5 h-5" />
                      Insights da IA
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{insights}</p>
                  </div>
                )}

                <Button
                  onClick={saveData}
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-success hover:opacity-90 transition-opacity text-success-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Salvar no Banco de Dados
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
