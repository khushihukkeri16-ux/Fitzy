import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemForm, type ItemFormValue } from '@/components/ItemForm';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { TAGGING_LOADING, pick } from '@/constants/copy';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { tagClothingImage } from '@/services/ai';
import { isSupabaseConfigured } from '@/services/supabase';
import { useFitzyStore } from '@/store/useFitzyStore';
import type { ClothingItem } from '@/types';

const EMPTY_FORM: ItemFormValue = {
  name: '',
  category: 'top',
  color: 'black',
  secondaryColors: [],
  pattern: 'solid',
  material: 'cotton',
  season: 'all-season',
  styles: ['casual'],
  formality: 'casual',
  tags: [],
};

export default function AddItemScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addItem = useFitzyStore((s) => s.addItem);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [form, setForm] = useState<ItemFormValue>(EMPTY_FORM);
  const [tagging, setTagging] = useState(false);
  const [tagNote, setTagNote] = useState<string | null>(null);

  const pickImage = async (fromCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    };
    const result = fromCamera
      ? await (async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) return null;
          return ImagePicker.launchCameraAsync(options);
        })()
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result || result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    // On web we keep a data URL so it survives persistence.
    const uri =
      Platform.OS === 'web' && asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
    setImageUri(uri);
    runTagging(asset.base64 ?? null);
  };

  const runTagging = async (base64: string | null) => {
    if (!base64) return;
    setTagging(true);
    setTagNote(null);
    const tags = await tagClothingImage(base64);
    setTagging(false);
    if (tags.confidence > 0) {
      setForm((f) => ({
        ...f,
        ...tags,
        name: tags.name || f.name,
      }));
      setTagNote('AI took a guess — double-check everything before saving. ✍️');
    } else if (!isSupabaseConfigured) {
      setTagNote('AI tagging needs the backend connected — fill in the details manually for now. ✍️');
    } else {
      setTagNote("Couldn't auto-tag this one. Fill in the details manually. ✍️");
    }
  };

  const save = () => {
    if (!imageUri || !form.name.trim()) return;
    const item: ClothingItem = {
      ...form,
      name: form.name.trim(),
      id: `item-${Date.now()}`,
      imageUri,
      wearCount: 0,
      createdAt: new Date().toISOString(),
    };
    addItem(item);
    router.back();
  };

  const canSave = Boolean(imageUri && form.name.trim());

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <PressableScale onPress={() => router.back()} style={styles.closeBtn} haptic={false}>
          <Text style={{ fontSize: 15 }}>✕</Text>
        </PressableScale>
        <Text variant="title">Drop the fit 👀</Text>
      </View>

      {/* Image */}
      <Animated.View entering={FadeInDown.duration(400)}>
        {imageUri ? (
          <View>
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" transition={250} />
            <PressableScale style={styles.retake} onPress={() => pickImage(false)} haptic={false}>
              <Text style={styles.retakeText}>↻ Choose another</Text>
            </PressableScale>
          </View>
        ) : (
          <View style={styles.pickerRow}>
            <PressableScale
              style={[styles.pickerCard, { backgroundColor: palette.blush }]}
              onPress={() => pickImage(false)}
            >
              <Text style={styles.pickerEmoji}>🖼️</Text>
              <Text style={styles.pickerLabel}>Upload a photo</Text>
            </PressableScale>
            <PressableScale
              style={[styles.pickerCard, { backgroundColor: palette.lavender }]}
              onPress={() => pickImage(true)}
            >
              <Text style={styles.pickerEmoji}>📸</Text>
              <Text style={styles.pickerLabel}>Use the camera</Text>
            </PressableScale>
          </View>
        )}
      </Animated.View>

      {/* AI tagging status */}
      {tagging ? (
        <Animated.View entering={FadeIn.duration(250)} style={styles.tagStatus}>
          <ActivityIndicator size="small" color={palette.ink} />
          <Text variant="caption">{pick(TAGGING_LOADING)}</Text>
        </Animated.View>
      ) : tagNote ? (
        <Animated.View entering={FadeIn.duration(250)} style={styles.tagStatus}>
          <Text variant="caption">{tagNote}</Text>
        </Animated.View>
      ) : null}

      {/* Form */}
      <ItemForm value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />

      <PressableScale
        style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}
        onPress={save}
        disabled={!canSave}
      >
        <Text style={styles.saveText}>👗 Add to closet</Text>
      </PressableScale>
      {!canSave ? (
        <Text variant="caption" style={styles.saveHint}>
          add a photo + a name and you're set
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  pickerRow: { flexDirection: 'row', gap: spacing.md },
  pickerCard: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  pickerEmoji: { fontSize: 32 },
  pickerLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: palette.ink },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: palette.cream,
  },
  retake: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.xs },
  retakeText: { fontFamily: fonts.bodyBold, fontSize: 13, color: palette.inkSoft },
  tagStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: palette.cream,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  saveBtn: {
    marginTop: spacing.xl,
    backgroundColor: palette.ink,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadows.floating,
  },
  saveText: { fontFamily: fonts.bodyExtra, fontSize: 15.5, color: palette.surfaceSoft },
  saveHint: { textAlign: 'center', marginTop: spacing.sm },
});
