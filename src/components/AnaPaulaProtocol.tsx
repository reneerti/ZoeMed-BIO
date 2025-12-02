import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SupplementationCard from "./SupplementationCard";

interface AnaPaulaProtocolProps {
  isAdmin?: boolean;
}

const AnaPaulaProtocol = ({ isAdmin = false }: AnaPaulaProtocolProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Diagnóstico */}
      <Card className="card-elevated border-0 border-l-4 border-l-warning">
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            🔬 Diagnóstico: "Skinny Fat" (TOFI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            <strong>Thin Outside, Fat Inside</strong> - Peso normal (IMC 24,0) com composição corporal inadequada. 
            Gordura visceral excelente (8,0), mas gordura subcutânea elevada (33,1%). 
            O protocolo focará em recomposição corporal: reduzir gordura mantendo/ganhando massa muscular.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">IMC</p>
              <p className="font-bold text-success">24,0</p>
              <Badge variant="outline" className="mt-1 text-xs">Normal</Badge>
            </div>
            <div className="text-center p-3 bg-warning/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Gordura %</p>
              <p className="font-bold text-warning">33,1%</p>
              <Badge variant="outline" className="mt-1 text-xs bg-warning/20">Alta</Badge>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-xs text-muted-foreground">G. Visceral</p>
              <p className="font-bold text-success">8,0</p>
              <Badge variant="outline" className="mt-1 text-xs">Excelente</Badge>
            </div>
            <div className="text-center p-3 bg-warning/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Proteína</p>
              <p className="font-bold text-warning">13,4%</p>
              <Badge variant="outline" className="mt-1 text-xs bg-warning/20">Baixa</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">📊 Comparativo: Ana Paula vs Reneer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Métrica</th>
                  <th className="text-center py-2 text-coral">Ana Paula</th>
                  <th className="text-center py-2 text-blue-600">Reneer</th>
                  <th className="text-center py-2">Diferença</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Peso</td>
                  <td className="text-center">60,6 kg</td>
                  <td className="text-center">104,8 kg</td>
                  <td className="text-center text-success">-44,2 kg</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">IMC</td>
                  <td className="text-center">24,0</td>
                  <td className="text-center">35,0</td>
                  <td className="text-center text-success">-11,0</td>
                </tr>
                <tr className="border-b bg-warning/10">
                  <td className="py-2 font-semibold">Gordura %</td>
                  <td className="text-center font-semibold">33,1%</td>
                  <td className="text-center font-semibold">33,5%</td>
                  <td className="text-center font-semibold text-warning">Similar! ⚠️</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">G. Visceral</td>
                  <td className="text-center">8,0</td>
                  <td className="text-center">15</td>
                  <td className="text-center text-success">✅ Muito melhor</td>
                </tr>
                <tr>
                  <td className="py-2">TMB</td>
                  <td className="text-center">1244 kcal</td>
                  <td className="text-center">1875 kcal</td>
                  <td className="text-center">-631 kcal</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4 p-3 bg-warning/10 rounded-lg">
            💡 <strong>Conclusão crítica:</strong> Apesar de pesar 44kg a menos, Ana Paula tem proporção de gordura corporal praticamente igual ao Reneer. 
            Isso é o exemplo perfeito de "skinny fat" - peso aparentemente normal.
          </p>
        </CardContent>
      </Card>

      {/* Metas */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">🎯 Metas - 12 Semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-coral/20 via-transparent to-success/20 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">60,6 kg</p>
              <p className="text-xs text-muted-foreground">INÍCIO</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coral">58 kg</p>
              <p className="text-xs text-muted-foreground">SEMANA 6</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">56,5 kg</p>
              <p className="text-xs text-muted-foreground">META FINAL</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm">
            {[
              { metric: "Peso", atual: "60,6 kg", meta: "56-57 kg", variacao: "-3,5 a -4,5 kg" },
              { metric: "Gordura %", atual: "33,1%", meta: "26-28%", variacao: "-5 a -7%" },
              { metric: "Massa Muscular", atual: "37,8 kg", meta: "38-39 kg", variacao: "+0 a +1 kg" },
              { metric: "Proteína %", atual: "13,4%", meta: "15-16%", variacao: "+1,5 a +2,5%" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-2 bg-secondary/30 rounded">
                <span className="font-medium">{item.metric}</span>
                <span className="text-muted-foreground">{item.atual}</span>
                <span className="text-coral font-medium">{item.meta}</span>
                <span className="text-success text-xs">{item.variacao}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Protocolo Monjaro */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">💉 Protocolo Monjaro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-coral/10 rounded-lg">
            <p className="font-semibold">Dose Atual: 2,5 mg</p>
            <p className="text-sm text-muted-foreground">Aplicação: 01/12/2024 • Próxima: 08/12/2024</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="font-semibold text-coral mb-2">Semanas 1-4 (2,5mg)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Aplicação: Toda sexta-feira</li>
                <li>✓ Perda esperada: 1-2 kg</li>
                <li>✓ Redução gordura: 0,5-1,0%</li>
                <li>✓ Bioimpedância quinzenal</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-semibold text-coral mb-2">Semanas 5-8 (5,0mg)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Escalada se necessário</li>
                <li>✓ Perda esperada: 1,5-2,5 kg</li>
                <li>✓ Redução gordura: 1-2%</li>
                <li>✓ Monitorar massa muscular</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="font-semibold text-coral mb-2">Semanas 9-12 (7,5mg)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Possível escalada final</li>
                <li>✓ Perda esperada: 1-2 kg</li>
                <li>✓ Ajuste fino composição</li>
                <li>✓ Avaliação completa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocolo Nutricional */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">🥗 Protocolo Nutricional</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 p-3 bg-warning/10 rounded-lg">
            ⚠️ O Monjaro será mais efetivo quando combinado com alta ingestão proteica (110-120g/dia) 
            e treino de força regular. Não confiar apenas na medicação.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold mb-2">📊 Macros Diários</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-secondary/30 rounded">
                  <span>Calorias Totais</span>
                  <span className="font-medium">1500-1600 kcal</span>
                </div>
                <div className="flex justify-between p-2 bg-coral/10 rounded">
                  <span>Proteína</span>
                  <span className="font-medium text-coral">110-120g</span>
                </div>
                <div className="flex justify-between p-2 bg-secondary/30 rounded">
                  <span>Gordura</span>
                  <span className="font-medium">50-60g</span>
                </div>
                <div className="flex justify-between p-2 bg-secondary/30 rounded">
                  <span>Carboidratos</span>
                  <span className="font-medium">130-150g</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <SupplementationCard userPerson="ana_paula" title="Suplementação" isAdmin={isAdmin} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocolo de Treino */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="font-serif text-xl">🏋️ Protocolo de Treino</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 p-3 bg-success/10 rounded-lg">
            💪 <strong>Princípio Fundamental:</strong> Treino de força é PRIORIDADE. Com 13,4% de proteína corporal 
            e deficit calórico, sem treino de força adequado, perderá massa muscular junto com gordura.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-success/30 rounded-lg">
              <p className="font-semibold text-success mb-2">Segunda/Quarta/Sexta</p>
              <p className="text-xs text-muted-foreground mb-2">Treino de Força (45-60 min)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Full-body ou divisão</li>
                <li>✓ Agachamento, terra, supino</li>
                <li>✓ 3-4 séries x 8-12 reps</li>
                <li>✓ Whey pós-treino obrigatório</li>
              </ul>
            </div>
            <div className="p-4 border border-coral/30 rounded-lg">
              <p className="font-semibold text-coral mb-2">Terça/Quinta</p>
              <p className="text-xs text-muted-foreground mb-2">HIIT Leve (20-30 min)</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Elíptico ou caminhada</li>
                <li>✓ Intensidade moderada</li>
                <li>✓ Preservar massa muscular</li>
                <li>✓ Foco: gordura subcutânea</li>
              </ul>
            </div>
            <div className="p-4 border border-muted/30 rounded-lg">
              <p className="font-semibold text-muted-foreground mb-2">Sábado/Domingo</p>
              <p className="text-xs text-muted-foreground mb-2">Descanso Ativo</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Caminhada leve (30-40 min)</li>
                <li>✓ Yoga ou alongamento</li>
                <li>✓ Recuperação muscular</li>
                <li>✓ Manter proteína alta</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expectativa */}
      <Card className="card-elevated border-0 bg-gradient-to-br from-coral/5 to-success/5">
        <CardContent className="p-6">
          <p className="text-center text-lg">
            ✨ <strong>Expectativa de Resultados:</strong> Com adesão rigorosa ao protocolo (Monjaro + 110-120g proteína/dia + treino de força 3x/semana), 
            pode atingir <span className="text-success font-bold">56-57kg</span> com <span className="text-coral font-bold">26-28% de gordura</span> corporal em 12 semanas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnaPaulaProtocol;
