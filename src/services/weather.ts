/**
 * Weather service — Open-Meteo (keyless, safe for the client) + expo-location.
 * All network/geo logic lives here; screens only consume `WeatherInfo`.
 */
import * as Location from 'expo-location';

import { WEATHER_CAPTIONS, pick } from '@/constants/copy';
import type { WeatherInfo } from '@/types';

const FALLBACK_CITY = { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 };

interface WmoMeta {
  condition: string;
  emoji: string;
  rain: boolean;
}

function describeCode(code: number): WmoMeta {
  if (code === 0) return { condition: 'Clear sky', emoji: '☀️', rain: false };
  if (code <= 2) return { condition: 'Partly cloudy', emoji: '⛅', rain: false };
  if (code === 3) return { condition: 'Overcast', emoji: '☁️', rain: false };
  if (code === 45 || code === 48) return { condition: 'Foggy', emoji: '🌫️', rain: false };
  if (code >= 51 && code <= 57) return { condition: 'Light drizzle', emoji: '🌦️', rain: true };
  if (code >= 61 && code <= 67) return { condition: 'Rainy', emoji: '🌧️', rain: true };
  if (code >= 71 && code <= 77) return { condition: 'Snowy', emoji: '❄️', rain: false };
  if (code >= 80 && code <= 82) return { condition: 'Rain showers', emoji: '🌧️', rain: true };
  if (code >= 95) return { condition: 'Thunderstorm', emoji: '⛈️', rain: true };
  return { condition: 'Mild', emoji: '🌤️', rain: false };
}

export type TempBand = 'hot' | 'warm' | 'mild' | 'cold';

export function tempBand(tempC: number): TempBand {
  if (tempC >= 30) return 'hot';
  if (tempC >= 22) return 'warm';
  if (tempC >= 14) return 'mild';
  return 'cold';
}

export function weatherCaption(weather: WeatherInfo): string {
  if (weather.isRaining) return pick(WEATHER_CAPTIONS.rain);
  return pick(WEATHER_CAPTIONS[tempBand(weather.tempC)]);
}

async function getCoords(): Promise<{ latitude: number; longitude: number; name?: string }> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK_CITY;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return FALLBACK_CITY;
  }
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  // Keyless client-side reverse geocoding.
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.city || data.locality || data.principalSubdivision || null;
  } catch {
    return null;
  }
}

async function fetchCurrent(latitude: number, longitude: number) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const data = await res.json();
  return data.current as {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
  };
}

function fallbackWeather(city = FALLBACK_CITY.name): WeatherInfo {
  return {
    tempC: 26,
    feelsLikeC: 27,
    condition: 'Partly cloudy',
    emoji: '⛅',
    city,
    isRaining: false,
    code: 2,
    isFallback: true,
  };
}

export async function getWeather(): Promise<WeatherInfo> {
  try {
    const coords = await getCoords();
    const [current, cityName] = await Promise.all([
      fetchCurrent(coords.latitude, coords.longitude),
      coords.name ? Promise.resolve(coords.name) : reverseGeocode(coords.latitude, coords.longitude),
    ]);
    const meta = describeCode(current.weather_code);
    return {
      tempC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      condition: meta.condition,
      emoji: meta.emoji,
      city: cityName ?? 'Your city',
      isRaining: meta.rain,
      code: current.weather_code,
      isFallback: false,
    };
  } catch {
    return fallbackWeather();
  }
}

/** Manual city override — forward geocode via Open-Meteo, then fetch weather. */
export async function getWeatherForCity(query: string): Promise<WeatherInfo | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data?.results?.[0];
    if (!hit) return null;
    const current = await fetchCurrent(hit.latitude, hit.longitude);
    const meta = describeCode(current.weather_code);
    return {
      tempC: Math.round(current.temperature_2m),
      feelsLikeC: Math.round(current.apparent_temperature),
      condition: meta.condition,
      emoji: meta.emoji,
      city: hit.name,
      isRaining: meta.rain,
      code: current.weather_code,
      isFallback: false,
    };
  } catch {
    return null;
  }
}
