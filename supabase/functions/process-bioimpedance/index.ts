import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, userPerson } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Gemini 2.5 Pro for vision/OCR capabilities
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
            content: `Você é um assistente especializado em extrair dados de bioimpedância de imagens.
Extraia os seguintes dados da imagem se disponíveis e retorne APENAS um JSON válido sem markdown:
{
  "measurement_date": "YYYY-MM-DD",
  "weight": number (peso em kg),
  "bmi": number (IMC),
  "body_fat_percent": number (% gordura corporal),
  "fat_mass": number (massa gorda em kg),
  "lean_mass": number (massa livre de gordura em kg),
  "muscle_mass": number (massa muscular em kg),
  "muscle_rate_percent": number (taxa muscular %),
  "skeletal_muscle_percent": number (músculo esquelético %),
  "bone_mass": number (massa óssea em kg),
  "protein_mass": number (massa proteica em kg),
  "protein_percent": number (proteína %),
  "body_water_percent": number (água corporal %),
  "moisture_content": number (teor de umidade em kg),
  "subcutaneous_fat_percent": number (gordura subcutânea %),
  "visceral_fat": number (gordura visceral),
  "bmr": number (TMB em kcal),
  "metabolic_age": number (idade metabólica),
  "whr": number (razão cintura/quadril)
}
Use null para campos não encontrados. Retorne APENAS o JSON, sem explicações.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extraia os dados de bioimpedância desta imagem:",
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

    // Generate insights using the AI
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
            content: "Você é um nutricionista especializado em análise de bioimpedância. Forneça insights breves e práticos em português sobre os dados. Seja conciso (máximo 3 parágrafos).",
          },
          {
            role: "user",
            content: `Analise estes dados de bioimpedância de ${userPerson === 'reneer' ? 'Reneer' : 'Ana Paula'} e forneça insights relevantes:\n${JSON.stringify(extractedData, null, 2)}`,
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
