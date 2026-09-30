import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { COLOR_SWATCHES, categoryMeta } from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { resolveImage } from '@/services/demo/seedCloset';
import type { ClothingItem } from '@/types';

interface Props {
  item: ClothingItem;
  onPress?: () => void;
  index?: number;
}

export function ClothingCard({ item, onPress, index = 0 }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 55).duration(380).springify().damping(18)}
      style={styles.wrap}
    >
      <PressableScale style={styles.card} onPress={onPress} scaleTo={0.97}>
        <Image
          source={resolveImage(item.imageUri)}
          style={styles.image}
          contentFit="cover"
          transition={250}
          accessibilityLabel={item.name}
        />
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.name}>
            {item.name || 'Untitled piece'}
          </Text>
          <View style={styles.row}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: COLOR_SWATCHES[item.color] ?? palette.inkFaint },
              ]}
            />
            <Text variant="caption" numberOfLines={1} style={styles.sub}>
              {categoryMeta(item.category).label.replace(/s$/, '')} · {item.color}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  image: {
    width: '100%',
    aspectRatio: 0.92,
    backgroundColor: palette.cream,
  },
  meta: { padding: spacing.sm + 2, gap: 3 },
  name: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: palette.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  sub: { flex: 1, textTransform: 'capitalize' },
});
