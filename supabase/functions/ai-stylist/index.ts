// FITZY — AI outfit generation (Supabase Edge Function, Deno runtime)
//
// The OpenAI key lives ONLY here:  supabase secrets set OPENAI_API_KEY=sk-...
// Deploy: supabase functions deploy ai-stylist
//
// Receives the user's closet metadata + context, asks the model to compose an
// outfit STRICTLY from owned item ids, and returns it. The client re-validates
// every id before showing anything (compatibility check).

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are FITZY, a warm and slightly witty AI personal stylist.
You will receive a JSON payload with:
- closet: array of clothing items the user OWNS (id, name, category, color, season, styles, formality, tags, material, pattern)
- weather: { tempC, condition, isRaining }
- occasion, vibe, modifiers, preferences, exclude (signatures of combos to avoid), surprise

Compose ONE wearable outfit using ONLY item ids from the closet. Rules:
1. Respect the weather: no heavy knits/outerwear in heat, add layers in cold or rain.
2. Match the occasion's formality and the requested vibe.
3. Honor user preferences (favorite colors, loves, avoids) and every modifier.
4. Use either one dress OR one top + one bottom; add shoes if available; outerwear/accessory when appropriate.
5. Never invent items. If something is missing, you may list it in optionalAdditions as text, clearly optional.
6. Avoid combos whose sorted-id signature is in "exclude".

Return STRICT JSON (no markdown):
{
  "itemIds": [ids from the closet],
  "explanation": 1-2 friendly sentences on why it works for the weather + occasion + vibe,
  "tips": up to 3 short styling tips,
  "vibeMatch": integer 88-99,
  "optionalAdditions": optional array of item names the user does NOT own (may be empty)
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (!OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY not configured' }, 500);
    }
    const payload = await req.json();
    if (!Array.isArray(payload?.closet) || payload.closet.length === 0) {
      return json({ error: 'empty closet' }, 400);
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: payload.surprise ? 0.9 : 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(payload) },
        ],
      }),
    });

    if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
    const completion = await res.json();
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? '{}');

    // Server-side sanity: only ids that exist in the submitted closet.
    const owned = new Set(payload.closet.map((i: { id: string }) => i.id));
    parsed.itemIds = Array.isArray(parsed.itemIds)
      ? parsed.itemIds.filter((id: string) => owned.has(id))
      : [];

    return json(parsed, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
