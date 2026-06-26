declare const Deno: any;
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get all tenants with a configured target_city
    const { data: tenants, error: tenantsError } = await supabaseClient
      .from("tenant_settings")
      .select("tenant_id, target_city")
      .not("target_city", "is", null);

    if (tenantsError) throw tenantsError;

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!firecrawlApiKey || !geminiApiKey) {
      throw new Error("Missing Firecrawl or Gemini API Keys");
    }

    const results = [];

    // 2. For each tenant, query Firecrawl and Gemini
    for (const tenant of tenants) {
      if (!tenant.target_city) continue;

      const prompt = `Procure por eventos relevantes, feiras, shows e aglomerações programadas para os próximos 3 meses na cidade de ${tenant.target_city}. Busque em sites de prefeitura, sympla, agendas culturais e notícias locais.`;

      // Call Firecrawl Agent API
      const firecrawlResponse = await fetch("https://api.firecrawl.dev/v2/agent", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          instruction: prompt,
        })
      });

      if (!firecrawlResponse.ok) {
        console.error(`Firecrawl error for ${tenant.target_city}:`, await firecrawlResponse.text());
        continue;
      }

      const firecrawlData = await firecrawlResponse.json();
      const extractedText = JSON.stringify(firecrawlData);

      // 3. Process with Google Gemini to get structured JSON
      const geminiPrompt = `
      Você é um especialista em análise de eventos para ajudar donos de lancherias e organizadores.
      Analise o texto extraído da web e liste os eventos encontrados.
      Retorne APENAS um array JSON puro (sem markdown blocks) com os eventos.
      Schema esperado para cada objeto do array:
      - title (string): Nome do evento
      - description (string): Breve resumo
      - event_date (string): Data no formato YYYY-MM-DD (estime se não for exata)
      - estimated_impact (string): 'Alto', 'Médio' ou 'Baixo' dependendo do tamanho do evento
      - source_url (string): URL da fonte se disponível

      Texto extraído:
      ${extractedText}
      `;

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }]
        })
      });

      if (!geminiResponse.ok) {
        console.error(`Gemini error for ${tenant.target_city}:`, await geminiResponse.text());
        continue;
      }

      const geminiData = await geminiResponse.json();
      let eventsJsonString = geminiData.candidates[0].content.parts[0].text;
      
      // Clean up markdown wrapping if Gemini ignored instructions
      eventsJsonString = eventsJsonString.replace(/```json/g, "").replace(/```/g, "").trim();
      
      let eventsArray = [];
      try {
        eventsArray = JSON.parse(eventsJsonString);
      } catch (e) {
        console.error(`Failed to parse Gemini output for ${tenant.target_city}:`, eventsJsonString);
        continue;
      }

      // 4. Save to database
      for (const event of eventsArray) {
        const { error: insertError } = await supabaseClient
          .from("events")
          .insert({
            tenant_id: tenant.tenant_id,
            title: event.title,
            description: event.description,
            event_date: event.event_date,
            estimated_impact: event.estimated_impact,
            source_url: event.source_url
          });

        if (insertError) {
          console.error(`Failed to insert event ${event.title}:`, insertError);
        } else {
          results.push(event.title);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in firecrawl-events:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
