import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "@/assets/logo.png";

interface Patient {
  id: string;
  name: string;
  status: string;
  latestWeight?: number;
  latestBmi?: number;
  weightChange?: number;
}

interface PdfReportGeneratorProps {
  patients: Patient[];
}

const PdfReportGenerator = ({ patients }: PdfReportGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({
    includeHeader: true,
    includeEvolution: true,
    includeRanking: true,
    includeIndividual: true,
    includeSummary: true
  });

  const generatePdf = async () => {
    setGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Helper function to add new page if needed
      const checkNewPage = (requiredHeight: number) => {
        if (yPos + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Header with Logo
      if (options.includeHeader) {
        // Add logo
        try {
          const img = new Image();
          img.src = logo;
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          pdf.addImage(img, 'PNG', margin, yPos, 50, 20);
        } catch (e) {
          console.log("Could not load logo");
        }
        
        // Title
        pdf.setFontSize(20);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 91, 138); // #1E5B8A
        pdf.text("ZOEMEDBio", pageWidth - margin - 60, yPos + 8);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("Bioimpedância Inteligente", pageWidth - margin - 60, yPos + 14);
        
        yPos += 30;
        
        // Report title
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text("Relatório de Evolução de Pacientes", margin, yPos);
        yPos += 8;
        
        // Date
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, margin, yPos);
        yPos += 15;
        
        // Separator line
        pdf.setDrawColor(30, 91, 138);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
      }

      // Summary
      if (options.includeSummary) {
        checkNewPage(40);
        
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 91, 138);
        pdf.text("📊 Resumo Geral", margin, yPos);
        yPos += 10;
        
        const activePatients = patients.filter(p => p.status === "active").length;
        const inactivePatients = patients.filter(p => p.status !== "active").length;
        const patientsLosing = patients.filter(p => (p.weightChange || 0) < 0).length;
        const avgLoss = patients.filter(p => (p.weightChange || 0) < 0)
          .reduce((sum, p) => sum + Math.abs(p.weightChange || 0), 0) / (patientsLosing || 1);
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        
        const summaryData = [
          `Total de Pacientes: ${patients.length}`,
          `Pacientes Ativos: ${activePatients}`,
          `Pacientes Inativos: ${inactivePatients}`,
          `Pacientes Perdendo Peso: ${patientsLosing}`,
          `Média de Perda de Peso: ${avgLoss.toFixed(1)} kg`
        ];
        
        summaryData.forEach(text => {
          pdf.text(`• ${text}`, margin + 5, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Ranking
      if (options.includeRanking) {
        checkNewPage(60);
        
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 91, 138);
        pdf.text("🏆 Ranking de Evolução", margin, yPos);
        yPos += 10;
        
        const sortedPatients = [...patients]
          .filter(p => p.weightChange !== undefined)
          .sort((a, b) => (a.weightChange || 0) - (b.weightChange || 0))
          .slice(0, 10);
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        
        sortedPatients.forEach((patient, index) => {
          checkNewPage(8);
          
          const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
          const changeText = patient.weightChange 
            ? `${patient.weightChange > 0 ? '+' : ''}${patient.weightChange.toFixed(1)} kg`
            : "N/A";
          
          pdf.setTextColor(0, 0, 0);
          pdf.text(`${medal} ${patient.name}`, margin + 5, yPos);
          
          pdf.setTextColor(patient.weightChange && patient.weightChange < 0 ? 0 : 200, 
                          patient.weightChange && patient.weightChange < 0 ? 150 : 0, 0);
          pdf.text(changeText, pageWidth - margin - 30, yPos);
          yPos += 7;
        });
        yPos += 10;
      }

      // Individual patient details
      if (options.includeIndividual) {
        checkNewPage(20);
        
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 91, 138);
        pdf.text("👤 Evolução Individual dos Pacientes", margin, yPos);
        yPos += 10;
        
        patients.forEach((patient, index) => {
          checkNewPage(25);
          
          // Patient card
          pdf.setFillColor(245, 245, 245);
          pdf.roundedRect(margin, yPos - 2, pageWidth - 2 * margin, 18, 2, 2, 'F');
          
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text(patient.name, margin + 5, yPos + 5);
          
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          
          const statusText = patient.status === "active" ? "✅ Ativo" : "⏸️ Inativo";
          pdf.text(statusText, margin + 5, yPos + 12);
          
          if (patient.latestWeight) {
            pdf.text(`Peso atual: ${patient.latestWeight.toFixed(1)} kg`, margin + 50, yPos + 5);
          }
          if (patient.latestBmi) {
            pdf.text(`IMC: ${patient.latestBmi.toFixed(1)}`, margin + 50, yPos + 12);
          }
          
          if (patient.weightChange !== undefined) {
            const changeColor = patient.weightChange < 0 ? [16, 185, 129] : [239, 68, 68];
            pdf.setTextColor(changeColor[0], changeColor[1], changeColor[2]);
            pdf.setFont("helvetica", "bold");
            pdf.text(
              `${patient.weightChange > 0 ? '+' : ''}${patient.weightChange.toFixed(1)} kg`,
              pageWidth - margin - 30,
              yPos + 8
            );
          }
          
          yPos += 22;
        });
      }

      // Footer
      const addFooter = () => {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          "ZOEMEDBio - Bioimpedância Inteligente | www.zoemedbio.com",
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      };
      
      // Add footer to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter();
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      }

      // Save
      pdf.save(`ZOEMEDBio_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
      setOpen(false);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary">
          <FileText className="w-4 h-4" />
          Gerar Relatório PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Gerar Relatório PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Selecione as seções que deseja incluir no relatório:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="header" 
                checked={options.includeHeader}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeHeader: !!checked }))}
              />
              <Label htmlFor="header" className="cursor-pointer">Cabeçalho com Logo</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="summary" 
                checked={options.includeSummary}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSummary: !!checked }))}
              />
              <Label htmlFor="summary" className="cursor-pointer">Resumo Geral</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="ranking" 
                checked={options.includeRanking}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeRanking: !!checked }))}
              />
              <Label htmlFor="ranking" className="cursor-pointer">Ranking (Top Evolução)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="individual" 
                checked={options.includeIndividual}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeIndividual: !!checked }))}
              />
              <Label htmlFor="individual" className="cursor-pointer">Evolução Individual</Label>
            </div>
          </div>
          
          <Button 
            onClick={generatePdf} 
            disabled={generating}
            className="w-full gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Baixar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfReportGenerator;
