import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette, spacing } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  padded?: boolean;
  bottomInset?: boolean;
}

/** Standard page shell: warm canvas + safe areas + optional scroll. */
export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  padded = true,
  bottomInset = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: insets.top + spacing.sm,
    paddingBottom: bottomInset ? insets.bottom + 110 : spacing.lg,
    paddingHorizontal: padded ? spacing.lg : 0,
  };

  if (!scroll) {
    return <View style={[styles.root, pad, style, contentStyle]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.root, style]}
      contentContainerStyle={[pad, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
});
