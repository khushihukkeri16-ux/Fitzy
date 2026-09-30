/**
 * DEMO-MODE ONLY. ------------------------------------------------------------
 * This starter wardrobe exists so FITZY is explorable before you connect
 * Supabase. Every item is flagged `isSeed: true` and lives only in local
 * storage — nothing here is ever written to the production database.
 * When Supabase auth is configured, the real closet comes from `clothes`.
 * ---------------------------------------------------------------------------
 */
import type { ClothingItem } from '@/types';

/** Bundled demo assets, referenced by `seed:<key>` image URIs. */
export const SEED_IMAGES: Record<string, number> = {
  'tee-white': require('@/assets/closet/tee-white.jpg'),
  'trousers-black': require('@/assets/closet/trousers-black.jpg'),
  'sneakers-white': require('@/assets/closet/sneakers-white.jpg'),
  'jacket-denim': require('@/assets/closet/jacket-denim.jpg'),
  'sweater-beige': require('@/assets/closet/sweater-beige.jpg'),
  'dress-black': require('@/assets/closet/dress-black.jpg'),
  'jeans-blue': require('@/assets/closet/jeans-blue.jpg'),
  'necklace-gold': require('@/assets/closet/necklace-gold.jpg'),
  'jacket-leather': require('@/assets/closet/jacket-leather.jpg'),
  'dress-floral': require('@/assets/closet/dress-floral.jpg'),
};

export function resolveImage(uri: string): number | { uri: string } {
  if (uri.startsWith('seed:')) {
    const key = uri.slice(5);
    return SEED_IMAGES[key] ?? SEED_IMAGES['tee-white'];
  }
  return { uri };
}

const base = {
  secondaryColors: [] as string[],
  pattern: 'solid',
  wearCount: 0,
  isSeed: true,
};

const day = 24 * 60 * 60 * 1000;
const ago = (d: number) => new Date(Date.now() - d * day).toISOString();

export const SEED_CLOSET: ClothingItem[] = [
  {
    ...base,
    id: 'seed-tee-white',
    name: 'White oversized tee',
    category: 'top',
    color: 'white',
    material: 'cotton',
    season: 'all-season',
    styles: ['casual', 'minimal', 'street'],
    formality: 'casual',
    tags: ['oversized', 'staple', 'crewneck'],
    imageUri: 'seed:tee-white',
    wearCount: 9,
    createdAt: ago(90),
  },
  {
    ...base,
    id: 'seed-trousers-black',
    name: 'Black tailored trousers',
    category: 'bottom',
    color: 'black',
    material: 'polyester blend',
    season: 'all-season',
    styles: ['classy', 'minimal'],
    formality: 'smart-casual',
    tags: ['tailored', 'straight-leg'],
    imageUri: 'seed:trousers-black',
    wearCount: 7,
    createdAt: ago(84),
  },
  {
    ...base,
    id: 'seed-sneakers-white',
    name: 'White leather sneakers',
    category: 'shoes',
    color: 'white',
    material: 'leather',
    season: 'all-season',
    styles: ['casual', 'minimal', 'street'],
    formality: 'casual',
    tags: ['low-top', 'everyday'],
    imageUri: 'seed:sneakers-white',
    wearCount: 12,
    createdAt: ago(120),
  },
  {
    ...base,
    id: 'seed-jacket-denim',
    name: 'Vintage denim jacket',
    category: 'outerwear',
    color: 'denim',
    secondaryColors: ['blue'],
    material: 'denim',
    season: 'all-season',
    styles: ['street', 'casual', 'vintage'],
    formality: 'casual',
    tags: ['trucker', 'layering'],
    imageUri: 'seed:jacket-denim',
    wearCount: 4,
    createdAt: ago(60),
  },
  {
    ...base,
    id: 'seed-sweater-beige',
    name: 'Beige knit sweater',
    category: 'top',
    color: 'beige',
    material: 'wool blend',
    season: 'winter',
    styles: ['soft', 'comfy', 'minimal'],
    formality: 'smart-casual',
    tags: ['chunky-knit', 'cozy'],
    imageUri: 'seed:sweater-beige',
    wearCount: 3,
    createdAt: ago(45),
  },
  {
    ...base,
    id: 'seed-dress-black',
    name: 'Black satin slip dress',
    category: 'dress',
    color: 'black',
    material: 'satin',
    season: 'summer',
    styles: ['classy', 'trendy'],
    formality: 'formal',
    tags: ['slip-dress', 'evening'],
    imageUri: 'seed:dress-black',
    wearCount: 2,
    createdAt: ago(30),
  },
  {
    ...base,
    id: 'seed-jeans-blue',
    name: 'Wide-leg blue jeans',
    category: 'bottom',
    color: 'blue',
    secondaryColors: ['denim'],
    material: 'denim',
    season: 'all-season',
    styles: ['street', 'casual', 'trendy'],
    formality: 'casual',
    tags: ['wide-leg', 'high-waist'],
    imageUri: 'seed:jeans-blue',
    wearCount: 8,
    createdAt: ago(75),
  },
  {
    ...base,
    id: 'seed-necklace-gold',
    name: 'Layered gold necklace',
    category: 'accessory',
    color: 'gold',
    material: 'metal',
    season: 'all-season',
    styles: ['classy', 'soft', 'trendy'],
    formality: 'smart-casual',
    tags: ['layered', 'dainty'],
    imageUri: 'seed:necklace-gold',
    wearCount: 5,
    createdAt: ago(50),
  },
  {
    ...base,
    id: 'seed-jacket-leather',
    name: 'Black leather jacket',
    category: 'outerwear',
    color: 'black',
    material: 'leather',
    season: 'winter',
    styles: ['edgy', 'street', 'trendy'],
    formality: 'casual',
    tags: ['biker', 'statement'],
    imageUri: 'seed:jacket-leather',
    wearCount: 1,
    createdAt: ago(20),
  },
  {
    ...base,
    id: 'seed-dress-floral',
    name: 'Floral midi dress',
    category: 'dress',
    color: 'cream',
    secondaryColors: ['blush', 'pink'],
    pattern: 'floral',
    material: 'viscose',
    season: 'summer',
    styles: ['soft', 'romantic'],
    formality: 'smart-casual',
    tags: ['midi', 'flowy'],
    imageUri: 'seed:dress-floral',
    wearCount: 2,
    createdAt: ago(15),
  },
];
