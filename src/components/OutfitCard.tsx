import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HeartButton } from '@/components/ui/HeartButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { Stars } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { occasionMeta, vibeMeta } from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { resolveImage } from '@/services/demo/seedCloset';
import type { ClothingItem, Outfit } from '@/types';

interface Props {
  outfit: Outfit;
  items: ClothingItem[];
  index?: number;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  onRate?: (n: number) => void;
  footer?: React.ReactNode;
}

export function OutfitCard({
  outfit,
  items,
  index = 0,
  onPress,
  onToggleFavorite,
  onRate,
  footer,
}: Props) {
  const occ = occasionMeta(outfit.occasion);
  const vibe = vibeMeta(outfit.vibe);
  const date = new Date(outfit.createdAt);
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 70).duration(400).springify().damping(18)}
    >
      <PressableScale style={styles.card} onPress={onPress} scaleTo={0.98} haptic={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="caption">{dateLabel}</Text>
            <Text style={styles.title}>
              {occ.emoji} {occ.label} · {vibe.emoji} {vibe.label}
            </Text>
          </View>
          {onToggleFavorite ? (
            <HeartButton active={outfit.favorite} onToggle={onToggleFavorite} />
          ) : null}
        </View>

        <View style={styles.thumbRow}>
          {items.slice(0, 4).map((item) => (
            <Image
              key={item.id}
              source={resolveImage(item.imageUri)}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
              accessibilityLabel={item.name}
            />
          ))}
        </View>

        <View style={styles.metaRow}>
          <Text variant="caption">
            {outfit.weather.emoji} {outfit.weather.tempC}° {outfit.weather.city}
          </Text>
          <View style={styles.matchPill}>
            <Text style={styles.matchText}>{outfit.vibeMatch}% vibe ✨</Text>
          </View>
        </View>

        {onRate ? (
          <View style={styles.rateRow}>
            <Stars value={outfit.rating} onChange={onRate} size={19} />
            {outfit.rating ? (
              <Text variant="caption">{outfit.rating >= 4 ? 'we ate 🔥' : 'noted, bestie'}</Text>
            ) : (
              <Text variant="caption">rate this fit</Text>
            )}
          </View>
        ) : null}

        {footer}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fonts.bodyExtra, fontSize: 15, color: palette.ink, marginTop: 2 },
  thumbRow: { flexDirection: 'row', gap: spacing.xs },
  thumb: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: radius.sm,
    backgroundColor: palette.cream,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchPill: {
    backgroundColor: palette.blush,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  matchText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: palette.ink },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
});
