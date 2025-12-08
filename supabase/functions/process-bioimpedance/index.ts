import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

    const { imageUrl, userPerson } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Gemini 2.5 Pro for vision/OCR capabilities - optimized for Fitdays report format
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em extrair dados de bioimpedância de imagens de relatórios Fitdays ou similares.

FORMATO DO RELATÓRIO FITDAYS:
O relatório inclui seções como:
- "Análise da composição corporal": Peso, Massa gorda, Massa Óssea, Massa protéica, Água corporal, Massa muscular, Músculo esquelético
- "Análise de gordura muscular": Peso(kg), Músculo esquelético(kg), Massa gorda(kg)
- "Análise de obesidade": IMC(kg/m²), Taxa de gordura corporal(%)
- "Pontuação corporal": pontos/100
- "Controle de peso": Peso-alvo recomendado, Controle de peso, Controle de gordura, Controle muscular
- "Avaliação da obesidade": IMC, Taxa de gordura corporal, Obesidade(peso atual/Peso alvo)
- "Outros indicadores": Grau de gordura visceral, Taxa metabólica basal, Peso corporal livre de gordura, Gordura subcutânea, SMI, Idade do corpo, WHR

Extraia os seguintes dados da imagem e retorne APENAS um JSON válido sem markdown:
{
  "measurement_date": "YYYY-MM-DD" (use a data do "Tempo de teste" se disponível, senão data atual),
  "weight": number (Peso em kg - valor principal da tabela Análise da composição corporal),
  "bmi": number (IMC - de Análise de obesidade ou Avaliação da obesidade),
  "body_fat_percent": number (Taxa de gordura corporal % - de Análise de obesidade),
  "fat_mass": number (Massa gorda em kg - de Análise da composição corporal),
  "lean_mass": number (Peso corporal livre de gordura em kg - de Outros indicadores),
  "muscle_mass": number (Massa muscular em kg - de Análise da composição corporal),
  "muscle_rate_percent": number (taxa muscular % - calcule se não disponível: (muscle_mass/weight)*100),
  "skeletal_muscle_percent": number (Músculo esquelético % - de Análise da composição corporal),
  "bone_mass": number (Massa Óssea em kg),
  "protein_mass": number (Massa protéica em kg),
  "protein_percent": number (proteína % - calcule: (protein_mass/weight)*100),
  "body_water_percent": number (Água corporal %),
  "moisture_content": number (teor de umidade em kg se disponível),
  "subcutaneous_fat_percent": number (Gordura subcutânea %),
  "visceral_fat": number (Grau de gordura visceral - de Outros indicadores),
  "bmr": number (Taxa metabólica basal em kcal - de Outros indicadores),
  "metabolic_age": number (Idade do corpo - de Outros indicadores),
  "whr": number (WHR razão cintura/quadril - de Outros indicadores)
}

IMPORTANTE:
- O relatório mostra valores como "102.0 (54.0-73.1)" - extraia apenas o primeiro número (102.0)
- SMI é o Índice de Músculo Esquelético, geralmente em kg/m²
- Use null para campos não encontrados
- Retorne APENAS o JSON, sem explicações ou markdown`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os dados de bioimpedância desta imagem de relatório Fitdays:",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const extractedText = aiResult.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    let extractedData;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (e) {
      console.error("Failed to parse extracted data:", extractedText);
      extractedData = {};
    }

    // Generate insights using the AI with comprehensive analysis
    const insightsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um nutricionista especializado em análise de bioimpedância. 
            
Analise os dados fornecidos e forneça insights personalizados incluindo:
1. **Avaliação Geral**: Status do IMC, classificação de obesidade
2. **Composição Corporal**: Análise da relação gordura/músculo
3. **Saúde Metabólica**: Taxa metabólica basal e idade metabólica vs idade cronológica
4. **Gordura Visceral**: Risco cardiovascular baseado no nível
5. **Recomendações Práticas**: 2-3 ações específicas para melhoria

Seja objetivo e prático. Máximo 4 parágrafos curtos.`,
          },
          {
            role: "user",
            content: `Analise estes dados de bioimpedância de ${userPerson === 'reneer' ? 'Reneer (homem, 38 anos, 170cm, usando Mounjaro)' : 'Ana Paula (mulher, usando Mounjaro)'} e forneça insights relevantes:\n${JSON.stringify(extractedData, null, 2)}`,
          },
        ],
      }),
    });

    let insights = "";
    if (insightsResponse.ok) {
      const insightsResult = await insightsResponse.json();
      insights = insightsResult.choices?.[0]?.message?.content || "";
    }

    return new Response(
      JSON.stringify({
        data: extractedData,
        insights: insights,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in process-bioimpedance function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
