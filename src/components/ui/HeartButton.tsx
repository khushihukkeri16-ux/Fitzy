import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { palette } from '@/constants/theme';

interface Props {
  active: boolean;
  onToggle: () => void;
  size?: number;
}

/** Favorite heart with a joyful pop animation. */
export function HeartButton({ active, onToggle, size = 22 }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withSpring(1.35, { damping: 6, stiffness: 320 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    }
  }, [active, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        onToggle();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Remove from favorites' : 'Add to favorites'}
      style={styles.wrap}
    >
      <Animated.View style={animated}>
        <Text style={{ fontSize: size, color: active ? palette.blushDeep : palette.inkFaint }}>
          {active ? '♥' : '♡'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
