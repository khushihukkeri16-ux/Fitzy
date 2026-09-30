import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { COLOR_OPTIONS, COLOR_SWATCHES, VIBES } from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { summarizeStyle } from '@/services/ai';
import { isSupabaseConfigured } from '@/services/supabase';
import { useFitzyStore } from '@/store/useFitzyStore';
import type { Fit, VibeId } from '@/types';

const FITS: { id: Fit; label: string; emoji: string }[] = [
  { id: 'oversized', label: 'Oversized', emoji: '🫧' },
  { id: 'balanced', label: 'Balanced', emoji: '⚖️' },
  { id: 'fitted', label: 'Fitted', emoji: '📐' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const closet = useFitzyStore((s) => s.closet);
  const preferences = useFitzyStore((s) => s.preferences);
  const setPreferences = useFitzyStore((s) => s.setPreferences);

  const summary = summarizeStyle(closet, preferences.preferredVibes);

  const toggleColor = (c: string) =>
    setPreferences({
      favoriteColors: preferences.favoriteColors.includes(c)
        ? preferences.favoriteColors.filter((x) => x !== c)
        : [...preferences.favoriteColors, c],
    });

  const toggleVibe = (v: VibeId) =>
    setPreferences({
      preferredVibes: preferences.preferredVibes.includes(v)
        ? preferences.preferredVibes.filter((x) => x !== v)
        : [...preferences.preferredVibes, v],
    });

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text variant="display" style={styles.title}>
          YOUR STYLE 🤍
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          Teach FITZY your taste. It listens.
        </Text>
      </Animated.View>

      {/* AI summary */}
      <Card delay={100} tint={palette.blush} style={{ marginTop: spacing.lg }}>
        <Text variant="heading" style={{ marginBottom: 4 }}>
          The read on you
        </Text>
        <Text variant="body" style={{ color: palette.inkSoft }}>
          “{summary}”
        </Text>
      </Card>

      {/* Shortcuts */}
      <View style={styles.shortcutRow}>
        <PressableScale
          style={[styles.shortcut, { backgroundColor: palette.lavender }]}
          onPress={() => router.push('/insights')}
        >
          <Text style={styles.shortcutEmoji}>📊</Text>
          <Text style={styles.shortcutLabel}>Style Report</Text>
        </PressableScale>
        <PressableScale
          style={[styles.shortcut, { backgroundColor: palette.cream }]}
          onPress={() => router.push('/favorites')}
        >
          <Text style={styles.shortcutEmoji}>🏆</Text>
          <Text style={styles.shortcutLabel}>Hall of Fame</Text>
        </PressableScale>
      </View>

      {/* Preferences */}
      <Animated.View entering={FadeInDown.delay(180).duration(420)}>
        <Text variant="heading" style={styles.sectionTitle}>
          Favorite colors
        </Text>
        <View style={styles.wrap}>
          {COLOR_OPTIONS.map((c) => (
            <Chip
              key={c}
              small
              label={c}
              selected={preferences.favoriteColors.includes(c)}
              accent={preferences.favoriteColors.includes(c) ? COLOR_SWATCHES[c] : undefined}
              onPress={() => toggleColor(c)}
            />
          ))}
        </View>

        <Text variant="heading" style={styles.sectionTitle}>
          Go-to energies
        </Text>
        <View style={styles.wrap}>
          {VIBES.map((v) => (
            <Chip
              key={v.id}
              small
              label={v.label}
              emoji={v.emoji}
              selected={preferences.preferredVibes.includes(v.id)}
              onPress={() => toggleVibe(v.id)}
            />
          ))}
        </View>

        <Text variant="heading" style={styles.sectionTitle}>
          Preferred fit
        </Text>
        <View style={styles.wrap}>
          {FITS.map((f) => (
            <Chip
              key={f.id}
              small
              label={f.label}
              emoji={f.emoji}
              selected={preferences.preferredFit === f.id}
              onPress={() => setPreferences({ preferredFit: f.id })}
            />
          ))}
        </View>

        <Text variant="heading" style={styles.sectionTitle}>
          Things you love wearing
        </Text>
        <TextInput
          style={styles.input}
          value={preferences.loves}
          onChangeText={(loves) => setPreferences({ loves })}
          placeholder="e.g. oversized tees, gold jewelry, wide-leg…"
          placeholderTextColor={palette.inkFaint}
          multiline
        />

        <Text variant="heading" style={styles.sectionTitle}>
          Hard passes
        </Text>
        <TextInput
          style={styles.input}
          value={preferences.avoids}
          onChangeText={(avoids) => setPreferences({ avoids })}
          placeholder="e.g. skinny jeans, neon, itchy knits…"
          placeholderTextColor={palette.inkFaint}
          multiline
        />
      </Animated.View>

      {/* Mode note */}
      <View style={styles.modeNote}>
        <Text variant="caption" style={{ textAlign: 'center' }}>
          {isSupabaseConfigured
            ? 'Connected to Supabase · your closet syncs securely'
            : 'Demo mode · data lives on this device. Connect Supabase (see README) for accounts, sync & AI tagging.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  subtitle: { marginTop: 4 },
  shortcutRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  shortcut: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadows.card,
  },
  shortcutEmoji: { fontSize: 24 },
  shortcutLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: palette.ink },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: palette.ink,
    minHeight: 52,
    ...shadows.card,
  },
  modeNote: { marginTop: spacing.xl, paddingHorizontal: spacing.md },
});
