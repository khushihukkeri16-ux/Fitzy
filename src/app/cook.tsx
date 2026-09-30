import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui/Chip';
import { HeartButton } from '@/components/ui/HeartButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Stars } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import {
  COOK_LOADING,
  RESULT_SUBTITLES,
  SAVE_SUCCESS,
  SURPRISE_LOADING,
  pick,
} from '@/constants/copy';
import {
  MODIFIERS,
  categoryMeta,
  occasionMeta,
  vibeMeta,
} from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { generateOutfit, type GeneratedOutfit } from '@/services/ai';
import { resolveImage } from '@/services/demo/seedCloset';
import { itemsById, useFitzyStore } from '@/store/useFitzyStore';
import type { Modifier, OccasionId, Outfit, VibeId, WeatherInfo } from '@/types';

type Phase = 'loading' | 'result' | 'failed';

export default function CookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    occasion: OccasionId;
    vibe: VibeId;
    tempC: string;
    condition: string;
    emoji: string;
    city: string;
    raining: string;
    surprise?: string;
  }>();

  const closet = useFitzyStore((s) => s.closet);
  const preferences = useFitzyStore((s) => s.preferences);
  const saveOutfitToStore = useFitzyStore((s) => s.saveOutfit);
  const toggleFavorite = useFitzyStore((s) => s.toggleFavorite);
  const rateOutfit = useFitzyStore((s) => s.rateOutfit);
  const outfits = useFitzyStore((s) => s.outfits);

  const surprise = params.surprise === '1';
  const weather: WeatherInfo = useMemo(
    () => ({
      tempC: Number(params.tempC ?? 26),
      feelsLikeC: Number(params.tempC ?? 26),
      condition: params.condition ?? 'Partly cloudy',
      emoji: params.emoji ?? '⛅',
      city: params.city ?? 'Your city',
      isRaining: params.raining === '1',
      code: 2,
      isFallback: false,
    }),
    [params.tempC, params.condition, params.emoji, params.city, params.raining],
  );

  const [phase, setPhase] = useState<Phase>('loading');
  const [result, setResult] = useState<GeneratedOutfit | null>(null);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const excludeRef = useRef<string[]>([]);
  const [loadingLine, setLoadingLine] = useState<string>(
    surprise ? SURPRISE_LOADING[0] : COOK_LOADING[0],
  );
  const subtitle = useMemo(() => pick(RESULT_SUBTITLES), []);

  const savedOutfit = savedId ? outfits.find((o) => o.id === savedId) ?? null : null;

  // Rotating loading copy
  useEffect(() => {
    if (phase !== 'loading') return;
    const lines = surprise ? SURPRISE_LOADING : COOK_LOADING;
    const t = setInterval(() => setLoadingLine(pick(lines)), 1400);
    return () => clearInterval(t);
  }, [phase, surprise]);

  const cook = useCallback(
    async (mods: Modifier[], excludeCurrent: boolean) => {
      setPhase('loading');
      setSavedId(null);
      setSaveMessage(null);
      if (excludeCurrent && result) excludeRef.current = [...excludeRef.current, result.signature];

      const started = Date.now();
      const generated = await generateOutfit(closet, {
        weather,
        occasion: (params.occasion as OccasionId) ?? 'hangout',
        vibe: (params.vibe as VibeId) ?? 'clean',
        preferences,
        modifiers: mods,
        exclude: excludeRef.current,
        surprise,
      });
      // Let the loading moment breathe (min 1.4s) — reveal feels intentional.
      const wait = Math.max(0, 1400 - (Date.now() - started));
      setTimeout(() => {
        if (generated) {
          setResult(generated);
          setPhase('result');
        } else {
          setPhase('failed');
        }
      }, wait);
    },
    [closet, weather, params.occasion, params.vibe, preferences, surprise, result],
  );

  useEffect(() => {
    cook([], false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyModifier = (mod: Modifier) => {
    const next = modifiers.includes(mod)
      ? modifiers.filter((m) => m !== mod)
      : [...modifiers.filter((m) => !conflicts(mod).includes(m)), mod];
    setModifiers(next);
    cook(next, true);
  };

  const saveFit = () => {
    if (!result || savedId) return;
    const outfit: Outfit = {
      id: `outfit-${Date.now()}`,
      createdAt: new Date().toISOString(),
      itemIds: result.itemIds,
      occasion: (params.occasion as OccasionId) ?? 'hangout',
      vibe: (params.vibe as VibeId) ?? 'clean',
      weather: {
        tempC: weather.tempC,
        condition: weather.condition,
        emoji: weather.emoji,
        city: weather.city,
      },
      explanation: result.explanation,
      tips: result.tips,
      vibeMatch: result.vibeMatch,
      rating: null,
      favorite: false,
      source: result.source,
    };
    saveOutfitToStore(outfit);
    setSavedId(outfit.id);
    setSaveMessage(pick(SAVE_SUCCESS));
  };

  const pieces = result ? itemsById(closet, result.itemIds) : [];
  const occ = occasionMeta((params.occasion as OccasionId) ?? 'hangout');
  const vibe = vibeMeta((params.vibe as VibeId) ?? 'clean');

  // ---- Loading state ------------------------------------------------------
  if (phase === 'loading') {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <CookingAnimation />
        <Animated.View key={loadingLine} entering={FadeIn.duration(300)}>
          <Text style={styles.loadingLine}>{loadingLine}</Text>
        </Animated.View>
        <Text variant="caption" style={{ marginTop: spacing.sm }}>
          {occ.emoji} {occ.label} · {vibe.emoji} {vibe.label} · {weather.emoji} {weather.tempC}°
        </Text>
      </View>
    );
  }

  // ---- Failure state ------------------------------------------------------
  if (phase === 'failed' || !result) {
    return (
      <View style={[styles.loadingRoot, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 44 }}>🫥</Text>
        <Text variant="title" style={{ textAlign: 'center', marginTop: spacing.md }}>
          The closet said “not today”
        </Text>
        <Text variant="body" style={styles.failText}>
          We couldn't build a full fit from your current pieces. Add a few more slays and try
          again.
        </Text>
        <PressableScale style={styles.darkButton} onPress={() => router.replace('/closet')}>
          <Text style={styles.darkButtonText}>👗 Open my closet</Text>
        </PressableScale>
        <PressableScale style={styles.ghostButton} onPress={() => router.back()}>
          <Text style={styles.ghostButtonText}>← Back</Text>
        </PressableScale>
      </View>
    );
  }

  // ---- Result -------------------------------------------------------------
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn} haptic={false}>
          <Text style={{ fontSize: 16 }}>←</Text>
        </PressableScale>
        <Text variant="caption">
          {weather.emoji} {weather.tempC}° {weather.city} · {occ.emoji} {occ.label} · {vibe.emoji}{' '}
          {vibe.label}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(450).springify().damping(16)}>
        <Text style={styles.cooked}>FITZY COOKED 👩‍🍳✨</Text>
        <Text style={styles.subtitle}>“{subtitle}”</Text>
      </Animated.View>

      {/* Vibe match */}
      <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.matchRow}>
        <View style={styles.matchPill}>
          <Text style={styles.matchText}>{result.vibeMatch}% vibe match ✨</Text>
        </View>
        {result.source === 'ai' ? (
          <Text variant="caption">styled by AI</Text>
        ) : (
          <Text variant="caption">styled by the FITZY engine</Text>
        )}
      </Animated.View>

      {/* Outfit grid */}
      <View style={styles.grid}>
        {pieces.map((item, i) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(180 + i * 90).duration(420).springify().damping(17)}
            style={[styles.gridItem, pieces.length === 3 && i === 2 ? styles.gridItemWide : null]}
          >
            <PressableScale
              haptic={false}
              scaleTo={0.97}
              onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
              style={styles.pieceCard}
            >
              <Image
                source={resolveImage(item.imageUri)}
                style={styles.pieceImage}
                contentFit="cover"
                transition={300}
                accessibilityLabel={item.name}
              />
              <View style={styles.pieceMeta}>
                <Text numberOfLines={1} style={styles.pieceName}>
                  {item.name}
                </Text>
                <Text variant="caption">{categoryMeta(item.category).label.replace(/s$/, '')}</Text>
              </View>
            </PressableScale>
          </Animated.View>
        ))}
      </View>

      {/* Explanation */}
      <Animated.View
        entering={FadeInDown.delay(320).duration(420)}
        style={[styles.noteCard, { backgroundColor: palette.cream }]}
      >
        <Text variant="heading" style={{ marginBottom: 6 }}>
          Why this works
        </Text>
        <Text variant="body" style={{ color: palette.inkSoft }}>
          {result.explanation}
        </Text>
        {result.optionalAdditions?.length ? (
          <Text variant="caption" style={{ marginTop: spacing.sm }}>
            Optional additions (not in your closet): {result.optionalAdditions.join(', ')}
          </Text>
        ) : null}
      </Animated.View>

      {/* Tips */}
      {result.tips.length > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(380).duration(420)}
          style={[styles.noteCard, { backgroundColor: palette.lavender }]}
        >
          <Text variant="heading" style={{ marginBottom: 6 }}>
            Styling tips
          </Text>
          {result.tips.map((tip) => (
            <Text key={tip} variant="body" style={styles.tip}>
              •  {tip}
            </Text>
          ))}
        </Animated.View>
      ) : null}

      {/* Modifiers */}
      <Animated.View entering={FadeInDown.delay(430).duration(420)}>
        <Text variant="heading" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
          Tweak the recipe
        </Text>
        <View style={styles.modWrap}>
          {MODIFIERS.map((m) => (
            <Chip
              key={m.id}
              small
              label={m.label}
              emoji={m.emoji}
              selected={modifiers.includes(m.id)}
              onPress={() => applyModifier(m.id)}
            />
          ))}
          <Chip small label="Nah, cook again" emoji="🔄" onPress={() => cook(modifiers, true)} />
        </View>
      </Animated.View>

      {/* Save / rate */}
      <Animated.View entering={FadeInDown.delay(480).duration(420)} style={styles.saveArea}>
        {savedOutfit ? (
          <View style={styles.savedCard}>
            <Text style={styles.savedTitle}>{saveMessage}</Text>
            <View style={styles.savedRow}>
              <Stars
                value={savedOutfit.rating}
                onChange={(n) => rateOutfit(savedOutfit.id, n)}
              />
              <HeartButton
                active={savedOutfit.favorite}
                onToggle={() => toggleFavorite(savedOutfit.id)}
              />
            </View>
            <PressableScale style={styles.ghostButton} onPress={() => router.replace('/receipts')}>
              <Text style={styles.ghostButtonText}>View fit receipts 🧾</Text>
            </PressableScale>
          </View>
        ) : (
          <PressableScale style={styles.darkButton} onPress={saveFit}>
            <Text style={styles.darkButtonText}>🧾 Save this fit</Text>
          </PressableScale>
        )}
      </Animated.View>
    </ScrollView>
  );
}

