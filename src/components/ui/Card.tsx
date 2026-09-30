import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { palette, radius, shadows, spacing } from '@/constants/theme';

interface Props extends ViewProps {
  /** Entrance animation delay (ms). Pass -1 to disable the animation. */
  delay?: number;
  tint?: string;
}

/** Soft rounded card with a gentle entrance animation. */
export function Card({ delay = 0, tint, style, children, ...rest }: Props) {
  const inner = (
    <View
      {...rest}
      style={[styles.card, tint ? { backgroundColor: tint } : null, style]}
    >
      {children}
    </View>
  );
  if (delay < 0) return inner;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(420).springify().damping(18)}>
      {inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
});
