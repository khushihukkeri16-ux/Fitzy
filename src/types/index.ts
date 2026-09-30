/**
 * FITZY — core domain types.
 * Shared across services, store and UI. Keep this file dependency-free.
 */

export type Category =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory'
  | 'other';

export type Season = 'summer' | 'winter' | 'monsoon' | 'all-season';

export type Formality = 'casual' | 'smart-casual' | 'formal' | 'athletic';

export type Fit = 'oversized' | 'fitted' | 'balanced';

export type OccasionId =
  | 'campus'
  | 'hangout'
  | 'date'
  | 'office'
  | 'party'
  | 'travel'
  | 'wedding'
  | 'gym';

export type VibeId =
  | 'clean'
  | 'street'
  | 'soft'
  | 'classy'
  | 'minimal'
  | 'trendy'
  | 'colorpop'
  | 'comfy';

export type Modifier =
  | 'warmer'
  | 'cooler'
  | 'professional'
  | 'casual'
  | 'cuter'
  | 'color'
  | 'edgier';

export interface ClothingItem {
  id: string;
  /** Set when synced with Supabase; local/demo items omit it. */
  userId?: string;
  name: string;
  category: Category;
  color: string;
  secondaryColors: string[];
  pattern: string;
  material: string;
  season: Season;
  /** Free-form style descriptors, e.g. ['casual', 'street']. */
  styles: string[];
  formality: Formality;
  tags: string[];
  /**
   * Either a device/file/data URI, or a `seed:<key>` reference that resolves
   * to a bundled demo asset (see services/demo/seedCloset.ts).
   */
  imageUri: string;
  wearCount: number;
  createdAt: string;
  /** True only for the demo-mode starter wardrobe. Never true in production. */
  isSeed?: boolean;
}

export interface AITagResult {
  name: string;
  category: Category;
  color: string;
  secondaryColors: string[];
  pattern: string;
  material: string;
  season: Season;
  styles: string[];
  formality: Formality;
  tags: string[];
  /** 0..1 — how confident the tagger is. Low confidence → user should review. */
  confidence: number;
}

export interface WeatherInfo {
  tempC: number;
  feelsLikeC: number;
  condition: string;
  emoji: string;
  city: string;
  isRaining: boolean;
  code: number;
  /** True when live weather could not be fetched and a fallback is shown. */
  isFallback: boolean;
}

export interface WeatherSnapshot {
  tempC: number;
  condition: string;
  emoji: string;
  city: string;
}

export interface Outfit {
  id: string;
  createdAt: string;
  itemIds: string[];
  occasion: OccasionId;
  vibe: VibeId;
  weather: WeatherSnapshot;
  explanation: string;
  tips: string[];
  /** Playful product indicator (88–99). Not a scientific score. */
  vibeMatch: number;
  rating: number | null;
  favorite: boolean;
  source: 'ai' | 'stylist' | 'surprise';
}

export interface OutfitDraft {
  itemIds: string[];
  explanation: string;
  tips: string[];
  vibeMatch: number;
  source: Outfit['source'];
  /** Optional AI suggestions for pieces the user does not own. */
  optionalAdditions?: string[];
}

export interface StylePreferences {
  favoriteColors: string[];
  preferredVibes: VibeId[];
  preferredFit: Fit;
  loves: string;
  avoids: string;
}

export interface CookContext {
  weather: WeatherInfo;
  occasion: OccasionId;
  vibe: VibeId;
  preferences: StylePreferences;
  modifiers: Modifier[];
  /** Signatures of previously generated combos to avoid repeating. */
  exclude: string[];
  surprise?: boolean;
}
