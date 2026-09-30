import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { fonts, palette, radius, spacing } from '@/constants/theme';

interface Props {
  emoji: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, message, actionLabel, onAction }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text variant="body" style={styles.message}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <PressableScale style={styles.button} onPress={onAction}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 36 },
  message: {
    textAlign: 'center',
    color: palette.inkSoft,
    fontFamily: fonts.bodySemi,
    maxWidth: 280,
  },
  button: {
    backgroundColor: palette.ink,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: spacing.xs,
  },
  buttonLabel: {
    color: palette.surfaceSoft,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
