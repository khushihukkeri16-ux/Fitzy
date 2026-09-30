import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutfitCard } from '@/components/OutfitCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { EMPTY_FAVORITES } from '@/constants/copy';
import { fonts, palette, shadows, spacing } from '@/constants/theme';
import { itemsById, useFitzyStore } from '@/store/useFitzyStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const closet = useFitzyStore((s) => s.closet);
  const outfits = useFitzyStore((s) => s.outfits);
  const toggleFavorite = useFitzyStore((s) => s.toggleFavorite);
  const rewearOutfit = useFitzyStore((s) => s.rewearOutfit);

  const favorites = outfits.filter((o) => o.favorite);

  const cookSimilar = (occasion: string, vibe: string) => {
    router.push({
      pathname: '/cook',
      params: {
        occasion,
        vibe,
        tempC: '26',
        condition: 'Partly cloudy',
        emoji: '⛅',
        city: 'Your city',
        raining: '0',
      },
    });
  };

  return (
    <Screen contentStyle={{ paddingTop: insets.top + spacing.md }}>
      <View style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn} haptic={false}>
          <Text style={{ fontSize: 16 }}>←</Text>
        </PressableScale>
      </View>

      <Animated.View entering={FadeInDown.duration(400)}>
        <Text variant="display" style={styles.title}>
          THE HALL OF FAME 🏆
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          The fits that hit different.
        </Text>
      </Animated.View>

      {favorites.length === 0 ? (
        <EmptyState
          emoji="🤍"
          message={EMPTY_FAVORITES}
          actionLabel="View fit receipts"
          onAction={() => router.push('/receipts')}
        />
      ) : (
        <View style={styles.list}>
          {favorites.map((outfit, i) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={itemsById(closet, outfit.itemIds)}
              index={i}
              onToggleFavorite={() => toggleFavorite(outfit.id)}
              footer={
                <View style={styles.actions}>
                  <PressableScale
                    style={styles.actionBtn}
                    onPress={() => rewearOutfit(outfit.id)}
                    haptic={false}
                  >
                    <Text style={styles.actionText}>↻ Wear again</Text>
                  </PressableScale>
                  <PressableScale
                    style={styles.actionBtn}
                    onPress={() => cookSimilar(outfit.occasion, outfit.vibe)}
                    haptic={false}
                  >
                    <Text style={styles.actionText}>✨ Cook similar</Text>
                  </PressableScale>
                </View>
              }
            />
          ))}
        </View>
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
  list: { gap: spacing.md, marginTop: spacing.lg },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: palette.hairline,
    paddingTop: spacing.sm,
    marginTop: 2,
  },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 13, color: palette.inkSoft },
});
