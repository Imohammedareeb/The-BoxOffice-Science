"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getDashboardStats,
  getGenreBreakdown,
  getMarketSentiment,
  getTopFilms,
  getVentures,
  predictRevenue,
  matchConcepts,
  checkHealth,
  type DashboardStats,
  type GenreBreakdown,
  type MarketSentiment,
  type NLPMatchResult,
  type PredictionInput,
  type PredictionResult,
  type TopFilm,
  type Venture,
  type NLPMatchInput,
} from "@/lib/api";

// ─────────────────────────────────────────────────────────
// Generic async hook factory
// ─────────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: { immediate?: boolean; fallback?: T } = { immediate: true }
): AsyncState<T> {
  const [data, setData] = useState<T | null>(options.fallback ?? null);
  const [isLoading, setIsLoading] = useState(options.immediate !== false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current)
        setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (options.immediate !== false) run();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return { data, isLoading, error, refetch: run };
}

// ─────────────────────────────────────────────────────────
// Domain-specific hooks
// ─────────────────────────────────────────────────────────

/** Dashboard KPIs from /api/dashboard/stats */
export function useDashboardStats(): AsyncState<DashboardStats> {
  return useAsync(getDashboardStats, [], { immediate: true });
}

/** Per-genre breakdown from /api/dashboard/genre-breakdown */
export function useGenreBreakdown(): AsyncState<GenreBreakdown[]> {
  return useAsync(getGenreBreakdown, [], { immediate: true });
}

/** Market sentiment from /api/predictions/sentiment */
export function useMarketSentiment(): AsyncState<MarketSentiment> {
  return useAsync(getMarketSentiment, [], { immediate: true });
}

/** Top films from /api/dashboard/top-films */
export function useTopFilms(
  limit = 10,
  sortBy: "roi" | "box_office" | "year" = "roi"
): AsyncState<TopFilm[]> {
  return useAsync(() => getTopFilms(limit, sortBy), [limit, sortBy], { immediate: true });
}

/** API health check */
export function useApiHealth(): { online: boolean; checking: boolean } {
  const [online, setOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkHealth().then((ok) => {
      setOnline(ok);
      setChecking(false);
    });
  }, []);

  return { online, checking };
}

// ─────────────────────────────────────────────────────────
// Mutation hooks (triggered manually, not on mount)
// ─────────────────────────────────────────────────────────

interface MutationState<TResult> {
  result: TResult | null;
  isLoading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

/** Revenue prediction mutation */
export function usePrediction(input: PredictionInput): MutationState<PredictionResult> {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await predictRevenue(input);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, execute, reset };
}

/** NLP concept matching mutation */
export function useConceptMatch(input: NLPMatchInput): MutationState<NLPMatchResult[]> {
  const [result, setResult] = useState<NLPMatchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    if (!input.concept.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await matchConcepts(input);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Concept match failed");
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, execute, reset };
}

/** Active ventures from /api/production/ventures */
export function useVentures(): AsyncState<Venture[]> {
  return useAsync(getVentures, [], { immediate: true });
}
