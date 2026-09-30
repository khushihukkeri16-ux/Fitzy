import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemForm, type ItemFormValue } from '@/components/ItemForm';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { COMEBACK_ITEM } from '@/constants/copy';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { resolveImage } from '@/services/demo/seedCloset';
import { useFitzyStore } from '@/store/useFitzyStore';

export default function ItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useFitzyStore((s) => s.closet.find((i) => i.id === id));
  const updateItem = useFitzyStore((s) => s.updateItem);
  const removeItem = useFitzyStore((s) => s.removeItem);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ItemFormValue | null>(null);

  if (!item) {
    return (
      <View style={[styles.missing, { paddingTop: insets.top }]}>
        <Text variant="title">This piece left the chat 🫥</Text>
        <PressableScale style={styles.ghost} onPress={() => router.back()}>
          <Text style={styles.ghostText}>← Back to closet</Text>
        </PressableScale>
      </View>
    );
  }

  const startEdit = () => {
    const { id: _, imageUri, wearCount, createdAt, ...rest } = item;
    setForm(rest);
    setEditing(true);
  };

  const saveEdit = () => {
    if (form) updateItem(item.id, form);
    setEditing(false);
  };

  const confirmDelete = () => {
    const doDelete = () => {
      removeItem(item.id);
      router.back();
    };
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Remove “${item.name}” from your closet?`)) doDelete();
    } else {
      Alert.alert('Remove this piece?', `“${item.name}” will leave your closet.`, [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.backBtn} haptic={false}>
          <Text style={{ fontSize: 16 }}>←</Text>
        </PressableScale>
        <Text variant="title" numberOfLines={1} style={{ flex: 1 }}>
          {item.name}
        </Text>
      </View>

      <Image
        source={resolveImage(item.imageUri)}
        style={styles.image}
        contentFit="cover"
        transition={300}
        accessibilityLabel={item.name}
      />

      {item.wearCount === 0 ? (
        <View style={styles.comeback}>
          <Text variant="caption">{COMEBACK_ITEM(item.name)}</Text>
        </View>
      ) : (
        <View style={styles.comeback}>
          <Text variant="caption">worn in {item.wearCount} saved fit{item.wearCount > 1 ? 's' : ''}</Text>
        </View>
      )}

      {editing && form ? (
        <>
          <ItemForm value={form} onChange={(patch) => setForm((f) => (f ? { ...f, ...patch } : f))} />
          <PressableScale style={styles.saveBtn} onPress={saveEdit}>
            <Text style={styles.saveText}>✓ Save changes</Text>
          </PressableScale>
          <PressableScale style={styles.ghost} onPress={() => setEditing(false)}>
            <Text style={styles.ghostText}>Cancel</Text>
          </PressableScale>
        </>
      ) : (
        <>
          <View style={styles.metaCard}>
            {[
              ['Category', item.category],
              ['Color', [item.color, ...item.secondaryColors].join(', ')],
              ['Pattern', item.pattern],
              ['Material', item.material],
              ['Season', item.season],
              ['Style', item.styles.join(', ') || '—'],
              ['Formality', item.formality],
              ['Tags', item.tags.join(', ') || '—'],
            ].map(([label, value]) => (
              <View key={label} style={styles.metaRow}>
                <Text variant="caption" style={styles.metaLabel}>
                  {label}
                </Text>
                <Text variant="label" style={styles.metaValue}>
                  {value}
                </Text>
              </View>
            ))}
          </View>

          <PressableScale style={styles.saveBtn} onPress={startEdit}>
            <Text style={styles.saveText}>✏️ Edit details</Text>
          </PressableScale>
          <PressableScale style={styles.ghost} onPress={confirmDelete}>
            <Text style={[styles.ghostText, { color: palette.danger }]}>Remove from closet</Text>
          </PressableScale>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  missing: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: palette.cream,
  },
  comeback: {
    alignSelf: 'center',
    marginTop: spacing.md,
    backgroundColor: palette.cream,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  metaCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  metaLabel: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 },
  metaValue: { textTransform: 'capitalize', flexShrink: 1, textAlign: 'right' },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: palette.ink,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.floating,
  },
  saveText: { fontFamily: fonts.bodyExtra, fontSize: 15, color: palette.surfaceSoft },
  ghost: { alignSelf: 'center', marginTop: spacing.md, padding: spacing.xs },
  ghostText: { fontFamily: fonts.bodyBold, fontSize: 14, color: palette.inkSoft },
});
