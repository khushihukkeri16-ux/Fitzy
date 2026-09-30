// FITZY — AI clothing tagging (Supabase Edge Function, Deno runtime)
//
// The OpenAI key lives ONLY here, as an edge function secret:
//   supabase secrets set OPENAI_API_KEY=sk-...
//
// Deploy: supabase functions deploy ai-tag-item
//
// The React Native client calls this via supabase.functions.invoke with the
// user's JWT — it never sees the key.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a fashion cataloguing assistant for a digital wardrobe app.
Analyze the clothing item in the photo and return STRICT JSON (no markdown) with:
{
  "name": short human name like "White oversized tee",
  "category": one of "top","bottom","dress","outerwear","shoes","accessory","other",
  "color": single lowercase main color word,
  "secondaryColors": array of lowercase color words (may be empty),
  "pattern": e.g. "solid","striped","floral","graphic",
  "material": best guess, e.g. "cotton","denim","leather" (empty string if unsure),
  "season": one of "summer","winter","monsoon","all-season",
  "styles": up to 3 of "casual","street","minimal","classy","soft","sporty","edgy","preppy","vintage","romantic","comfy","trendy",
  "formality": one of "casual","smart-casual","formal","athletic",
  "tags": up to 4 short useful fashion tags,
  "confidence": 0..1 how confident you are overall
}
Never invent details you cannot see; use conservative guesses and lower confidence instead.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    if (!OPENAI_API_KEY) {
      return json({ error: 'OPENAI_API_KEY not configured' }, 500);
    }
    const { image } = await req.json();
    if (!image || typeof image !== 'string') {
      return json({ error: 'missing image' }, 400);
    }
    const dataUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Tag this clothing item.' },
              { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
    const completion = await res.json();
    const parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? '{}');
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