function conflicts(mod: Modifier): Modifier[] {
  switch (mod) {
    case 'warmer':
      return ['cooler'];
    case 'cooler':
      return ['warmer'];
    case 'professional':
      return ['casual'];
    case 'casual':
      return ['professional'];
    case 'cuter':
      return ['edgier'];
    case 'edgier':
      return ['cuter'];
    default:
      return [];
  }
}

function CookingAnimation() {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotate.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(8, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700 }),
        withTiming(0.96, { duration: 700 }),
      ),
      -1,
      true,
    );
  }, [rotate, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cookBadge, style]}>
      <Text style={{ fontSize: 46 }}>👩‍🍳</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  loadingRoot: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  cookBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  loadingLine: {
    fontFamily: fonts.displayBold,
    fontSize: 21,
    color: palette.ink,
    textAlign: 'center',
  },
  failText: {
    textAlign: 'center',
    color: palette.inkSoft,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 300,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  cooked: {
    fontFamily: fonts.displayBlack,
    fontSize: 30,
    color: palette.ink,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14.5,
    color: palette.inkSoft,
    fontStyle: 'italic',
    marginTop: 4,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  matchPill: {
    backgroundColor: palette.blush,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  matchText: { fontFamily: fonts.bodyExtra, fontSize: 13, color: palette.ink },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  gridItem: { width: '48.4%' },
  gridItemWide: { width: '100%' },
  pieceCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  pieceImage: { width: '100%', aspectRatio: 1, backgroundColor: palette.cream },
  pieceMeta: { padding: spacing.sm + 2, gap: 1 },
  pieceName: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: palette.ink },
  noteCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  tip: { color: palette.inkSoft, marginTop: 3 },
  modWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  saveArea: { marginTop: spacing.xl },
  darkButton: {
    backgroundColor: palette.ink,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadows.floating,
  },
  darkButtonText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 15.5,
    color: palette.surfaceSoft,
    letterSpacing: 0.4,
  },
  ghostButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  ghostButtonText: { fontFamily: fonts.bodyBold, fontSize: 14, color: palette.inkSoft },
  savedCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  savedTitle: { fontFamily: fonts.displayBold, fontSize: 19, color: palette.ink },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
});
