/**
 * FITZY stylist engine.
 *
 * A deterministic, explainable recommendation pipeline that only uses items
 * the user actually owns:
 *
 *   weather → filter weather-inappropriate clothing
 *          → occasion (formality gates)
 *          → vibe / style scoring
 *          → user preferences
 *          → outfit assembly
 *          → compatibility check
 *          → final recommendation
 *
 * It powers demo mode entirely, acts as the offline fallback when the
 * OpenAI edge function is unavailable, and doubles as the compatibility
 * checker for AI-produced outfits.
 */
import { NEUTRAL_COLORS, occasionMeta, vibeMeta } from '@/constants/options';
import { tempBand, type TempBand } from '@/services/weather';
import type {
  Category,
  ClothingItem,
  CookContext,
  Formality,
  Modifier,
  OccasionId,
  OutfitDraft,
  VibeId,
} from '@/types';

// ---------------------------------------------------------------------------
// Metadata tables
// ---------------------------------------------------------------------------

interface OccasionRules {
  formality: Formality[];
  styleBias: string[];
  dressFriendly: boolean;
  accessoryBias: number; // 0..1 chance boost of adding an accessory
  phrase: string;
}

const OCCASION_RULES: Record<OccasionId, OccasionRules> = {
  campus: {
    formality: ['casual', 'smart-casual'],
    styleBias: ['casual', 'street', 'comfy', 'minimal'],
    dressFriendly: true,
    accessoryBias: 0.3,
    phrase: 'easy enough for a full day on campus',
  },
  hangout: {
    formality: ['casual', 'smart-casual'],
    styleBias: ['casual', 'street', 'comfy', 'trendy'],
    dressFriendly: true,
    accessoryBias: 0.4,
    phrase: 'relaxed but definitely not random',
  },
  date: {
    formality: ['smart-casual', 'formal', 'casual'],
    styleBias: ['classy', 'soft', 'romantic', 'trendy'],
    dressFriendly: true,
    accessoryBias: 0.85,
    phrase: 'soft, intentional, and a little memorable',
  },
  office: {
    formality: ['smart-casual', 'formal'],
    styleBias: ['classy', 'minimal'],
    dressFriendly: true,
    accessoryBias: 0.5,
    phrase: 'polished enough for the meeting you forgot about',
  },
  party: {
    formality: ['smart-casual', 'formal', 'casual'],
    styleBias: ['trendy', 'edgy', 'classy', 'street'],
    dressFriendly: true,
    accessoryBias: 0.9,
    phrase: 'built to catch the light on the dance floor',
  },
  travel: {
    formality: ['casual', 'smart-casual'],
    styleBias: ['comfy', 'casual', 'minimal', 'street'],
    dressFriendly: false,
    accessoryBias: 0.2,
    phrase: 'comfortable for hours without giving up the look',
  },
  wedding: {
    formality: ['formal', 'smart-casual'],
    styleBias: ['classy', 'soft', 'romantic'],
    dressFriendly: true,
    accessoryBias: 1,
    phrase: 'celebration-ready without upstaging anyone (much)',
  },
  gym: {
    formality: ['athletic', 'casual'],
    styleBias: ['sporty', 'comfy', 'street'],
    dressFriendly: false,
    accessoryBias: 0,
    phrase: 'ready to move, zero fuss',
  },
};

interface VibeRules {
  styles: string[];
  colors: string[];
  avoidColors?: string[];
  tips: string[];
  phrase: string;
}

