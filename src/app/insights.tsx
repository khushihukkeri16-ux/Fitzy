import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { BLACK_INSIGHT, COMEBACK_ITEM } from '@/constants/copy';
import { COLOR_SWATCHES, categoryMeta, occasionMeta } from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { colorStats, useFitzyStore } from '@/store/useFitzyStore';

function Bar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(delay, withTiming(pct, { duration: 700 }));
  }, [pct, delay, width]);
  const style = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, style]} />
    </View>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const closet = useFitzyStore((s) => s.closet);
  const outfits = useFitzyStore((s) => s.outfits);

  const colors = useMemo(() => colorStats(closet).slice(0, 5), [closet]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of closet) counts.set(i.category, (counts.get(i.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [closet]);

  const mostWorn = useMemo(
    () => [...closet].sort((a, b) => b.wearCount - a.wearCount).slice(0, 3),
    [closet],
  );
  const leastWorn = useMemo(
    () => [...closet].sort((a, b) => a.wearCount - b.wearCount)[0],
    [closet],
  );

  const occasionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of outfits) counts.set(o.occasion, (counts.get(o.occasion) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [outfits]);

  const blackHeavy = colors[0]?.color === 'black' && colors[0].pct >= 30;

  return (
    <Screen contentStyle={{ paddingTop: insets.top + spacing.md }}>
      <View style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn} haptic={false}>
          <Text style={{ fontSize: 16 }}>←</Text>
        </PressableScale>
      </View>

      <Animated.View entering={FadeInDown.duration(400)}>
        <Text variant="display" style={styles.title}>
          YOUR STYLE REPORT ✨
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          The data behind the drip.
        </Text>
      </Animated.View>

      {closet.length === 0 ? (
        <EmptyState
          emoji="📊"
          message="No data yet — the report needs a closet first. 👗"
          actionLabel="+ Add a slay"
          onAction={() => router.push('/add-item')}
        />
      ) : (
        <>
          {/* Colors */}
          <Card delay={100} style={{ marginTop: spacing.lg }}>
            <Text variant="heading" style={styles.cardTitle}>
              Most worn colors
            </Text>
            {colors.map((c, i) => (
              <View key={c.color} style={styles.colorRow}>
                <Text variant="label" style={styles.colorName}>
                  {c.color}
                </Text>
                <Bar
                  pct={c.pct}
                  color={COLOR_SWATCHES[c.color] ?? palette.inkFaint}
                  delay={150 + i * 100}
                />
                <Text variant="caption" style={styles.pct}>
                  {c.pct}%
                </Text>
              </View>
            ))}
            {blackHeavy ? (
              <Text variant="caption" style={styles.insight}>
                {BLACK_INSIGHT}
              </Text>
            ) : null}
          </Card>

          {/* Categories */}
          <Card delay={200} tint={palette.cream} style={{ marginTop: spacing.md }}>
            <Text variant="heading" style={styles.cardTitle}>
              Closet breakdown
            </Text>
            <View style={styles.catWrap}>
              {categories.map(([cat, count]) => (
                <View key={cat} style={styles.catPill}>
                  <Text variant="label">
                    {categoryMeta(cat as never).emoji} {categoryMeta(cat as never).label}
                  </Text>
                  <Text variant="caption">{count}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Most worn */}
          {mostWorn.length > 0 ? (
            <Card delay={280} style={{ marginTop: spacing.md }}>
              <Text variant="heading" style={styles.cardTitle}>
                On heavy rotation
              </Text>
              {mostWorn.map((item, i) => (
                <View key={item.id} style={styles.rankRow}>
                  <Text style={styles.rank}>{['🥇', '🥈', '🥉'][i]}</Text>
                  <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption">{item.wearCount} wears</Text>
                </View>
              ))}
              {leastWorn && leastWorn.wearCount <= 1 ? (
                <Text variant="caption" style={styles.insight}>
                  {COMEBACK_ITEM(leastWorn.name)}
                </Text>
              ) : null}
            </Card>
          ) : null}

          {/* Outfit frequency */}
          <Card delay={360} tint={palette.lavender} style={{ marginTop: spacing.md }}>
            <Text variant="heading" style={styles.cardTitle}>
              Fit frequency
            </Text>
            <Text variant="body" style={{ color: palette.inkSoft }}>
              {outfits.length === 0
                ? 'No fits cooked yet. The stove is cold. 🫣'
                : `${outfits.length} fit${outfits.length > 1 ? 's' : ''} cooked so far${
                    occasionCounts.length
                      ? ` — mostly ${occasionCounts
                          .map(([o]) => occasionMeta(o as never).label.toLowerCase())
                          .join(', ')}.`
                      : '.'
                  }`}
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { marginBottom: spacing.md },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  title: { fontSize: 28, lineHeight: 34 },
  subtitle: { marginTop: 4 },
  cardTitle: { marginBottom: spacing.md },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorName: { width: 76, textTransform: 'capitalize', fontSize: 13 },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.bg,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 6 },
  pct: { width: 38, textAlign: 'right' },
  insight: { marginTop: spacing.sm, fontStyle: 'italic' },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catPill: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rank: { fontSize: 18 },
});
