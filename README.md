# FITZY ✨

**Your closet. Your vibe. Your fit.**

FITZY is an AI-powered personal outfit planner and digital wardrobe assistant with a
premium, Gen-Z fashion identity. Upload your closet, tell FITZY the occasion and the
energy, and it cooks a fit from clothes you actually own — tuned to today's weather
and your personal style.

> “I don't know what to wear.” → “FITZY has a fit for you.”

---

## ✨ Features

| Screen | What it does |
| --- | --- |
| **Home** | Live weather, occasion + vibe pickers, **✨ COOK MY FIT**, 🎲 Surprise Me |
| **The Fitzy Closet 👗** | Upload/camera, AI tagging, search, category filters, edit & delete |
| **FITZY COOKED 👩‍🍳✨** | Outfit grid, explanation, styling tips, playful *vibe match* indicator |
| **Refinement** | 🔥 warmer · 🧊 cooler · 💼 professional · 👟 casual · 🎀 cuter · 🌈 color · 🖤 edgier · “Nah, cook again 🔄” |
| **Fit Receipts 🧾** | Outfit history with date, weather, rating, favorite, wear-again, delete |
| **Hall of Fame 🏆** | Favorite fits, reuse, cook similar |
| **Style Profile** | Favorite colors, go-to vibes, preferred fit, loves & hard passes + AI summary |
| **Style Report ✨** | Color analytics, closet breakdown, heavy rotation, comeback candidates |

## 🧠 Recommendation pipeline

```
Weather → filter weather-inappropriate clothing → Occasion (formality gates)
→ Vibe/style scoring → User preferences → Available closet items
→ AI outfit generation → Compatibility check → Final recommendation
```

- **Production:** the `ai-stylist` Supabase Edge Function calls OpenAI with the
  closet metadata; the client re-validates every returned item id against the
  closet (never recommends clothes you don't own — extras are labeled optional).
- **Offline/demo:** a deterministic local stylist engine (`src/services/stylist.ts`)
  implements the same pipeline so the app always works.

## 🛠 Tech stack

- **React Native + Expo (SDK 57) + TypeScript + Expo Router**
- **Supabase** — Auth, Postgres (with Row Level Security), Storage, Edge Functions
- **OpenAI** — clothing tagging & outfit generation (key lives server-side only)
- **Open-Meteo** — keyless weather + geocoding (safe to call from the client)
- zustand + AsyncStorage, Reanimated, expo-image-picker, expo-location

## 🚀 Getting started

```bash
npm install
npx expo start        # then press w (web), a (Android), i (iOS)
```

With no configuration the app runs in **demo mode**: a clearly-flagged starter
wardrobe is seeded locally (see `src/services/demo/seedCloset.ts`) and the local
stylist engine powers recommendations. No fake API responses are used — demo
data is fully separated from production paths.

### Connect Supabase (production mode)

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql)
   in the SQL editor — it creates `users`, `clothes`, `outfits`, `outfit_items`,
   `favorites`, `style_preferences`, the private `wardrobe` storage bucket, and
   all RLS policies.
2. Copy `.env.example` → `.env` and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Deploy the edge functions and set the OpenAI secret:
   ```bash
   supabase functions deploy ai-tag-item ai-stylist
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

### 🔐 Security model

- The client bundle contains **only** the Supabase URL + anon key.
- The **OpenAI key** and **service-role key** never touch the React Native app —
  they exist only as Supabase Edge Function secrets.
- Row Level Security guarantees users can only access their own wardrobe,
  outfits, favorites and preferences; storage policies scope images to
  `wardrobe/{user_id}/…`.
- Weather uses Open-Meteo, which requires no API key at all.

## 📁 Project structure

```
src/
  app/            # Expo Router screens (tabs, cook, add-item, item/[id], …)
  components/     # Reusable UI (cards, chips, hearts, forms, …)
  constants/      # Theme, microcopy, option metadata
  hooks/          # useWeather, …
  services/       # supabase / ai / weather / stylist — no UI imports here
    demo/         # DEMO-ONLY seed wardrobe (never used in production mode)
  store/          # zustand store + selectors
  types/          # Shared TypeScript domain types
supabase/
  schema.sql      # Tables + RLS + storage policies
  functions/      # Edge functions holding the OpenAI key
```
