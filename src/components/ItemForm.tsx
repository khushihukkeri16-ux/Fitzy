import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import {
  CATEGORIES,
  COLOR_OPTIONS,
  COLOR_SWATCHES,
  FORMALITIES,
  SEASONS,
  STYLE_KEYWORDS,
} from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import type { Category, ClothingItem, Formality, Season } from '@/types';

export type ItemFormValue = Omit<ClothingItem, 'id' | 'imageUri' | 'wearCount' | 'createdAt'>;

interface Props {
  value: ItemFormValue;
  onChange: (patch: Partial<ItemFormValue>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="heading" style={styles.fieldLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

/** Shared editable clothing metadata form (add + edit). */
export function ItemForm({ value, onChange }: Props) {
  const toggleStyle = (s: string) => {
    onChange({
      styles: value.styles.includes(s)
        ? value.styles.filter((x) => x !== s)
        : [...value.styles, s],
    });
  };

  return (
    <View>
      <Field label="Name">
        <TextInput
          style={styles.input}
          value={value.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="e.g. White oversized tee"
          placeholderTextColor={palette.inkFaint}
        />
      </Field>

      <Field label="Category">
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              small
              label={c.label}
              emoji={c.emoji}
              selected={value.category === c.id}
              onPress={() => onChange({ category: c.id as Category })}
            />
          ))}
        </View>
      </Field>

      <Field label="Main color">
        <View style={styles.wrap}>
          {COLOR_OPTIONS.map((c) => (
            <Chip
              key={c}
              small
              label={c}
              selected={value.color === c}
              accent={value.color === c ? COLOR_SWATCHES[c] : undefined}
              onPress={() => onChange({ color: c })}
            />
          ))}
        </View>
      </Field>

      <Field label="Season">
        <View style={styles.wrap}>
          {SEASONS.map((s) => (
            <Chip
              key={s.id}
              small
              label={s.label}
              emoji={s.emoji}
              selected={value.season === s.id}
              onPress={() => onChange({ season: s.id as Season })}
            />
          ))}
        </View>
      </Field>

      <Field label="Formality">
        <View style={styles.wrap}>
          {FORMALITIES.map((f) => (
            <Chip
              key={f.id}
              small
              label={f.label}
              selected={value.formality === f.id}
              onPress={() => onChange({ formality: f.id as Formality })}
            />
          ))}
        </View>
      </Field>

      <Field label="Style (pick a few)">
        <View style={styles.wrap}>
          {STYLE_KEYWORDS.map((s) => (
            <Chip
              key={s}
              small
              label={s}
              selected={value.styles.includes(s)}
              onPress={() => toggleStyle(s)}
            />
          ))}
        </View>
      </Field>

      <View style={styles.row}>
        <Field label="Pattern">
          <TextInput
            style={styles.input}
            value={value.pattern}
            onChangeText={(pattern) => onChange({ pattern })}
            placeholder="solid, floral…"
            placeholderTextColor={palette.inkFaint}
          />
        </Field>
        <Field label="Material">
          <TextInput
            style={styles.input}
            value={value.material}
            onChangeText={(material) => onChange({ material })}
            placeholder="cotton, denim…"
            placeholderTextColor={palette.inkFaint}
          />
        </Field>
      </View>

      <Field label="Tags (comma separated)">
        <TextInput
          style={styles.input}
          value={value.tags.join(', ')}
          onChangeText={(t) =>
            onChange({ tags: t.split(',').map((x) => x.trim()).filter(Boolean) })
          }
          placeholder="oversized, staple…"
          placeholderTextColor={palette.inkFaint}
        />
      </Field>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.lg, flex: 1 },
  fieldLabel: { marginBottom: spacing.sm, fontSize: 14 },
  input: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: fonts.bodySemi,
    fontSize: 14.5,
    color: palette.ink,
    ...shadows.card,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs + 2 },
  row: { flexDirection: 'row', gap: spacing.md },
});
