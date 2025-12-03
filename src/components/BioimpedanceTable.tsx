import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BioimpedanceRecord {
  id: string;
  measurement_date: string;
  week_number: number | null;
  monjaro_dose: number | null;
  status: string | null;
  weight: number | null;
  bmi: number | null;
  body_fat_percent: number | null;
  fat_mass: number | null;
  lean_mass: number | null;
  muscle_mass: number | null;
  muscle_rate_percent: number | null;
  skeletal_muscle_percent: number | null;
  bone_mass: number | null;
  protein_mass: number | null;
  protein_percent: number | null;
  body_water_percent: number | null;
  moisture_content: number | null;
  subcutaneous_fat_percent: number | null;
  visceral_fat: number | null;
  bmr: number | null;
  metabolic_age: number | null;
  whr: number | null;
}

interface Props {
  records: BioimpedanceRecord[];
  isReneer: boolean;
}

// Parâmetros de referência baseados no protocolo
const getParams = (isReneer: boolean) => ({
  weight: { ideal: isReneer ? 80 : 55, unit: "kg", lowerIsBetter: false, tooltip: isReneer ? "Peso ideal para homem com perfil atlético moderado" : "Peso ideal para mulher com perfil saudável" },
  bmi: { ideal: 24.9, unit: "", lowerIsBetter: true, tooltip: "IMC ideal: 18.5-24.9 (eutrófico)" },
  body_fat_percent: { ideal: isReneer ? 20 : 25, unit: "%", lowerIsBetter: true, tooltip: isReneer ? "Gordura corporal ideal para homem: 15-20%" : "Gordura corporal ideal para mulher: 20-25%" },
  fat_mass: { ideal: null, unit: "kg", lowerIsBetter: true, tooltip: "Massa de gordura total - varia conforme peso" },
  lean_mass: { ideal: null, unit: "kg", lowerIsBetter: false, tooltip: "Massa livre de gordura - preservar é essencial" },
  muscle_mass: { ideal: isReneer ? 30 : 25, unit: "kg", lowerIsBetter: false, tooltip: isReneer ? "Meta de massa muscular para homem com treino" : "Meta de massa muscular para mulher" },
  muscle_rate_percent: { ideal: isReneer ? 40 : 35, unit: "%", lowerIsBetter: false, tooltip: "Percentual ideal de músculo no corpo" },
  bone_mass: { ideal: isReneer ? 3.5 : 2.8, unit: "kg", lowerIsBetter: false, tooltip: "Massa óssea saudável para densidade adequada" },
  protein_percent: { ideal: 18, unit: "%", lowerIsBetter: false, tooltip: "Proteína corporal ideal: 16-20%" },
  body_water_percent: { ideal: 60, unit: "%", lowerIsBetter: false, tooltip: "Hidratação ideal: 55-65% de água corporal" },
  subcutaneous_fat_percent: { ideal: 20, unit: "%", lowerIsBetter: true, tooltip: "Gordura subcutânea - sob a pele" },
  visceral_fat: { ideal: 10, unit: "", lowerIsBetter: true, tooltip: "Gordura visceral ideal: 1-12 (saudável)" },
  bmr: { ideal: 1500, unit: "kcal", lowerIsBetter: false, tooltip: "Taxa metabólica basal - calorias em repouso" },
  metabolic_age: { ideal: isReneer ? 41 : 43, unit: "anos", lowerIsBetter: true, tooltip: "Idade metabólica ideal igual ou menor que idade real" },
  whr: { ideal: isReneer ? 0.90 : 0.80, unit: "", lowerIsBetter: true, tooltip: isReneer ? "Relação cintura-quadril ideal homem: <0.90" : "Relação cintura-quadril ideal mulher: <0.80" },
});

type ColumnKey = keyof ReturnType<typeof getParams>;

const columns: { key: ColumnKey; label: string; format: (v: number | null) => string }[] = [
  { key: "weight", label: "Peso", format: (v) => v?.toFixed(1) || "-" },
  { key: "bmi", label: "IMC", format: (v) => v?.toFixed(1) || "-" },
  { key: "body_fat_percent", label: "Gordura %", format: (v) => v ? `${v.toFixed(1)}%` : "-" },
  { key: "fat_mass", label: "M. Gorda", format: (v) => v?.toFixed(1) || "-" },
  { key: "lean_mass", label: "M. Livre", format: (v) => v?.toFixed(1) || "-" },
  { key: "muscle_mass", label: "M. Musc", format: (v) => v?.toFixed(1) || "-" },
  { key: "muscle_rate_percent", label: "Taxa Musc %", format: (v) => v ? `${v.toFixed(1)}%` : "-" },
  { key: "bone_mass", label: "M. Óssea", format: (v) => v?.toFixed(1) || "-" },
  { key: "protein_percent", label: "Proteína %", format: (v) => v ? `${v.toFixed(1)}%` : "-" },
  { key: "body_water_percent", label: "Água %", format: (v) => v ? `${v.toFixed(1)}%` : "-" },
  { key: "subcutaneous_fat_percent", label: "G. Subcut %", format: (v) => v ? `${v.toFixed(1)}%` : "-" },
  { key: "visceral_fat", label: "G. Visceral", format: (v) => v?.toFixed(0) || "-" },
  { key: "bmr", label: "TMB", format: (v) => v?.toFixed(0) || "-" },
  { key: "metabolic_age", label: "Id. Met.", format: (v) => v?.toFixed(0) || "-" },
  { key: "whr", label: "WHR", format: (v) => v?.toFixed(2) || "-" },
];

