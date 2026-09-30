import { useCallback, useEffect, useRef, useState } from 'react';

import { getWeather, getWeatherForCity } from '@/services/weather';
import type { WeatherInfo } from '@/types';

interface UseWeather {
  weather: WeatherInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setCity: (query: string) => Promise<boolean>;
}

/** Keeps weather logic out of screens. */
export function useWeather(): UseWeather {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const w = await getWeather();
    if (mounted.current) {
      setWeather(w);
      setLoading(false);
    }
  }, []);

  const setCity = useCallback(async (query: string) => {
    setLoading(true);
    const w = await getWeatherForCity(query);
    if (mounted.current) {
      if (w) setWeather(w);
      setLoading(false);
    }
    return Boolean(w);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { weather, loading, refresh, setCity };
}
