import type { Category, Formality, Modifier, OccasionId, Season, VibeId } from '@/types';

export interface OptionMeta<T extends string> {
  id: T;
  label: string;
  emoji: string;
}

export const OCCASIONS: OptionMeta<OccasionId>[] = [
  { id: 'campus', label: 'Campus', emoji: '🎓' },
  { id: 'hangout', label: 'Hangout', emoji: '☕' },
  { id: 'date', label: 'Date', emoji: '❤️' },
  { id: 'office', label: 'Office', emoji: '💼' },
  { id: 'party', label: 'Party', emoji: '💃' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'gym', label: 'Gym', emoji: '🏃' },
];

export const VIBES: OptionMeta<VibeId>[] = [
  { id: 'clean', label: 'Clean', emoji: '✨' },
  { id: 'street', label: 'Street', emoji: '🖤' },
  { id: 'soft', label: 'Soft', emoji: '🎀' },
  { id: 'classy', label: 'Classy', emoji: '💎' },
  { id: 'minimal', label: 'Minimal', emoji: '🤍' },
  { id: 'trendy', label: 'Trendy', emoji: '🔥' },
  { id: 'colorpop', label: 'Color Pop', emoji: '🌈' },
  { id: 'comfy', label: 'Comfy', emoji: '😌' },
];

export const CATEGORIES: OptionMeta<Category>[] = [
  { id: 'top', label: 'Tops', emoji: '👕' },
  { id: 'bottom', label: 'Bottoms', emoji: '👖' },
  { id: 'dress', label: 'Dresses', emoji: '👗' },
  { id: 'outerwear', label: 'Outerwear', emoji: '🧥' },
  { id: 'shoes', label: 'Shoes', emoji: '👟' },
  { id: 'accessory', label: 'Accessories', emoji: '💍' },
  { id: 'other', label: 'Other', emoji: '🧺' },
];

export const CATEGORY_SINGULAR: Record<Category, string> = {
  top: 'Top',
  bottom: 'Bottom',
  dress: 'Dress',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  accessory: 'Accessory',
  other: 'Other',
};

export const SEASONS: OptionMeta<Season>[] = [
  { id: 'summer', label: 'Summer', emoji: '☀️' },
  { id: 'winter', label: 'Winter', emoji: '❄️' },
  { id: 'monsoon', label: 'Monsoon', emoji: '🌧️' },
  { id: 'all-season', label: 'All-season', emoji: '🌤️' },
];

export const FORMALITIES: OptionMeta<Formality>[] = [
  { id: 'casual', label: 'Casual', emoji: '😌' },
  { id: 'smart-casual', label: 'Smart casual', emoji: '🙂' },
  { id: 'formal', label: 'Formal', emoji: '🤵' },
  { id: 'athletic', label: 'Athletic', emoji: '🏃' },
];

export const MODIFIERS: (OptionMeta<Modifier> & { hint: string })[] = [
  { id: 'warmer', label: 'Make it warmer', emoji: '🔥', hint: 'layers on' },
  { id: 'cooler', label: 'Keep me cool', emoji: '🧊', hint: 'light + breathable' },
  { id: 'professional', label: 'Make it professional', emoji: '💼', hint: 'polished up' },
  { id: 'casual', label: 'More casual', emoji: '👟', hint: 'relaxed' },
  { id: 'cuter', label: 'Make it cuter', emoji: '🎀', hint: 'soft energy' },
  { id: 'color', label: 'Add some color', emoji: '🌈', hint: 'less neutral' },
  { id: 'edgier', label: 'Make it edgier', emoji: '🖤', hint: 'darker, bolder' },
];

export const COLOR_OPTIONS = [
  'black',
  'white',
  'cream',
  'beige',
  'grey',
  'brown',
  'blue',
  'navy',
  'denim',
  'green',
  'olive',
  'pink',
  'blush',
  'red',
  'lavender',
  'purple',
  'yellow',
  'orange',
  'gold',
  'silver',
] as const;

/** Approximate swatches for known color names (UI only). */
export const COLOR_SWATCHES: Record<string, string> = {
  black: '#23201C',
  white: '#F7F5F1',
  cream: '#F0E7D8',
  beige: '#D9C9AE',
  grey: '#9E9A94',
  brown: '#7A5C43',
  blue: '#5B84B8',
  navy: '#2E3E5C',
  denim: '#6E8DA8',
  green: '#5E7D5A',
  olive: '#7A7A50',
  pink: '#E5A9B8',
  blush: '#E8C3BB',
  red: '#B8443C',
  lavender: '#A99BC9',
  purple: '#7A5C9E',
  yellow: '#E0B84C',
  orange: '#D98443',
  gold: '#C9A468',
  silver: '#B8B8BC',
  floral: '#DFA69B',
  multi: '#C9A468',
};

export const NEUTRAL_COLORS = new Set([
  'black',
  'white',
  'cream',
  'beige',
  'grey',
  'navy',
  'brown',
]);

export const STYLE_KEYWORDS = [
  'casual',
  'street',
  'minimal',
  'classy',
  'soft',
  'sporty',
  'edgy',
  'preppy',
  'vintage',
  'romantic',
  'comfy',
  'trendy',
] as const;

export function occasionMeta(id: OccasionId) {
  return OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[0];
}
export function vibeMeta(id: VibeId) {
  return VIBES.find((v) => v.id === id) ?? VIBES[0];
}
export function categoryMeta(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[6];
}