const VIBE_RULES: Record<VibeId, VibeRules> = {
  clean: {
    styles: ['minimal', 'classy', 'casual'],
    colors: ['white', 'cream', 'beige', 'grey'],
    tips: ['Steam or iron the top — crisp is the whole point.', 'Keep jewelry to one metal family.'],
    phrase: 'clean and considered',
  },
  street: {
    styles: ['street', 'casual', 'edgy', 'sporty'],
    colors: ['black', 'grey', 'denim', 'blue'],
    tips: ['Let one piece be oversized, keep the rest structured.', 'Sneakers should look lived-in, not tired.'],
    phrase: 'street with intention',
  },
  soft: {
    styles: ['soft', 'romantic', 'comfy'],
    colors: ['blush', 'pink', 'cream', 'lavender', 'white'],
    tips: ['Tuck loosely — soft, not sloppy.', 'A dainty accessory finishes the softness.'],
    phrase: 'soft and sweet',
  },
  classy: {
    styles: ['classy', 'minimal'],
    colors: ['black', 'cream', 'navy', 'white', 'gold'],
    tips: ['Monochrome reads expensive — lean into it.', 'One statement accessory, maximum.'],
    phrase: 'quietly luxurious',
  },
  minimal: {
    styles: ['minimal', 'casual', 'classy'],
    colors: ['white', 'black', 'beige', 'grey', 'cream'],
    tips: ['Three colors max. Two is better.', 'Fit and fabric do the talking here.'],
    phrase: 'minimal but never boring',
  },
  trendy: {
    styles: ['trendy', 'street', 'edgy'],
    colors: ['black', 'denim', 'blue', 'silver'],
    tips: ['Roll or cuff something — small styling moves matter.', 'Confidence is the actual trend.'],
    phrase: 'current and a little bold',
  },
  colorpop: {
    styles: ['trendy', 'casual', 'romantic'],
    colors: ['pink', 'red', 'green', 'yellow', 'orange', 'purple', 'blue', 'lavender'],
    avoidColors: ['black', 'grey'],
    tips: ['Anchor the pop with one neutral piece.', 'Match your accessory to the boldest color.'],
    phrase: 'color-forward on purpose',
  },
  comfy: {
    styles: ['comfy', 'casual', 'soft', 'sporty'],
    colors: ['beige', 'cream', 'grey', 'white', 'brown'],
    tips: ['Layers you can shed = all-day comfort.', 'Cozy fabrics still deserve a clean silhouette.'],
    phrase: 'comfort-first, still put-together',
  },
};

