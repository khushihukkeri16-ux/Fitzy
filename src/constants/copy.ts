/**
 * FITZY microcopy — Gen-Z, tasteful, never spammy.
 * Every playful string lives here so tone stays consistent.
 */

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export const GREETINGS = [
  'heyyy bestie 👋',
  "Okayyy, what's the vibe today? 👀",
  "Let's cook a fit. ✨",
  'Main character energy loading…',
  'Your closet called. It has ideas.',
  'Another day, another serve.',
] as const;

export const COOK_LOADING = [
  'Cooking your fit… 👩‍🍳✨',
  'No outfit crisis on our watch.',
  'Your closet is about to make sense.',
  'Matching pieces like a matchmaker…',
  'Consulting the fashion archives…',
] as const;

export const SURPRISE_LOADING = [
  'Raiding your closet… 👀',
  'Cooking something good… 👩‍🍳',
  'Trust the process…',
  'Your wardrobe is talking…',
] as const;

export const RESULT_SUBTITLES = [
  "Okay bestie… this one's giving.",
  'We understood the assignment.',
  'Soft launch this immediately.',
  'This fit? Curated. Intentional. You.',
] as const;

export const SAVE_SUCCESS = [
  'Okayyy, we ate. 🔥',
  'Receipt printed. Fit secured. 🧾',
  'Added to the archive. Iconic.',
] as const;

export const WEATHER_CAPTIONS: Record<string, readonly string[]> = {
  hot: [
    'certified sundress weather ☀️',
    'hydrate, then serve.',
    'light fabrics only, bestie.',
  ],
  warm: [
    'perfect weather to serve a casual slay ✨',
    'golden hour dressing all day.',
    'the weather said: go off.',
  ],
  mild: [
    'light layer szn 🍂',
    'jacket-on-the-shoulders weather.',
    'crisp air, crispier fits.',
  ],
  cold: [
    'layer up, look expensive 🧥',
    'cold outside, warm fit inside.',
    'knitwear is calling.',
  ],
  rain: [
    'Rain check? Literally. ☔',
    'waterproof the fit, not the vibe.',
    'moody weather, main character energy.',
  ],
} as const;

export const EMPTY_CLOSET = 'Your closet is looking a little shy. Add your first slay. 👗';
export const EMPTY_RECEIPTS = 'Your fit receipts are empty. Time to make some history. ✨';
export const EMPTY_FAVORITES = 'No favorites yet. When a fit hits different, heart it. 🤍';
export const EMPTY_SEARCH = 'Nothing matches that search. Plot twist pending. 👀';
export const SMALL_CLOSET = "Working with what we've got. Challenge accepted. 🫡";
export const BLACK_STREAK = 'Another black fit? Honestly… respect the commitment. 🖤';
export const COMEBACK_ITEM = (name: string) => `${name} deserves a comeback. ✨`;
export const BLACK_INSIGHT = 'Apparently, black has a permanent reservation in your wardrobe. 🖤';

export const TAGGING_LOADING = [
  'Reading the fabric… 🧵',
  'Judging (lovingly)…',
  'Tagging your piece…',
] as const;
