/**
 * AI service — all model interaction goes through here.
 *
 * Production path: Supabase Edge Functions (`ai-tag-item`, `ai-stylist`)
 * which hold the OpenAI key server-side. The React Native client NEVER sees
 * a private key.
 *
 * Fallback path: when Supabase isn't configured (demo mode) or a call fails,
 * we degrade gracefully to the local stylist engine / editable defaults so
 * the app keeps working offline.
 */
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';
import { cookOutfit, validateOutfit, type StylistResult } from '@/services/stylist';
import type { AITagResult, ClothingItem, CookContext } from '@/types';

// ---------------------------------------------------------------------------
// Clothing tagging
// ---------------------------------------------------------------------------

/** Neutral, fully-editable defaults when AI tagging is unavailable. */
function defaultTags(): AITagResult {
  return {
    name: '',
    category: 'top',
    color: 'black',
    secondaryColors: [],
    pattern: 'solid',
    material: 'cotton',
    season: 'all-season',
    styles: ['casual'],
    formality: 'casual',
    tags: [],
    confidence: 0,
  };
}

/**
 * Ask the vision model to tag an uploaded clothing photo.
 * `imageBase64` should be a JPEG/PNG data URL or raw base64.
 * Returns editable suggestions — the UI always lets the user correct them.
 */
export async function tagClothingImage(imageBase64: string): Promise<AITagResult> {
  const supabase = getSupabase();
  if (!supabase) return defaultTags();
  try {
    const { data, error } = await supabase.functions.invoke('ai-tag-item', {
      body: { image: imageBase64 },
    });
    if (error || !data) return defaultTags();
    return { ...defaultTags(), ...data, confidence: data.confidence ?? 0.7 };
  } catch {
    return defaultTags();
  }
}

// ---------------------------------------------------------------------------
// Outfit generation
// ---------------------------------------------------------------------------

export interface GeneratedOutfit extends StylistResult {}

/**
 * Generate an outfit from the user's real closet.
 * 1. Try the `ai-stylist` edge function (OpenAI, server-side key).
 * 2. Validate the AI's picks against the closet (compatibility check).
 * 3. Fall back to the local stylist engine when offline/unconfigured.
 */
export async function generateOutfit(
  closet: ClothingItem[],
  ctx: CookContext,
): Promise<GeneratedOutfit | null> {
  if (isSupabaseConfigured) {
    const remote = await generateViaEdge(closet, ctx);
    if (remote) return remote;
  }
  return cookOutfit(closet, ctx);
}

async function generateViaEdge(
  closet: ClothingItem[],
  ctx: CookContext,
): Promise<GeneratedOutfit | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke('ai-stylist', {
      body: {
        closet: closet.map(({ imageUri, ...rest }) => rest), // never send raw images here
        weather: {
          tempC: ctx.weather.tempC,
          condition: ctx.weather.condition,
          isRaining: ctx.weather.isRaining,
        },
        occasion: ctx.occasion,
        vibe: ctx.vibe,
        preferences: ctx.preferences,
        modifiers: ctx.modifiers,
        exclude: ctx.exclude,
        surprise: ctx.surprise ?? false,
      },
    });
    if (error || !data?.itemIds) return null;

    // Compatibility check: AI must only use items the user owns.
    const validated = validateOutfit(data.itemIds, closet);
    if (!validated) return null;

    return {
      itemIds: validated,
      explanation: String(data.explanation ?? ''),
      tips: Array.isArray(data.tips) ? data.tips.slice(0, 3).map(String) : [],
      vibeMatch: Math.max(88, Math.min(99, Number(data.vibeMatch) || 92)),
      optionalAdditions: Array.isArray(data.optionalAdditions)
        ? data.optionalAdditions.map(String)
        : undefined,
      source: ctx.surprise ? 'surprise' : 'ai',
      signature: [...validated].sort().join('|'),
    };
  } catch {
    return null;
  }
}

/** Friendly one-line style summary for the profile screen. */
export function summarizeStyle(closet: ClothingItem[], preferredVibes: string[]): string {
  if (closet.length === 0) return 'Your style era is loading… add some pieces first. ✨';
  const styleCounts = new Map<string, number>();
  for (const item of closet) {
    for (const s of item.styles) styleCounts.set(s, (styleCounts.get(s) ?? 0) + 1);
  }
  const top = [...styleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([s]) => s);
  const colorCounts = new Map<string, number>();
  for (const item of closet) colorCounts.set(item.color, (colorCounts.get(item.color) ?? 0) + 1);
  const topColor = [...colorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const main = top[0] ?? preferredVibes[0] ?? 'minimal';
  const second = top[1];
  const colorNote = topColor ? ` — heavy on the ${topColor}` : '';
  return second
    ? `Your wardrobe is giving ${main} with a little ${second} energy${colorNote}.`
    : `Your wardrobe is giving certified ${main} energy${colorNote}.`;
}
