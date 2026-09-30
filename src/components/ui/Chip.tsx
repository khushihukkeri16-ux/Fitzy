import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';

interface Props {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  accent?: string;
}

/** Rounded selectable pill used for occasions, vibes, filters & modifiers. */
export function Chip({ label, emoji, selected, onPress, small, style, accent }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={[
        styles.chip,
        small && styles.small,
        selected && [styles.selected, accent ? { backgroundColor: accent } : null],
        style,
      ]}
    >
      <View style={styles.row}>
        {emoji ? <Text style={[styles.emoji, small && styles.emojiSmall]}>{emoji}</Text> : null}
        <Text
          style={[
            styles.label,
            small && styles.labelSmall,
            selected && styles.labelSelected,
          ]}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    ...shadows.card,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  selected: {
    backgroundColor: palette.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: { fontSize: 15 },
  emojiSmall: { fontSize: 13 },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.ink,
  },
  labelSmall: { fontSize: 13 },
  labelSelected: { color: palette.surfaceSoft },
});
