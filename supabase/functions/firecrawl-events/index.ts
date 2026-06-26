declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TenantSettingRow = {
  tenant_id: string;
  target_city: string | null;
};

type FirecrawlStartResponse = {
  success?: boolean;
  id?: string;
  error?: string;
};

type FirecrawlStatusResponse = {
  success?: boolean;
  status?: "processing" | "completed" | "failed";
  data?: unknown;
  error?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type RawEvent = {
  title?: unknown;
  description?: unknown;
  event_date?: unknown;
  estimated_impact?: unknown;
  source_url?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

type NormalizedEvent = {
  title: string;
  description: string | null;
  event_date: string;
  estimated_impact: string | null;
  source_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v2";
const GEMINI_MODEL = "gemini-1.5-pro";
const MAX_AGENT_POLLS = 30;
const AGENT_POLL_INTERVAL_MS = 2500;

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeJsonString(value: string) {
  return value.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function parseNumber(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function normalizeEvent(rawEvent: RawEvent): NormalizedEvent | null {
  if (typeof rawEvent.title !== "string" || rawEvent.title.trim().length < 3) {
    return null;
  }

  if (typeof rawEvent.event_date !== "string") {
    return null;
  }

  const parsedDate = new Date(rawEvent.event_date);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const sourceUrl = typeof rawEvent.source_url === "string" ? rawEvent.source_url.trim() : "";
  const description = typeof rawEvent.description === "string" ? rawEvent.description.trim() : "";
  const estimatedImpact = typeof rawEvent.estimated_impact === "string" ? rawEvent.estimated_impact.trim() : "";

  return {
    title: rawEvent.title.trim(),
    description: description.length > 0 ? description : null,
    event_date: parsedDate.toISOString().slice(0, 10),
    estimated_impact: estimatedImpact.length > 0 ? estimatedImpact : null,
    source_url: sourceUrl.length > 0 ? sourceUrl : null,
    latitude: parseNumber(rawEvent.latitude, -90, 90),
    longitude: parseNumber(rawEvent.longitude, -180, 180),
  };
}

function extractGeminiText(geminiPayload: GeminiResponse): string {
  const text = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || text.trim().length === 0) {
    throw new Error("Gemini response did not return event data text.");
  }
  return normalizeJsonString(text);
}

async function firecrawlStartAgent(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(`${FIRECRAWL_BASE_URL}/agent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      model: "spark-1-pro",
      maxCredits: 1500,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Firecrawl start failed: ${message}`);
  }

  const payload = (await response.json()) as FirecrawlStartResponse;
  if (!payload.id) {
    throw new Error(`Firecrawl start response missing id: ${JSON.stringify(payload)}`);
  }

  return payload.id;
}

async function firecrawlWaitForCompletion(jobId: string, apiKey: string): Promise<unknown> {
  for (let attempt = 0; attempt < MAX_AGENT_POLLS; attempt += 1) {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/agent/${jobId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Firecrawl status failed: ${message}`);
    }

    const payload = (await response.json()) as FirecrawlStatusResponse;
    if (payload.status === "completed") {
      return payload.data ?? {};
    }
    if (payload.status === "failed") {
      throw new Error(`Firecrawl job failed: ${payload.error ?? "Unknown error"}`);
    }

    await wait(AGENT_POLL_INTERVAL_MS);
  }

  throw new Error(`Firecrawl job timed out after ${MAX_AGENT_POLLS} polls.`);
}

async function callGemini(rawText: string, city: string, apiKey: string): Promise<RawEvent[]> {
  const prompt = [
    "Você é um analista de eventos para operações gastronômicas itinerantes.",
    `Analise os dados extraídos da web para a cidade "${city}".`,
    "Retorne APENAS um array JSON puro (sem markdown) com objetos no formato:",
    "{ title, description, event_date, estimated_impact, source_url, latitude, longitude }",
    "Regras obrigatórias:",
    "- event_date em YYYY-MM-DD",
    "- latitude e longitude devem ser números reais quando houver localização confiável; caso não exista, retornar null",
    "- estimated_impact deve ser: Alto, Médio ou Baixo",
    "- Não invente URLs; se não houver, use null",
    "",
    "Dados coletados:",
    rawText,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini call failed: ${message}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(payload);
  const parsed = JSON.parse(text) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini response is not an array.");
  }

  return parsed as RawEvent[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    }
    if (!firecrawlApiKey || !geminiApiKey) {
      throw new Error("Missing FIRECRAWL_API_KEY or GEMINI_API_KEY.");
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: tenantSettings, error: tenantError } = await supabaseClient
      .from("tenant_settings")
      .select("tenant_id, target_city")
      .not("target_city", "is", null);

    if (tenantError) {
      throw tenantError;
    }

    const tenants = (tenantSettings ?? []) as TenantSettingRow[];
    if (tenants.length === 0) {
      return jsonResponse({
        success: true,
        processedTenants: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      });
    }

    const errors: string[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const tenant of tenants) {
      const city = tenant.target_city?.trim();
      if (!city) {
        errors.push(`Tenant ${tenant.tenant_id}: target_city is empty.`);
        continue;
      }

      try {
        const firecrawlPrompt = [
          `Busque eventos públicos e privados relevantes para vendas de alimentação em ${city}.`,
          "Priorize resultados dos próximos 6 meses em portais de prefeitura, produtoras, Sympla, associações comerciais e agendas culturais.",
          "Colete nome do evento, data, local, cidade, público estimado, link de fonte e qualquer pista geográfica para latitude/longitude.",
        ].join(" ");

        const firecrawlJobId = await firecrawlStartAgent(firecrawlPrompt, firecrawlApiKey);
        const firecrawlData = await firecrawlWaitForCompletion(firecrawlJobId, firecrawlApiKey);
        const rawEvents = await callGemini(JSON.stringify(firecrawlData), city, geminiApiKey);

        for (const rawEvent of rawEvents) {
          const event = normalizeEvent(rawEvent);
          if (!event) {
            skipped += 1;
            errors.push(`Tenant ${tenant.tenant_id}: invalid event payload skipped.`);
            continue;
          }

          const { data: existingEvent, error: existingError } = await supabaseClient
            .from("events")
            .select("id")
            .eq("tenant_id", tenant.tenant_id)
            .eq("title", event.title)
            .eq("event_date", event.event_date)
            .maybeSingle();

          if (existingError) {
            errors.push(`Tenant ${tenant.tenant_id}: lookup failed for "${event.title}" (${existingError.message}).`);
            continue;
          }

          if (existingEvent?.id) {
            const { error: updateError } = await supabaseClient
              .from("events")
              .update({
                description: event.description,
                estimated_impact: event.estimated_impact,
                source_url: event.source_url,
                latitude: event.latitude,
                longitude: event.longitude,
              })
              .eq("id", existingEvent.id);

            if (updateError) {
              errors.push(`Tenant ${tenant.tenant_id}: update failed for "${event.title}" (${updateError.message}).`);
              continue;
            }
            updated += 1;
          } else {
            const { error: insertError } = await supabaseClient.from("events").insert({
              tenant_id: tenant.tenant_id,
              title: event.title,
              description: event.description,
              event_date: event.event_date,
              estimated_impact: event.estimated_impact,
              source_url: event.source_url,
              latitude: event.latitude,
              longitude: event.longitude,
            });

            if (insertError) {
              errors.push(`Tenant ${tenant.tenant_id}: insert failed for "${event.title}" (${insertError.message}).`);
              continue;
            }
            inserted += 1;
          }
        }
      } catch (tenantErrorValue) {
        const message = tenantErrorValue instanceof Error ? tenantErrorValue.message : String(tenantErrorValue);
        errors.push(`Tenant ${tenant.tenant_id}: ${message}`);
      }
    }

    return jsonResponse({
      success: true,
      processedTenants: tenants.length,
      inserted,
      updated,
      skipped,
      errors,
    });
  } catch (errorValue) {
    const message = errorValue instanceof Error ? errorValue.message : String(errorValue);
    console.error("firecrawl-events execution failed:", message);
    return jsonResponse({ success: false, error: message }, 400);
  }
});
