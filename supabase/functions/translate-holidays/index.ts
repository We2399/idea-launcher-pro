import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HolidayTranslation {
  name: string;
  translations: {
    en: string;
    "zh-TW": string;
    "zh-CN": string;
    id: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { holidays, sourceLanguage } = await req.json();
    
    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
      return new Response(
        JSON.stringify({ error: "No holidays provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build prompt for translation
    const holidayNames = holidays.map((h: { name: string }) => h.name);
    
    const prompt = `Translate the following public holiday names to all 4 languages. The source language is ${sourceLanguage}.

Holiday names to translate:
${holidayNames.map((name: string, i: number) => `${i + 1}. ${name}`).join('\n')}

Return translations for each holiday in this exact JSON format:
{
  "translations": [
    {
      "original": "Holiday Name",
      "en": "English Name",
      "zh-TW": "繁體中文名稱",
      "zh-CN": "简体中文名称", 
      "id": "Nama Indonesia/Malay"
    }
  ]
}

Important:
- For Chinese translations, use appropriate cultural/official names if they exist
- For Indonesian/Malay, use formal names
- Keep the original name for the source language
- Return ONLY valid JSON, no markdown or explanation`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a professional translator specializing in official holiday names. Return only valid JSON." 
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No translation content received");
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let jsonContent = content;
    if (content.includes("```")) {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
    }

    const parsed = JSON.parse(jsonContent);
    
    // Map translations back to original holidays
    const result = holidays.map((holiday: { name: string; date: string }, index: number) => {
      const translation = parsed.translations?.[index];
      return {
        name: holiday.name,
        date: holiday.date,
        translations: translation ? {
          en: translation.en || holiday.name,
          "zh-TW": translation["zh-TW"] || holiday.name,
          "zh-CN": translation["zh-CN"] || holiday.name,
          id: translation.id || holiday.name,
        } : {
          en: holiday.name,
          "zh-TW": holiday.name,
          "zh-CN": holiday.name,
          id: holiday.name,
        }
      };
    });

    return new Response(
      JSON.stringify({ holidays: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