const BioimpedanceTable = ({ records, isReneer }: Props) => {
  const [expandedCols, setExpandedCols] = useState<Set<ColumnKey>>(new Set());
  const params = getParams(isReneer);

  const toggleColumn = (key: ColumnKey) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getTextColor = (current: number | null, previous: number | null, lowerIsBetter: boolean) => {
    if (current === null || previous === null) return "text-slate-300";
    const diff = current - previous;
    const threshold = Math.abs(previous * 0.005);
    
    if (Math.abs(diff) <= threshold) return "text-amber-400 font-semibold";
    if (lowerIsBetter) {
      return diff < 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"; 
    }
    return diff > 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold";
  };

  const getDiffToIdeal = (value: number | null, ideal: number | null, lowerIsBetter: boolean) => {
    if (value === null || ideal === null) return { diff: null, color: "text-slate-400" };
    const diff = value - ideal;
    const isGood = lowerIsBetter ? diff <= 0 : diff >= 0;
    return {
      diff: diff,
      color: isGood ? "text-emerald-400" : "text-red-400",
      label: diff > 0 ? `+${Math.abs(diff).toFixed(1)}` : `-${Math.abs(diff).toFixed(1)}`,
    };
  };

  return (
    <TooltipProvider>
      <div className="relative overflow-hidden rounded-lg border border-slate-500 bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900">
                <TableHead className="text-cyan-300 font-bold w-20 text-center sticky left-0 z-20 bg-slate-900 border-r-2 border-violet-400">Semana</TableHead>
                <TableHead className="text-cyan-300 font-bold w-24 text-center border-r border-slate-600">Monjaro</TableHead>
                <TableHead className="text-cyan-300 font-bold w-28 text-center border-r border-slate-600">Status</TableHead>
                {columns.map((col) => (
                  <>
                    <TableHead 
                      key={col.key} 
                      className="text-cyan-300 font-bold text-center min-w-[85px] cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-600"
                      onClick={() => toggleColumn(col.key)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{col.label}</span>
                        {expandedCols.has(col.key) ? (
                          <Minus className="w-3 h-3 text-rose-400" />
                        ) : (
                          <Plus className="w-3 h-3 text-lime-400" />
                        )}
                      </div>
                    </TableHead>
                    {expandedCols.has(col.key) && (
                      <TableHead 
                        key={`${col.key}-diff`} 
                        className="text-slate-700 font-bold text-center min-w-[75px] bg-amber-100 border-r border-amber-300"
                      >
                        Δ Meta
                      </TableHead>
                    )}
                  </>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Linha 0: Parâmetros de referência */}
              <TableRow className="bg-violet-900 hover:bg-violet-900 border-b-2 border-violet-400">
                <TableCell className="font-bold text-center text-yellow-200 sticky left-0 z-20 bg-violet-900 border-r-2 border-violet-400">IDEAL</TableCell>
                <TableCell className="text-center text-violet-200 border-r border-slate-500">-</TableCell>
                <TableCell className="text-center text-violet-200 border-r border-slate-500">Meta</TableCell>
                {columns.map((col) => {
                  const param = params[col.key];
                  return (
                    <>
                      <TableCell 
                        key={col.key} 
                        className="text-center text-yellow-200 font-semibold border-r border-slate-500"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted decoration-yellow-400">
                              {param.ideal !== null ? `${param.ideal}${param.unit ? ` ${param.unit}` : ''}` : '-'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-white border-violet-500 max-w-xs">
                            <p className="text-sm">{param.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    {expandedCols.has(col.key) && (
                      <TableCell 
                        key={`${col.key}-diff`} 
                        className="text-center text-slate-500 bg-amber-50 border-r border-amber-200"
                      >
                        -
                      </TableCell>
                    )}
                    </>
                  );
                })}
              </TableRow>
              
              {/* Dados */}
              {records.map((record, i) => {
                const isHiato = record.status?.includes("HIATO");
                const prev = i > 0 ? records[i - 1] : null;
                const rowBg = isHiato ? 'bg-amber-900/50' : i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750';
                
                return (
                  <TableRow 
                    key={record.id} 
                    className={`${rowBg} hover:bg-slate-600`}
                  >
                    <TableCell className={`font-bold text-center text-white sticky left-0 z-20 ${rowBg} border-r-2 border-violet-400`}>
                      {record.week_number} {isHiato && '⚠️'}
                    </TableCell>
                    <TableCell className="text-center text-slate-200 border-r border-slate-600">{record.monjaro_dose} mg</TableCell>
                    <TableCell className="text-center text-slate-200 border-r border-slate-600 text-xs">{record.status}</TableCell>
                    {columns.map((col) => {
                      const value = Number((record as any)[col.key]);
                      const prevValue = prev ? Number((prev as any)[col.key]) : null;
                      const param = params[col.key];
                      const diffInfo = getDiffToIdeal(value, param.ideal, param.lowerIsBetter);
                      
                      return (
                        <>
                          <TableCell 
                            key={col.key} 
                            className={`text-center border-r border-slate-600 ${getTextColor(value, prevValue, param.lowerIsBetter)}`}
                          >
                            {col.format(value)}
                          </TableCell>
                          {expandedCols.has(col.key) && (
                            <TableCell 
                              key={`${col.key}-diff`} 
                              className={`text-center bg-amber-50 text-sm font-extrabold border-r border-amber-200 ${diffInfo.color}`}
                            >
                              {diffInfo.diff !== null ? diffInfo.label : '-'}
                            </TableCell>
                          )}
                        </>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BioimpedanceTable;
