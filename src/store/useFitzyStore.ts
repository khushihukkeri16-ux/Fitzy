/**
 * FITZY app store — single source of truth for closet, outfits & preferences.
 *
 * Demo mode (no Supabase env): persisted locally via AsyncStorage and seeded
 * with the clearly-flagged starter wardrobe so the app is explorable.
 *
 * Production mode: the same store shape is hydrated from Supabase by the
 * closet/outfits services; seed data is never injected.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { SEED_CLOSET } from '@/services/demo/seedCloset';
import { isSupabaseConfigured } from '@/services/supabase';
import type { ClothingItem, Outfit, StylePreferences } from '@/types';

export const DEFAULT_PREFERENCES: StylePreferences = {
  favoriteColors: [],
  preferredVibes: [],
  preferredFit: 'balanced',
  loves: '',
  avoids: '',
};

interface FitzyState {
  hydrated: boolean;
  seeded: boolean;
  closet: ClothingItem[];
  outfits: Outfit[];
  preferences: StylePreferences;

  // closet
  addItem: (item: ClothingItem) => void;
  updateItem: (id: string, patch: Partial<ClothingItem>) => void;
  removeItem: (id: string) => void;

  // outfits
  saveOutfit: (outfit: Outfit) => void;
  deleteOutfit: (id: string) => void;
  toggleFavorite: (id: string) => void;
  rateOutfit: (id: string, rating: number) => void;
  rewearOutfit: (id: string) => Outfit | null;

  // preferences
  setPreferences: (patch: Partial<StylePreferences>) => void;

  // internal
  markHydrated: () => void;
  ensureSeed: () => void;
}

export const useFitzyStore = create<FitzyState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      seeded: false,
      closet: [],
      outfits: [],
      preferences: DEFAULT_PREFERENCES,

      addItem: (item) => set((s) => ({ closet: [item, ...s.closet] })),

      updateItem: (id, patch) =>
        set((s) => ({
          closet: s.closet.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({
          closet: s.closet.filter((i) => i.id !== id),
          outfits: s.outfits.filter((o) => !o.itemIds.includes(id)),
        })),

      saveOutfit: (outfit) =>
        set((s) => ({
          outfits: [outfit, ...s.outfits],
          closet: s.closet.map((i) =>
            outfit.itemIds.includes(i.id) ? { ...i, wearCount: i.wearCount + 1 } : i,
          ),
        })),

      deleteOutfit: (id) => set((s) => ({ outfits: s.outfits.filter((o) => o.id !== id) })),

      toggleFavorite: (id) =>
        set((s) => ({
          outfits: s.outfits.map((o) => (o.id === id ? { ...o, favorite: !o.favorite } : o)),
        })),

      rateOutfit: (id, rating) =>
        set((s) => ({
          outfits: s.outfits.map((o) => (o.id === id ? { ...o, rating } : o)),
        })),

      rewearOutfit: (id) => {
        const src = get().outfits.find((o) => o.id === id);
        if (!src) return null;
        const copy: Outfit = {
          ...src,
          id: `outfit-${Date.now()}`,
          createdAt: new Date().toISOString(),
          favorite: false,
          rating: null,
        };
        get().saveOutfit(copy);
        return copy;
      },

      setPreferences: (patch) =>
        set((s) => ({ preferences: { ...s.preferences, ...patch } })),

      markHydrated: () => set({ hydrated: true }),

      ensureSeed: () => {
        const s = get();
        // Seed only in demo mode, only once, and only into an empty closet.
        if (!isSupabaseConfigured && !s.seeded && s.closet.length === 0) {
          set({ closet: SEED_CLOSET, seeded: true });
        } else if (!s.seeded) {
          set({ seeded: true });
        }
      },
    }),
    {
      name: 'fitzy-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        seeded: s.seeded,
        closet: s.closet,
        outfits: s.outfits,
        preferences: s.preferences,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
        state?.ensureSeed();
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors / derived data
// ---------------------------------------------------------------------------

export function itemsById(closet: ClothingItem[], ids: string[]): ClothingItem[] {
  const map = new Map(closet.map((i) => [i.id, i]));
  return ids.map((id) => map.get(id)).filter((i): i is ClothingItem => Boolean(i));
}

export interface ColorStat {
  color: string;
  count: number;
  pct: number;
}

export function colorStats(closet: ClothingItem[]): ColorStat[] {
  const counts = new Map<string, number>();
  for (const i of closet) counts.set(i.color, (counts.get(i.color) ?? 0) + 1);
  const total = closet.length || 1;
  return [...counts.entries()]
    .map(([color, count]) => ({ color, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}
