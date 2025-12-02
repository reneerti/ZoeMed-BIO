import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beef } from "lucide-react";

interface ProteinCalculatorProps {
  weight: number;
  person: "reneer" | "ana_paula";
}

const ProteinCalculator = ({ weight, person }: ProteinCalculatorProps) => {
  const isReneer = person === "reneer";
  
  // Reneer: Homem, treino leve (2-3x/semana) + Mounjaro = 1.5 a 2.0 g/kg/dia
  // Ana Paula: Mulher, sem treino + Mounjaro = 1.2 a 1.5 g/kg/dia
  const minMultiplier = isReneer ? 1.5 : 1.2;
  const maxMultiplier = isReneer ? 2.0 : 1.5;
  
  const minProtein = Math.round(weight * minMultiplier);
  const maxProtein = Math.round(weight * maxMultiplier);
  const recommendedProtein = Math.round(weight * ((minMultiplier + maxMultiplier) / 2));
  
  const bgClass = isReneer ? 'bg-reneer-primary/10' : 'bg-ana-paula-primary/10';
  const borderClass = isReneer ? 'border-reneer-primary/30' : 'border-ana-paula-primary/30';
  const textClass = isReneer ? 'text-reneer-primary' : 'text-ana-paula-primary';
  
  const profile = isReneer 
    ? "Homem • Treino leve (2-3x/sem) • Mounjaro"
    : "Mulher • Sem treino • Mounjaro";
  
  const recommendation = isReneer
    ? "1,5 a 2,0 g/kg/dia para preservar massa muscular"
    : "1,2 a 1,5 g/kg/dia para evitar perda de massa magra";

  return (
    <div className={`p-3 rounded-xl ${bgClass} border ${borderClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <Beef className={`w-4 h-4 ${textClass}`} />
        <span className="text-sm font-medium">Proteína Diária</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`text-2xl font-bold ${textClass}`}>{minProtein}g</span>
        <span className="text-muted-foreground">a</span>
        <span className={`text-2xl font-bold ${textClass}`}>{maxProtein}g</span>
        <span className="text-sm text-muted-foreground">/dia</span>
      </div>
      <p className="text-xs text-muted-foreground">{profile}</p>
      <p className="text-xs text-muted-foreground mt-1 italic">{recommendation}</p>
    </div>
  );
};

export default ProteinCalculator;
