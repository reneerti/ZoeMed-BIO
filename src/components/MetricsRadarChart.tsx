import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { referenceValues, evaluateMetric, getStatusLabel } from "@/lib/referenceValues";

interface MetricsRadarChartProps {
  currentMetrics: {
    weight?: number | null;
    bmi?: number | null;
    body_fat_percent?: number | null;
    muscle_rate_percent?: number | null;
    visceral_fat?: number | null;
    body_water_percent?: number | null;
    protein_percent?: number | null;
    bone_mass?: number | null;
    bmr?: number | null;
  };
  isMale: boolean;
}

const MetricsRadarChart = ({ currentMetrics, isMale }: MetricsRadarChartProps) => {
  // Normalize values to 0-100 scale for radar chart visualization
  const normalizeValue = (value: number | null | undefined, idealMin: number, idealMax: number, riskMax: number): number => {
    if (value === null || value === undefined) return 0;
    
    // Calculate ideal midpoint
    const idealMid = (idealMin + idealMax) / 2;
    
    // If at ideal midpoint, return 100
    if (value >= idealMin && value <= idealMax) {
      return 100;
    }
    
    // If below ideal, scale from 0 to 100
    if (value < idealMin) {
      const ratio = value / idealMin;
      return Math.max(0, ratio * 100);
    }
    
    // If above ideal, scale down from 100
    const ratio = (riskMax - value) / (riskMax - idealMax);
    return Math.max(0, Math.min(100, ratio * 100));
  };

  // Get reference ranges based on gender
  const bodyFatRef = isMale ? referenceValues.bodyFatPercent.male : referenceValues.bodyFatPercent.female;
  const muscleRef = isMale ? referenceValues.musclePercent.male : referenceValues.musclePercent.female;
  const boneRef = isMale ? referenceValues.boneMass.male : referenceValues.boneMass.female;

  const radarData = [
    {
      metric: "IMC",
      atual: normalizeValue(currentMetrics.bmi, referenceValues.bmi.ideal.min, referenceValues.bmi.ideal.max, 35),
      ideal: 100,
      valorReal: currentMetrics.bmi?.toFixed(1) || "N/A",
      faixaIdeal: `${referenceValues.bmi.ideal.min}-${referenceValues.bmi.ideal.max}`,
    },
    {
      metric: "Gordura %",
      atual: normalizeValue(currentMetrics.body_fat_percent, bodyFatRef.ideal.min, bodyFatRef.ideal.max, 40),
      ideal: 100,
      valorReal: currentMetrics.body_fat_percent?.toFixed(1) + "%" || "N/A",
      faixaIdeal: `${bodyFatRef.ideal.min}-${bodyFatRef.ideal.max}%`,
    },
    {
      metric: "Músculo %",
      atual: normalizeValue(currentMetrics.muscle_rate_percent, muscleRef.ideal.min, muscleRef.ideal.max, 50),
      ideal: 100,
      valorReal: currentMetrics.muscle_rate_percent?.toFixed(1) + "%" || "N/A",
      faixaIdeal: `${muscleRef.ideal.min}-${muscleRef.ideal.max}%`,
    },
    {
      metric: "G. Visceral",
      atual: normalizeValue(currentMetrics.visceral_fat, 1, referenceValues.visceralFat.ideal.max, 20),
      ideal: 100,
      valorReal: currentMetrics.visceral_fat?.toFixed(0) || "N/A",
      faixaIdeal: `<${referenceValues.visceralFat.ideal.max}`,
    },
    {
      metric: "Água %",
      atual: normalizeValue(currentMetrics.body_water_percent, referenceValues.bodyWaterPercent.ideal.min, referenceValues.bodyWaterPercent.ideal.max, 75),
      ideal: 100,
      valorReal: currentMetrics.body_water_percent?.toFixed(1) + "%" || "N/A",
      faixaIdeal: `${referenceValues.bodyWaterPercent.ideal.min}-${referenceValues.bodyWaterPercent.ideal.max}%`,
    },
    {
      metric: "Proteína %",
      atual: normalizeValue(currentMetrics.protein_percent, referenceValues.proteinPercent.ideal.min, referenceValues.proteinPercent.ideal.max, 25),
      ideal: 100,
      valorReal: currentMetrics.protein_percent?.toFixed(1) + "%" || "N/A",
      faixaIdeal: `${referenceValues.proteinPercent.ideal.min}-${referenceValues.proteinPercent.ideal.max}%`,
    },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.metric}</p>
          <p className="text-sm text-muted-foreground">
            Atual: <span className="text-foreground font-medium">{data.valorReal}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Ideal: <span className="text-emerald-500 font-medium">{data.faixaIdeal}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Score: <span className="font-medium">{data.atual.toFixed(0)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate overall health score
  const overallScore = Math.round(
    radarData.reduce((acc, item) => acc + item.atual, 0) / radarData.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Saudável";
    if (score >= 60) return "Atenção";
    return "Risco";
  };

  return (
    <Card className="card-elevated border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif">Radar de Métricas vs Referência</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Score Geral</p>
            <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </p>
            <p className={`text-xs ${getScoreColor(overallScore)}`}>
              {getScoreLabel(overallScore)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <Radar
                name="Ideal"
                dataKey="ideal"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.1}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Radar
                name="Atual"
                dataKey="atual"
                stroke={isMale ? "#3b82f6" : "#f43f5e"}
                fill={isMale ? "#3b82f6" : "#f43f5e"}
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend with actual values */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-xs">
          {radarData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50"
            >
              <span className="text-muted-foreground">{item.metric}</span>
              <div className="text-right">
                <span className="font-medium text-foreground">{item.valorReal}</span>
                <span className="text-muted-foreground ml-1">/ {item.faixaIdeal}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsRadarChart;
