import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OutfitCard } from '@/components/OutfitCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { EMPTY_RECEIPTS } from '@/constants/copy';
import { fonts, palette, spacing } from '@/constants/theme';
import { itemsById, useFitzyStore } from '@/store/useFitzyStore';

export default function ReceiptsScreen() {
  const router = useRouter();
  const closet = useFitzyStore((s) => s.closet);
  const outfits = useFitzyStore((s) => s.outfits);
  const toggleFavorite = useFitzyStore((s) => s.toggleFavorite);
  const rateOutfit = useFitzyStore((s) => s.rateOutfit);
  const deleteOutfit = useFitzyStore((s) => s.deleteOutfit);
  const rewearOutfit = useFitzyStore((s) => s.rewearOutfit);

  const confirmDelete = (id: string) => {
    const doDelete = () => deleteOutfit(id);
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Delete this fit receipt?')) doDelete();
    } else {
      Alert.alert('Delete this receipt?', 'This fit will be forgotten. Iconic, but gone.', [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text variant="display" style={styles.title}>
          FIT RECEIPTS 🧾
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          Proof that you actually ate.
        </Text>
      </Animated.View>

      {outfits.length === 0 ? (
        <EmptyState
          emoji="🧾"
          message={EMPTY_RECEIPTS}
          actionLabel="✨ Cook my first fit"
          onAction={() => router.push('/')}
        />
      ) : (
        <View style={styles.list}>
          {outfits.map((outfit, i) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={itemsById(closet, outfit.itemIds)}
              index={i}
              onToggleFavorite={() => toggleFavorite(outfit.id)}
              onRate={(n) => rateOutfit(outfit.id, n)}
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
                    onPress={() => confirmDelete(outfit.id)}
                    haptic={false}
                  >
                    <Text style={[styles.actionText, { color: palette.danger }]}>Delete</Text>
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
