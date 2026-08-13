import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';

/**
 * Resolve the backend host at runtime.
 *
 * Hardcoding 127.0.0.1 breaks on a real phone, where localhost is the phone
 * itself. The Expo dev server already knows the machine's reachable address, so
 * reuse it and assume Django is on :8000 there. Override with EXPO_PUBLIC_API_URL.
 */
function resolveBase(): string {
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override) return override.replace(/\/$/, '');

  // In a browser the page is already served from the right host.
  if (typeof window !== 'undefined' && window.location?.hostname)
    return `http://${window.location.hostname}:8000`;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    '';
  const host = String(hostUri).split(':')[0];
  return host ? `http://${host}:8000` : 'http://127.0.0.1:8000';
}

export const API_BASE = resolveBase();
export const API = `${API_BASE}/api`;

export async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API}${path}`, { signal });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Fetch on mount + on demand, with abort on unmount. */
export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    getJSON<T>(path, ctrl.signal)
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(String(e.message || e));
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick, ...deps]);

  return { data, error, loading, reload };
}

export type Category = 'safe' | 'semi_critical' | 'critical' | 'over_exploited' | 'unknown';

export interface Station {
  code: string;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  latest_level_mbgl: number | null;
  latest_date: string | null;
  trend_m_per_year: number | null;
  category: Category;
  seasonal_fluctuation_m: number | null;
  recharge_mm: number | null;
  data_quality: number | null;
  anomalies: string[];
}

export interface StationDetail extends Station {
  tehsil: string;
  block: string;
  well_type: string;
  aquifer_type: string;
  well_depth_m: number | null;
  agency: string;
  status: string;
  mean_level_mbgl: number | null;
  min_level_mbgl: number | null;
  max_level_mbgl: number | null;
  pre_monsoon_mbgl: number | null;
  post_monsoon_mbgl: number | null;
  specific_yield: number | null;
  reading_count: number;
  series: { date: string; level_mbgl: number }[];
  monthly: { month: string; level_mbgl: number; n: number }[];
  forecast: { date: string; level_mbgl: number; seasonal?: boolean }[];
}

export interface Summary {
  total: number;
  avg_trend: number | null;
  avg_level: number | null;
  avg_recharge: number | null;
  avg_fluctuation: number | null;
  avg_quality: number | null;
  latest: string | null;
  by_category: Record<Category, number>;
  declining: number;
  recovering: number;
  at_risk: number;
  flagged_sensors: number;
  readings: number;
  states: number;
  districts: number;
  stations: number;
  worst: Station[];
  best: Station[];
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  safe: { label: 'Safe', color: '#16a34a' },
  semi_critical: { label: 'Semi-Critical', color: '#eab308' },
  critical: { label: 'Critical', color: '#f97316' },
  over_exploited: { label: 'Over-Exploited', color: '#dc2626' },
  unknown: { label: 'Insufficient data', color: '#94a3b8' },
};

export const ANOMALY_LABEL: Record<string, string> = {
  flatline: 'Sensor stuck (identical readings)',
  spike: 'Implausible jump between days',
  data_gaps: 'Large gaps in transmission',
  stale: 'No recent data received',
  out_of_range: 'Reading outside physical range',
  suspect_trend: 'Trend too steep to be real (datum shift?)',
  no_data: 'No readings at all',
};

export const fmt = (v: number | null | undefined, digits = 2, unit = '') =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : `${v.toFixed(digits)}${unit}`;
