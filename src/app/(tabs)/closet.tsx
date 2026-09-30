import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClothingCard } from '@/components/ClothingCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { EMPTY_CLOSET, EMPTY_SEARCH } from '@/constants/copy';
import { CATEGORIES } from '@/constants/options';
import { fonts, palette, radius, shadows, spacing } from '@/constants/theme';
import { useFitzyStore } from '@/store/useFitzyStore';
import type { Category } from '@/types';

export default function ClosetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const closet = useFitzyStore((s) => s.closet);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return closet.filter((item) => {
      if (filter !== 'all' && item.category !== filter) return false;
      if (!q) return true;
      const hay = [item.name, item.color, item.material, item.pattern, ...item.tags, ...item.styles]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [closet, filter, search]);

  // Two-column layout
  const columns: (typeof filtered)[] = [[], []];
  filtered.forEach((item, i) => columns[i % 2].push(item));

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text variant="display" style={styles.title}>
            THE FITZY CLOSET 👗
          </Text>
          <Text variant="caption" style={styles.subtitle}>
            Everything you own. Zero outfit panic.
          </Text>
        </Animated.View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search your pieces…"
            placeholderTextColor={palette.inkFaint}
            accessibilityLabel="Search clothing"
          />
        </View>

        {/* Category filter */}
        <View style={styles.filterRow}>
          <Chip
            small
            label="All"
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              small
              label={c.label}
              emoji={c.emoji}
              selected={filter === c.id}
              onPress={() => setFilter(c.id)}
            />
          ))}
        </View>

        {/* Grid */}
        {closet.length === 0 ? (
          <EmptyState
            emoji="👗"
            message={EMPTY_CLOSET}
            actionLabel="+ Add a slay"
            onAction={() => router.push('/add-item')}
          />
        ) : filtered.length === 0 ? (
          <EmptyState emoji="👀" message={EMPTY_SEARCH} />
        ) : (
          <View style={styles.grid}>
            {columns.map((col, ci) => (
              <View key={ci} style={styles.column}>
                {col.map((item, i) => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    index={i}
                    onPress={() =>
                      router.push({ pathname: '/item/[id]', params: { id: item.id } })
                    }
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </Screen>

      {/* FAB */}
      <PressableScale
        style={[styles.fab, { bottom: insets.bottom + 104 }]}
        onPress={() => router.push('/add-item')}
        accessibilityLabel="Add a slay"
      >
        <Text style={styles.fabText}>+ Add a slay</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  subtitle: { marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    height: 46,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: palette.ink,
    height: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
  },
  grid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  column: { flex: 1, gap: spacing.md },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    backgroundColor: palette.ink,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    ...shadows.floating,
  },
  fabText: { fontFamily: fonts.bodyExtra, fontSize: 14.5, color: palette.surfaceSoft },
});
