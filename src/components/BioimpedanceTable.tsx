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
  isReneer?: boolean;
  isMale?: boolean;
}

// Alternative simplified props for backward compatibility
interface DataProps {
  data?: BioimpedanceRecord[];
  userPerson?: string;
  isAdmin?: boolean;
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

const BioimpedanceTable = (props: Props | DataProps) => {
  // Handle both prop formats for backward compatibility
  const records = 'records' in props ? props.records : (props as DataProps).data || [];
  const isReneer = 'isReneer' in props ? props.isReneer : 
                   'isMale' in props ? props.isMale :
                   'userPerson' in props ? (props as DataProps).userPerson === 'reneer' : true;
  
  const [expandedCols, setExpandedCols] = useState<Set<ColumnKey>>(new Set());
  const params = getParams(!!isReneer);

  const toggleColumn = (key: ColumnKey) => {
    setExpandedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getTextColor = (current: number | null, previous: number | null, lowerIsBetter: boolean) => {
    if (current === null || previous === null) return "text-slate-400";
    const diff = current - previous;
    const threshold = Math.abs(previous * 0.005);
    
    if (Math.abs(diff) <= threshold) return "text-sky-400 font-semibold";
    if (lowerIsBetter) {
      return diff < 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold"; 
    }
    return diff > 0 ? "text-green-500 font-semibold" : "text-red-500 font-semibold";
  };

  const getDiffToIdeal = (value: number | null, ideal: number | null, lowerIsBetter: boolean) => {
    if (value === null || ideal === null) return { diff: null, color: "text-slate-400", bg: "bg-slate-50" };
    const diff = value - ideal;
    const isGood = lowerIsBetter ? diff <= 0 : diff >= 0;
    return {
      diff: diff,
      color: isGood ? "text-green-600" : "text-red-500",
      bg: isGood ? "bg-green-50" : "bg-red-50",
      label: diff > 0 ? `+${Math.abs(diff).toFixed(1)}` : `-${Math.abs(diff).toFixed(1)}`,
    };
  };

  return (
    <TooltipProvider>
      <div className="relative overflow-hidden rounded-lg border border-slate-500 bg-slate-900">
        {/* Mobile hint */}
        <div className="md:hidden px-3 py-2 bg-slate-800 text-xs text-slate-400 border-b border-slate-600 flex items-center gap-2">
          <span>👆</span>
          <span>Deslize para ver mais colunas</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-900 hover:bg-slate-900">
                <TableHead className="text-white font-bold w-14 md:w-20 text-center sticky left-0 z-20 bg-blue-800 border-r-2 border-violet-400 text-xs md:text-sm whitespace-nowrap">Sem.</TableHead>
                <TableHead className="text-cyan-300 font-bold w-16 md:w-24 text-center border-r border-slate-600 text-xs md:text-sm whitespace-nowrap">Monjaro</TableHead>
                <TableHead className="text-cyan-300 font-bold w-20 md:w-28 text-center border-r border-slate-600 text-xs md:text-sm whitespace-nowrap">Status</TableHead>
                {columns.map((col) => (
                  <>
                    <TableHead 
                      key={col.key} 
                      className="text-cyan-300 font-bold text-center min-w-[70px] md:min-w-[85px] cursor-pointer hover:bg-slate-800 transition-colors border-r border-slate-600 text-xs md:text-sm whitespace-nowrap"
                      onClick={() => toggleColumn(col.key)}
                    >
                      <div className="flex items-center justify-center gap-0.5 md:gap-1">
                        <span className="truncate">{col.label}</span>
                        {expandedCols.has(col.key) ? (
                          <Minus className="w-2.5 h-2.5 md:w-3 md:h-3 text-rose-400 flex-shrink-0" />
                        ) : (
                          <Plus className="w-2.5 h-2.5 md:w-3 md:h-3 text-lime-400 flex-shrink-0" />
                        )}
                      </div>
                    </TableHead>
                    {expandedCols.has(col.key) && (
                      <TableHead 
                        key={`${col.key}-diff`} 
                        className="text-slate-600 font-semibold text-center min-w-[60px] md:min-w-[75px] bg-slate-100 border-r border-slate-300 text-xs"
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
                <TableCell className="font-bold text-center text-white sticky left-0 z-20 bg-blue-900 border-r-2 border-violet-400 text-xs md:text-sm">IDEAL</TableCell>
                <TableCell className="text-center text-violet-200 border-r border-slate-500 text-xs md:text-sm">-</TableCell>
                <TableCell className="text-center text-violet-200 border-r border-slate-500 text-xs md:text-sm">Meta</TableCell>
                {columns.map((col) => {
                  const param = params[col.key];
                  return (
                    <>
                      <TableCell 
                        key={col.key} 
                        className="text-center text-white font-semibold border-r border-slate-500 text-xs md:text-sm"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted decoration-violet-300 truncate block">
                              {param.ideal !== null ? `${param.ideal}${param.unit ? ` ${param.unit}` : ''}` : '-'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-800 text-white border-violet-500 max-w-xs z-50">
                            <p className="text-sm">{param.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    {expandedCols.has(col.key) && (
                      <TableCell 
                        key={`${col.key}-diff`} 
                        className="text-center text-slate-400 bg-slate-50 border-r border-slate-200 text-xs"
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
                const rowBg = isHiato ? 'bg-orange-800/40' : i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750';
                
                return (
                  <TableRow 
                    key={record.id} 
                    className={`${rowBg} hover:bg-slate-600`}
                  >
                    <TableCell className="font-bold text-center text-white sticky left-0 z-20 bg-blue-800 border-r-2 border-violet-400 text-xs md:text-sm">
                      {record.week_number} {isHiato && '⚠️'}
                    </TableCell>
                    <TableCell className="text-center text-slate-300 border-r border-slate-600 text-xs md:text-sm whitespace-nowrap">{record.monjaro_dose} mg</TableCell>
                    <TableCell className="text-center text-slate-300 border-r border-slate-600 text-[10px] md:text-xs truncate max-w-[80px] md:max-w-none">{record.status}</TableCell>
                    {columns.map((col) => {
                      const value = Number((record as any)[col.key]);
                      const prevValue = prev ? Number((prev as any)[col.key]) : null;
                      const param = params[col.key];
                      const diffInfo = getDiffToIdeal(value, param.ideal, param.lowerIsBetter);
                      
                      return (
                        <>
                          <TableCell 
                            key={col.key} 
                            className={`text-center border-r border-slate-600 text-xs md:text-sm whitespace-nowrap ${getTextColor(value, prevValue, param.lowerIsBetter)}`}
                          >
                            {col.format(value)}
                          </TableCell>
                          {expandedCols.has(col.key) && (
                            <TableCell 
                              key={`${col.key}-diff`} 
                              className={`text-center ${diffInfo.bg} text-xs font-semibold border-r border-slate-200 ${diffInfo.color}`}
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
