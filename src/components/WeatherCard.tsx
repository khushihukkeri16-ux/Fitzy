import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { fonts, palette, radius, spacing } from '@/constants/theme';
import { weatherCaption } from '@/services/weather';
import type { WeatherInfo } from '@/types';

interface Props {
  weather: WeatherInfo | null;
  loading: boolean;
  onRefresh: () => void;
  onSetCity: (query: string) => Promise<boolean>;
}

export function WeatherCard({ weather, loading, onRefresh, onSetCity }: Props) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const caption = useMemo(() => (weather ? weatherCaption(weather) : ''), [weather]);

  const submit = async () => {
    const q = query.trim();
    setEditing(false);
    setQuery('');
    if (q) await onSetCity(q);
  };

  return (
    <Card delay={80} tint={palette.lavender} style={styles.card}>
      {loading && !weather ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={palette.ink} />
          <Text variant="caption">checking the sky…</Text>
        </View>
      ) : weather ? (
        <View>
          <View style={styles.topRow}>
            <Text style={styles.emoji}>{weather.emoji}</Text>
            <View style={styles.tempBlock}>
              <Text style={styles.temp}>{weather.tempC}°C</Text>
              <Text variant="caption" color={palette.ink}>
                feels like {weather.feelsLikeC}° · {weather.condition.toLowerCase()}
              </Text>
            </View>
            <PressableScale
              onPress={onRefresh}
              style={styles.refresh}
              accessibilityLabel="Refresh weather"
            >
              <Text style={{ fontSize: 15 }}>↻</Text>
            </PressableScale>
          </View>

          {editing ? (
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Type a city…"
              placeholderTextColor={palette.inkFaint}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submit}
              onBlur={submit}
            />
          ) : (
            <PressableScale haptic={false} onPress={() => setEditing(true)}>
              <Text variant="label" style={styles.city}>
                📍 {weather.city}
                {weather.isFallback ? '  ·  demo weather' : ''}
              </Text>
            </PressableScale>
          )}

          <Text style={styles.caption}>“{caption}”</Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  emoji: { fontSize: 44 },
  tempBlock: { flex: 1 },
  temp: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    color: palette.ink,
    lineHeight: 40,
  },
  refresh: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  city: { marginTop: spacing.sm, color: palette.ink },
  caption: {
    marginTop: spacing.xs,
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: palette.inkSoft,
    fontStyle: 'italic',
  },
  input: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: palette.ink,
  },
});
