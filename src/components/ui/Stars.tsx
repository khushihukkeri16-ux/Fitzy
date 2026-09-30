import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { palette, spacing } from '@/constants/theme';

interface Props {
  value: number | null;
  onChange?: (value: number) => void;
  size?: number;
}

export function Stars({ value, onChange, size = 22 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        const star = (
          <Text style={{ fontSize: size, color: filled ? palette.gold : palette.inkFaint }}>
            {filled ? '★' : '☆'}
          </Text>
        );
        if (!onChange) return <View key={n}>{star}</View>;
        return (
          <PressableScale
            key={n}
            scaleTo={0.8}
            onPress={() => onChange(n)}
            accessibilityLabel={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            {star}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
