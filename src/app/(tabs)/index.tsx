import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { WeatherCard } from '@/components/WeatherCard';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { Screen } from '@/components/ui/Screen';
import { GREETINGS, SMALL_CLOSET, pick } from '@/constants/copy';
import { OCCASIONS, VIBES } from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { useWeather } from '@/hooks/useWeather';
import { useFitzyStore } from '@/store/useFitzyStore';
import type { OccasionId, VibeId } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { weather, loading, refresh, setCity } = useWeather();
  const closet = useFitzyStore((s) => s.closet);

  const greeting = useMemo(() => pick(GREETINGS), []);
  const [occasion, setOccasion] = useState<OccasionId | null>(null);
  const [vibe, setVibe] = useState<VibeId | null>(null);

  const ready = Boolean(occasion && vibe && weather);

  const cook = (surprise = false) => {
    if (!weather) return;
    const params: Record<string, string> = {
      occasion: occasion ?? 'hangout',
      vibe: vibe ?? 'clean',
      tempC: String(weather.tempC),
      condition: weather.condition,
      emoji: weather.emoji,
      city: weather.city,
      raining: weather.isRaining ? '1' : '0',
    };
    if (surprise) params.surprise = '1';
    router.push({ pathname: '/cook', params });
  };

  return (
    <Screen>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={styles.headerRow}>
          <Text style={styles.wordmark}>FITZY</Text>
          <Text style={styles.sparkle}>✨</Text>
        </View>
        <Text style={styles.greeting}>{greeting}</Text>
      </Animated.View>

      {/* Weather */}
      <View style={{ marginTop: spacing.lg }}>
        <WeatherCard
          weather={weather}
          loading={loading}
          onRefresh={refresh}
          onSetCity={setCity}
        />
      </View>

      {/* Occasion */}
      <Animated.View entering={FadeInDown.delay(140).duration(420)} style={styles.section}>
        <Text variant="title" style={styles.question}>
          What's the occasion?
        </Text>
        <View style={styles.chipWrap}>
          {OCCASIONS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              emoji={o.emoji}
              selected={occasion === o.id}
              onPress={() => setOccasion(o.id)}
            />
          ))}
        </View>
      </Animated.View>

      {/* Vibe */}
      <Animated.View entering={FadeInDown.delay(220).duration(420)} style={styles.section}>
        <Text variant="title" style={styles.question}>
          What's the energy?
        </Text>
        <View style={styles.chipWrap}>
          {VIBES.map((v) => (
            <Chip
              key={v.id}
              label={v.label}
              emoji={v.emoji}
              selected={vibe === v.id}
              onPress={() => setVibe(v.id)}
            />
          ))}
        </View>
      </Animated.View>

      {closet.length > 0 && closet.length < 6 ? (
        <Text variant="caption" style={styles.smallClosetNote}>
          {SMALL_CLOSET}
        </Text>
      ) : null}

      {/* Primary CTA */}
      <Animated.View entering={FadeInDown.delay(300).duration(420)} style={styles.section}>
        <PressableScale
          onPress={() => cook(false)}
          disabled={!ready}
          accessibilityLabel="Cook my fit"
          style={[styles.cta, !ready && styles.ctaDisabled]}
        >
          <LinearGradient
            colors={[palette.ink, '#3A342C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaInner}
          >
            <Text style={styles.ctaText}>✨ COOK MY FIT</Text>
            <Text style={styles.ctaSub}>
              {ready ? 'your closet is ready for this' : 'pick an occasion + energy first'}
            </Text>
          </LinearGradient>
        </PressableScale>

        <PressableScale
          onPress={() => cook(true)}
          disabled={!weather}
          style={styles.surprise}
          accessibilityLabel="Surprise me"
        >
          <Text style={styles.surpriseText}>🎲 Surprise me</Text>
        </PressableScale>
      </Animated.View>

      {/* Shortcuts */}
      <Animated.View entering={FadeInDown.delay(380).duration(420)} style={styles.shortcutRow}>
        <PressableScale
          style={[styles.shortcut, { backgroundColor: palette.blush }]}
          onPress={() => router.push('/closet')}
        >
          <Text style={styles.shortcutEmoji}>👗</Text>
          <Text style={styles.shortcutLabel}>My Closet</Text>
          <Text variant="caption">{closet.length} pieces strong</Text>
        </PressableScale>
        <PressableScale
          style={[styles.shortcut, { backgroundColor: palette.cream }]}
          onPress={() => router.push('/receipts')}
        >
          <Text style={styles.shortcutEmoji}>🧾</Text>
          <Text style={styles.shortcutLabel}>Fit Receipts</Text>
          <Text variant="caption">proof you ate</Text>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  wordmark: {
    fontFamily: fonts.displayBlack,
    fontSize: 40,
    letterSpacing: 2,
    color: palette.ink,
  },
  sparkle: { fontSize: 18, marginTop: 6 },
  greeting: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: palette.inkSoft,
    marginTop: 2,
  },
  section: { marginTop: spacing.xl },
  question: { marginBottom: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  smallClosetNote: { marginTop: spacing.lg, textAlign: 'center' },
  cta: { borderRadius: radius.lg, ...shadows.floating },
  ctaDisabled: { opacity: 0.45 },
  ctaInner: {
    borderRadius: radius.lg,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 18,
    letterSpacing: 1.2,
    color: palette.surfaceSoft,
  },
  ctaSub: { fontFamily: fonts.bodySemi, fontSize: 12, color: 'rgba(250,245,238,0.7)' },
  surprise: {
    marginTop: spacing.md,
    alignSelf: 'center',
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 22,
    ...shadows.card,
  },
  surpriseText: { fontFamily: fonts.bodyBold, fontSize: 14, color: palette.ink },
  shortcutRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  shortcut: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
    ...shadows.card,
  },
  shortcutEmoji: { fontSize: 26, marginBottom: 6 },
  shortcutLabel: { fontFamily: fonts.bodyExtra, fontSize: 15, color: palette.ink },
});