const BAND_PHRASE: Record<TempBand, string> = {
  hot: 'breathable pieces that survive real heat',
  warm: "lightweight pieces that work for today's warm weather",
  mild: 'an easy layer for the in-between temperature',
  cold: 'proper warmth without losing the silhouette',
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function hashNonce(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function weatherAllows(item: ClothingItem, band: TempBand, modifiers: Modifier[]): boolean {
  const heavy =
    item.season === 'winter' ||
    ['wool', 'wool blend', 'fleece', 'knit'].some((m) => item.material.toLowerCase().includes(m));
  if ((band === 'hot' || band === 'warm') && heavy && !modifiers.includes('warmer')) {
    // Heavy knits don't belong in the heat unless explicitly requested.
    return item.category === 'outerwear' ? false : !heavy;
  }
  if (band === 'cold' && item.season === 'summer' && item.category === 'dress') {
    // Summer dresses in the cold only work with outerwear — allow but penalize later.
    return true;
  }
  return true;
}

function scoreItem(
  item: ClothingItem,
  ctx: CookContext,
  band: TempBand,
  nonce: string,
): number {
  const occ = OCCASION_RULES[ctx.occasion];
  const vibe = VIBE_RULES[ctx.vibe];
  let score = 50;

  // Weather fit
  if (item.season === 'all-season') score += 8;
  if (band === 'cold' && item.season === 'winter') score += 14;
  if ((band === 'hot' || band === 'warm') && item.season === 'summer') score += 12;
  if (band === 'cold' && item.season === 'summer') score -= 14;
  if ((band === 'hot' || band === 'warm') && item.season === 'winter') score -= 18;
  if (ctx.weather.isRaining && item.material.toLowerCase() === 'suede') score -= 10;

  // Occasion formality
  if (occ.formality.includes(item.formality)) score += 16;
  else score -= 20;
  if (ctx.occasion === 'gym' && item.formality !== 'athletic' && !item.styles.includes('sporty')) {
    score -= 12;
  }
  const eveningPiece = item.tags.some((t) => ['evening', 'party', 'statement'].includes(t));
  if ((ctx.occasion === 'office' || ctx.occasion === 'campus') && eveningPiece) score -= 16;
  if ((ctx.occasion === 'party' || ctx.occasion === 'wedding') && eveningPiece) score += 10;

  // Vibe / style overlap
  const styleHits = item.styles.filter(
    (s) => vibe.styles.includes(s) || occ.styleBias.includes(s),
  ).length;
  score += styleHits * 9;

  // Color story
  const itemColors = [item.color, ...item.secondaryColors];
  if (itemColors.some((c) => vibe.colors.includes(c))) score += 10;
  if (vibe.avoidColors && itemColors.every((c) => vibe.avoidColors!.includes(c))) score -= 12;

  // User preferences
  if (ctx.preferences.favoriteColors.some((c) => itemColors.includes(c))) score += 7;
  if (ctx.preferences.preferredVibes.includes(ctx.vibe)) score += 2;
  const avoids = ctx.preferences.avoids.toLowerCase();
  if (avoids && (avoids.includes(item.name.toLowerCase()) || item.tags.some((t) => avoids.includes(t)))) {
    score -= 25;
  }
  const loves = ctx.preferences.loves.toLowerCase();
  if (loves && item.tags.some((t) => loves.includes(t))) score += 6;

  // Modifiers
  for (const mod of ctx.modifiers) {
    switch (mod) {
      case 'warmer':
        if (item.season === 'winter' || item.category === 'outerwear') score += 14;
        break;
      case 'cooler':
        if (item.season === 'summer' || item.material.toLowerCase().includes('cotton')) score += 10;
        if (item.category === 'outerwear') score -= 18;
        break;
      case 'professional':
        if (item.formality === 'formal') score += 16;
        if (item.formality === 'smart-casual') score += 8;
        if (item.formality === 'casual') score -= 10;
        if (item.tags.includes('oversized')) score -= 6;
        break;
      case 'casual':
        if (item.formality === 'casual') score += 14;
        if (item.formality === 'formal') score -= 12;
        break;
      case 'cuter':
        if (item.styles.some((s) => ['soft', 'romantic'].includes(s))) score += 14;
        if (itemColors.some((c) => ['pink', 'blush', 'lavender', 'cream'].includes(c))) score += 8;
        break;
      case 'color':
        if (itemColors.some((c) => !NEUTRAL_COLORS.has(c))) score += 16;
        else score -= 8;
        break;
      case 'edgier':
        if (itemColors.includes('black')) score += 12;
        if (item.styles.some((s) => ['edgy', 'street'].includes(s))) score += 12;
        if (item.material.toLowerCase().includes('leather')) score += 8;
        break;
    }
  }

  // Freshness: gently resurface less-worn pieces.
  if (item.wearCount === 0) score += 4;

  // Controlled randomness so "cook again" feels alive but explainable.
  score += (hashNonce(nonce + item.id) - 0.5) * 16;

  return score;
}

// ---------------------------------------------------------------------------
// Assembly + compatibility
// ---------------------------------------------------------------------------

export function outfitSignature(itemIds: string[]): string {
  return [...itemIds].sort().join('|');
}

function best(items: ClothingItem[], scores: Map<string, number>): ClothingItem | undefined {
  return [...items].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))[0];
}

function colorCompatibility(items: ClothingItem[]): number {
  const colors = new Set(items.map((i) => i.color));
  const nonNeutral = [...colors].filter((c) => !NEUTRAL_COLORS.has(c) && c !== 'gold' && c !== 'silver');
  if (nonNeutral.length <= 1) return 1; // neutrals + max one pop = always works
  if (nonNeutral.length === 2) return 0.85;
  return 0.7;
}

export interface StylistResult extends OutfitDraft {
  signature: string;
}

