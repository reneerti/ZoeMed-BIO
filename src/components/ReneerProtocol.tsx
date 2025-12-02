import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SupplementationCard from "./SupplementationCard";

interface ReneerProtocolProps {
  isAdmin?: boolean;
}

const ReneerProtocol = ({ isAdmin = false }: ReneerProtocolProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumo do Protocolo */}
      <Card className="card-elevated border-0 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            📋 Resumo do Protocolo - 12 Semanas Monjaro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Acompanhamento completo de bioimpedância durante o protocolo Monjaro. 
            Todas as medições semanais com análise de evolução de peso, composição corporal e indicadores metabólicos.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Peso Inicial</p>
              <p className="font-bold text-blue-600">110,4 kg</p>
              <Badge variant="outline" className="mt-1 text-xs">Semana 1</Badge>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Peso Atual</p>
              <p className="font-bold text-success">103,3 kg</p>
              <Badge variant="outline" className="mt-1 text-xs">Semana 12</Badge>
            </div>
            <div className="text-center p-3 bg-coral/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Perda Total</p>
              <p className="font-bold text-coral">-7,1 kg</p>
              <Badge variant="outline" className="mt-1 text-xs">-6,4%</Badge>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Gordura</p>
              <p className="font-bold text-success">35% → 32,1%</p>
              <Badge variant="outline" className="mt-1 text-xs">-2,9%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Hiatos */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">⚠️ Análise de Hiatos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Durante o protocolo, houve 3 interrupções que impactaram os resultados:
          </p>
          
          <div className="space-y-3">
            {[
              { semana: 6, duracao: "14 dias", impacto: "Gordura subiu 1% (32,8% → 33,8%)", status: "HIATO" },
              { semana: 10, duracao: "14 dias", impacto: "Pequeno ganho de gordura (31,5% → 31,9%)", status: "HIATO" },
              { semana: 12, duracao: "12 dias", impacto: "Leve aumento de gordura (31,9% → 32,1%)", status: "HIATO" },
            ].map((hiato, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/30">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-warning/20">Semana {hiato.semana}</Badge>
                  <span className="text-sm font-medium">{hiato.duracao}</span>
                </div>
                <span className="text-sm text-muted-foreground">{hiato.impacto}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-4 p-3 bg-blue-500/10 rounded-lg">
            💡 <strong>Insight:</strong> Sem os hiatos, a perda de peso e gordura seria significativamente maior. 
            A consistência é fundamental para melhores resultados.
          </p>
        </CardContent>
      </Card>

      {/* Evolução por Fase */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">📈 Evolução por Fase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 border border-blue-500/30 rounded-lg">
              <p className="font-semibold text-blue-600 mb-2">Semanas 1-2 (2,5mg)</p>
              <p className="text-sm text-muted-foreground mb-2">Adaptação</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Peso: 110,4 → 108,6 kg</li>
                <li>• Perda: -1,8 kg</li>
                <li>• Gordura: 35,0% → 34,8%</li>
              </ul>
            </div>
            <div className="p-4 border border-blue-500/30 rounded-lg">
              <p className="font-semibold text-blue-600 mb-2">Semanas 3-5 (4-5mg)</p>
              <p className="text-sm text-muted-foreground mb-2">Escalada</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Peso: 106,8 → 104,3 kg</li>
                <li>• Perda: -2,5 kg</li>
                <li>• Gordura: 34,7% → 32,8%</li>
              </ul>
            </div>
            <div className="p-4 border border-blue-500/30 rounded-lg">
              <p className="font-semibold text-blue-600 mb-2">Semanas 6-8 (5-7,5mg)</p>
              <p className="text-sm text-muted-foreground mb-2">Recuperação/Escalada</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Peso: 105,8 → 103,9 kg</li>
                <li>• Perda: -1,9 kg</li>
                <li>• Hiato impactou semana 6</li>
              </ul>
            </div>
            <div className="p-4 border border-blue-500/30 rounded-lg">
              <p className="font-semibold text-blue-600 mb-2">Semanas 9-12 (7,5mg)</p>
              <p className="text-sm text-muted-foreground mb-2">Manutenção</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Peso: 103,1 → 103,3 kg</li>
                <li>• Estabilização</li>
                <li>• Dois hiatos impactaram</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suplementação */}
      <SupplementationCard userPerson="reneer" isAdmin={isAdmin} />

      {/* Métricas Detalhadas */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">📊 Métricas Detalhadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold mb-3">Composição Corporal</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Massa Livre de Gordura", inicio: "71,9 kg", atual: "70,1 kg", variacao: "-1,8 kg" },
                  { label: "Massa Muscular", inicio: "67,1 kg", atual: "65,4 kg", variacao: "-1,7 kg" },
                  { label: "Taxa Muscular", inicio: "60,7%", atual: "63,4%", variacao: "+2,7%" },
                  { label: "Massa Óssea", inicio: "4,8 kg", atual: "4,7 kg", variacao: "-0,1 kg" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-secondary/30 rounded">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.inicio} → {item.atual}</span>
                    <span className={item.variacao.startsWith('+') ? 'text-success' : 'text-coral'}>{item.variacao}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-3">Indicadores Metabólicos</p>
              <div className="space-y-2 text-sm">
                {[
                  { label: "IMC", inicio: "36,9", atual: "34,5", variacao: "-2,4" },
                  { label: "Gordura Visceral", inicio: "16", atual: "14", variacao: "-2" },
                  { label: "G. Subcutânea", inicio: "25,0%", atual: "22,9%", variacao: "-2,1%" },
                  { label: "TMB", inicio: "1920 kcal", atual: "1888 kcal", variacao: "-32 kcal" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2 bg-secondary/30 rounded">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.inicio} → {item.atual}</span>
                    <span className="text-success">{item.variacao}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pontos de Atenção */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">⚡ Pontos de Atenção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/30">
              <p className="font-semibold text-success mb-2">✅ Pontos Positivos</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Perda de 7,1 kg em 12 semanas</li>
                <li>• Redução de gordura corporal (-2,9%)</li>
                <li>• Gordura visceral diminuiu (16 → 14)</li>
                <li>• Taxa muscular aumentou (+2,7%)</li>
                <li>• IMC reduziu significativamente (-2,4)</li>
              </ul>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/30">
              <p className="font-semibold text-warning mb-2">⚠️ Áreas de Melhoria</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Perda de massa muscular (-1,7 kg)</li>
                <li>• Hiatos afetaram consistência</li>
                <li>• Proteína corporal ainda baixa</li>
                <li>• TMB reduziu levemente</li>
                <li>• Manter regularidade nas aplicações</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card className="card-elevated border-0 bg-gradient-to-br from-blue-500/5 to-success/5">
        <CardHeader>
          <CardTitle className="font-serif text-xl">📝 Recomendações Próximas Semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <span className="text-xl">💪</span>
              <div>
                <p className="font-medium">Aumentar treino de força</p>
                <p className="text-sm text-muted-foreground">Para preservar/recuperar massa muscular perdida</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <span className="text-xl">🥩</span>
              <div>
                <p className="font-medium">Aumentar ingestão proteica</p>
                <p className="text-sm text-muted-foreground">Meta: 1,6-2,0g/kg de peso corporal por dia</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium">Manter consistência nas aplicações</p>
                <p className="text-sm text-muted-foreground">Evitar hiatos para maximizar resultados</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-medium">Bioimpedância semanal</p>
                <p className="text-sm text-muted-foreground">Monitorar preservação de massa magra</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReneerProtocol;
