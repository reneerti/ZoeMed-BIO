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

    const { userPerson } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating analysis for user: ${userPerson}`);

    // Fetch all bioimpedance data for the user
    const { data: records, error: dbError } = await supabase
      .from("bioimpedance")
      .select("*")
      .eq("user_person", userPerson)
      .order("measurement_date", { ascending: true });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum dado de bioimpedância encontrado" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const latest = records[records.length - 1];
    const first = records[0];
    const userName = userPerson === 'reneer' ? 'Reneer (homem, 38 anos, 170cm, usando Mounjaro)' : 'Ana Paula (mulher, usando Mounjaro)';

    // Calculate trends
    const weightChange = Number(latest.weight) - Number(first.weight);
    const fatChange = Number(latest.body_fat_percent) - Number(first.body_fat_percent);
    const muscleChange = Number(latest.muscle_rate_percent) - Number(first.muscle_rate_percent);
    const totalWeeks = records.length;

    console.log(`Generating AI insights for ${userName}...`);

    // Generate comprehensive insights
    const insightsResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Você é um nutricionista e personal trainer especializado em análise de bioimpedância e recomposição corporal.

Analise o histórico completo de dados e forneça uma análise profunda incluindo:

## 📊 Resumo da Evolução
- Variação de peso total e média semanal
- Evolução da composição corporal (gordura vs músculo)
- Tendências identificadas

## 🎯 Análise do IMC Atual
- Classificação atual
- Comparação com início do tratamento
- Projeção para atingir peso ideal

## 💪 Composição Corporal
- Qualidade da perda de peso (gordura vs músculo)
- Taxa de preservação muscular
- Análise da gordura visceral

## 🔥 Metabolismo
- TMB atual e evolução
- Idade metabólica vs cronológica
- Eficiência metabólica

## 📈 Projeção e Metas
- Ritmo de progresso atual
- Estimativa para atingir metas
- Ajustes recomendados

## 🍽️ Recomendações Nutricionais
- Proteína diária necessária
- Hidratação
- Suplementação sugerida

Seja específico com números e percentuais. Use emojis para destacar seções.`,
          },
          {
            role: "user",
            content: `Analise o histórico completo de bioimpedância de ${userName}:

DADOS ATUAIS (última medição):
${JSON.stringify(latest, null, 2)}

DADOS INICIAIS (primeira medição):
${JSON.stringify(first, null, 2)}

RESUMO DA EVOLUÇÃO:
- Total de medições: ${totalWeeks}
- Variação de peso: ${weightChange.toFixed(1)} kg
- Variação de gordura: ${fatChange.toFixed(1)}%
- Variação de músculo: ${muscleChange.toFixed(1)}%

HISTÓRICO COMPLETO:
${JSON.stringify(records.slice(-10), null, 2)}`,
          },
        ],
      }),
    });

    if (!insightsResponse.ok) {
      const errorText = await insightsResponse.text();
      console.error("AI Gateway error:", insightsResponse.status, errorText);
      
      if (insightsResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (insightsResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${insightsResponse.status}`);
    }

    const insightsResult = await insightsResponse.json();
    const insights = insightsResult.choices?.[0]?.message?.content || "";

    console.log("AI insights generated successfully");

    // Generate a short summary for the history list
    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Crie um resumo de 1-2 linhas (máximo 100 caracteres) desta análise de bioimpedância. Destaque o ponto principal (ex: 'Perda de 5kg, melhora na composição corporal'). Seja objetivo.",
          },
          {
            role: "user",
            content: insights,
          },
        ],
      }),
    });

    let summary = `Análise: Peso ${Number(latest.weight).toFixed(1)}kg, IMC ${Number(latest.bmi).toFixed(1)}`;
    if (summaryResponse.ok) {
      const summaryResult = await summaryResponse.json();
      summary = summaryResult.choices?.[0]?.message?.content || summary;
    }

    console.log("Saving analysis to history...");

    // Save to history
    const { error: insertError } = await supabase
      .from("ai_analysis_history")
      .insert({
        user_person: userPerson,
        summary: summary.substring(0, 200),
        full_analysis: insights,
        weight_at_analysis: Number(latest.weight),
        bmi_at_analysis: Number(latest.bmi),
        fat_at_analysis: Number(latest.body_fat_percent),
      });

    if (insertError) {
      console.error("Error saving analysis to history:", insertError);
      // Don't fail the request, just log the error
    } else {
      console.log("Analysis saved to history successfully");
    }

    return new Response(
      JSON.stringify({
        insights: insights,
        summary: {
          totalMeasurements: totalWeeks,
          weightChange: weightChange.toFixed(1),
          fatChange: fatChange.toFixed(1),
          muscleChange: muscleChange.toFixed(1),
          currentWeight: Number(latest.weight).toFixed(1),
          currentBmi: Number(latest.bmi).toFixed(1),
          currentFat: Number(latest.body_fat_percent).toFixed(1),
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in generate-analysis function:", error);
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