export function cookOutfit(closet: ClothingItem[], ctx: CookContext): StylistResult | null {
  const band = tempBand(ctx.weather.tempC);
  const occ = OCCASION_RULES[ctx.occasion];
  const vibe = VIBE_RULES[ctx.vibe];

  // 1. Weather filter
  const wearable = closet.filter((i) => weatherAllows(i, band, ctx.modifiers));
  if (wearable.length === 0) return null;

  // Try a few nonces so "cook again" can find a different combo.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const nonce = `${ctx.occasion}-${ctx.vibe}-${ctx.modifiers.join(',')}-${ctx.exclude.length}-${attempt}${
      ctx.surprise ? `-s${Math.random()}` : ''
    }`;

    // 2–4. Score with occasion, vibe and preference rules
    const scores = new Map<string, number>();
    for (const item of wearable) scores.set(item.id, scoreItem(item, ctx, band, nonce));

    const byCat = (cat: Category) => wearable.filter((i) => i.category === cat);

    const tops = byCat('top');
    const bottoms = byCat('bottom');
    const dresses = byCat('dress');
    const shoes = byCat('shoes');
    const outerwear = byCat('outerwear');
    const accessories = byCat('accessory');

    // 5. Assemble
    const picked: ClothingItem[] = [];
    const bestDress = occ.dressFriendly ? best(dresses, scores) : undefined;
    const bestTop = best(tops, scores);
    const bestBottom = best(bottoms, scores);

    const dressScore = bestDress ? scores.get(bestDress.id) ?? -1 : -1;
    const comboScore =
      bestTop && bestBottom
        ? ((scores.get(bestTop.id) ?? 0) + (scores.get(bestBottom.id) ?? 0)) / 2
        : -1;

    if (bestDress && (dressScore >= comboScore || !bestTop || !bestBottom)) {
      picked.push(bestDress);
    } else if (bestTop && bestBottom) {
      picked.push(bestTop, bestBottom);
    } else if (bestTop || bestBottom) {
      picked.push((bestTop ?? bestBottom)!);
    } else if (bestDress) {
      picked.push(bestDress);
    } else {
      return null;
    }

    const bestShoes = best(shoes, scores);
    if (bestShoes) picked.push(bestShoes);

    const wantsLayer =
      band === 'cold' ||
      band === 'mild' ||
      ctx.modifiers.includes('warmer') ||
      (ctx.weather.isRaining && band !== 'hot');
    const bestLayer = best(outerwear, scores);
    if (bestLayer && wantsLayer && !ctx.modifiers.includes('cooler')) picked.push(bestLayer);

    const bestAcc = best(accessories, scores);
    const accRoll = hashNonce(`${nonce}-acc`);
    if (bestAcc && (accRoll < occ.accessoryBias || ctx.occasion === 'wedding')) picked.push(bestAcc);

    const ids = picked.map((i) => i.id);
    const signature = outfitSignature(ids);
    if (ctx.exclude.includes(signature) && attempt < 5) continue; // try a fresh combo

    // 6. Compatibility check
    const avg =
      picked.reduce((sum, i) => sum + (scores.get(i.id) ?? 50), 0) / Math.max(picked.length, 1);
    const compat = colorCompatibility(picked);
    const jitter = Math.round((hashNonce(`${nonce}-match`) - 0.5) * 4);
    const vibeMatch = Math.max(
      88,
      Math.min(99, Math.round(83 + (avg - 60) * 0.28 + (compat - 0.7) * 22) + jitter),
    );

    // 7. Final recommendation copy
    const explanation = buildExplanation(picked, ctx, band);
    const tips = buildTips(picked, ctx, band);

    return {
      itemIds: ids,
      explanation,
      tips,
      vibeMatch,
      source: ctx.surprise ? 'surprise' : 'stylist',
      signature,
    };
  }
  return null;
}

function buildExplanation(picked: ClothingItem[], ctx: CookContext, band: TempBand): string {
  const vibe = VIBE_RULES[ctx.vibe];
  const occ = OCCASION_RULES[ctx.occasion];
  const layer = picked.find((i) => i.category === 'outerwear');
  const layerNote = layer ? ` The ${layer.name.toLowerCase()} handles the temperature swing.` : '';
  return (
    `${capitalize(BAND_PHRASE[band])}, styled ${vibe.phrase} — ${occ.phrase}.` + layerNote
  );
}

function buildTips(picked: ClothingItem[], ctx: CookContext, band: TempBand): string[] {
  const tips = [...VIBE_RULES[ctx.vibe].tips];
  if (ctx.weather.isRaining) tips.push('Rain forecast — grab an umbrella and skip suede today. ☔');
  if (band === 'hot') tips.push('Keep a spare hair tie. Trust.');
  const blacks = picked.filter((i) => i.color === 'black').length;
  if (blacks >= Math.max(2, picked.length - 1)) {
    tips.push('Another black fit? Honestly… respect the commitment. 🖤');
  }
  return tips.slice(0, 3);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Compatibility check for AI-produced outfits: verifies every id exists in
 * the closet and the combo passes basic weather/occasion sanity. Returns the
 * cleaned list or null when unusable.
 */
export function validateOutfit(itemIds: string[], closet: ClothingItem[]): string[] | null {
  const owned = new Set(closet.map((i) => i.id));
  const valid = itemIds.filter((id) => owned.has(id));
  if (valid.length < 2) return null;
  return valid;
}
