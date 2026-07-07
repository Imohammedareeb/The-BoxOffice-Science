import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  withCredentials: true,        // SEC-03 FIX: send HttpOnly cookie with every request
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ error?: { message?: string }; detail?: string }>) => {
    const message =
      error.response?.data?.error?.message ??
      error.response?.data?.detail ??
      error.message ??
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

// ── Request interceptor: attach stored token for Axios (Bearer fallback) ──────
import { getStoredToken } from "@/lib/cookies";

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Request Types ──────────────────────────────────────────
export interface PredictionInput {
  budget: number;
  genre: string;
  cast_tier: "A-List" | "B-List" | "Newcomer" | "Mixed";
  target_demographic: string;
  release_season: "Summer" | "Holiday" | "Spring" | "Fall" | "Winter";
  distributor_split: number;
  tax_rate: number;
}
export interface NLPMatchInput { concept: string; top_k?: number; }

// ── Response Types ─────────────────────────────────────────
export interface PredictionResult {
  predicted_revenue: number; roi_percentage: number; net_profit: number;
  distributor_share: number; tax_deduction: number; confidence: number;
  risk_level: "Low" | "Medium" | "High";
  genre_multiplier: number; cast_multiplier: number; season_multiplier: number;
}
export interface NLPMatchResult {
  title: string; similarity_score: number; genre: string; year: number;
  box_office: number; budget: number; roi: number; description: string; tags: string[];
  director?: string | null;
  studio?: string | null;
}
export interface MarketSentiment {
  overall_sentiment: number;
  genre_trends: { genre: string; trend: number; momentum: string }[];
  top_markets: { region: string; growth: number }[];
  ai_insight: string;
}
export interface DashboardStats {
  total_predicted_revenue: number; average_roi: number; active_ventures: number;
  market_sentiment_label: string; sentiment_score: number;
  top_genre: string; top_genre_roi: number;
}

// FIX-DATA-ISOLATION: New type for user's own stats
export interface PersonalStats {
  has_data: boolean;
  venture_count: number;
  prediction_count: number;
  avg_predicted_roi: number | null;
  total_projected_revenue: number;
  best_genre: string | null;
  is_new_account: boolean;
}

export interface GenreBreakdown {
  genre: string; count: number; avg_budget: number;
  avg_revenue: number; avg_roi: number; peak_roi: number;
}
export interface TopFilm {
  title: string; genre: string; year: number; budget: number;
  box_office: number; roi: number; director: string | null; studio: string | null;
}

// ── API Functions — Dashboard ──────────────────────────────
export const predictRevenue = (input: PredictionInput) =>
  api.post<PredictionResult>("/api/predictions/revenue", input).then(r => r.data);

export const matchConcepts = (input: NLPMatchInput) =>
  api.post<NLPMatchResult[]>("/api/nlp/match", input).then(r => r.data);

export const getMarketSentiment = () =>
  api.get<MarketSentiment>("/api/predictions/sentiment").then(r => r.data);

export const getDashboardStats = () =>
  api.get<DashboardStats>("/api/dashboard/stats").then(r => r.data);

// FIX-DATA-ISOLATION: New endpoint for user's personal stats
export const getPersonalStats = () =>
  api.get<PersonalStats>("/api/dashboard/personal-stats").then(r => r.data);

export const getGenreBreakdown = () =>
  api.get<GenreBreakdown[]>("/api/dashboard/genre-breakdown").then(r => r.data);

export const getTopFilms = (limit = 10, sortBy: "roi" | "box_office" | "year" = "roi") =>
  api.get<TopFilm[]>("/api/dashboard/top-films", { params: { limit, sort_by: sortBy } }).then(r => r.data);

export const checkHealth = () =>
  api.get("/health").then(() => true).catch(() => false);

// ── Venture Types + CRUD ───────────────────────────────────
export interface VenturePhase {
  id: string;
  label: string;
  status: "done" | "active" | "upcoming";
}

export interface Venture {
  id: string;
  title: string;
  genre: string;
  budget: number;
  projected_revenue: number;
  director: string;
  cast_tier: string;
  status_color: string;
  current_phase: string;
  progress: number;
  risk: "Low" | "Medium" | "High";
  team_size?: number;
  start_date: string;
  release_date: string;
  phases: VenturePhase[];
  is_demo?: boolean;   // FIX-DATA-ISOLATION: true = placeholder for new accounts
}

export interface VentureCreate {
  title: string;
  genre: string;
  budget: number;
  projected_revenue?: number;
  director?: string;
  cast_tier?: string;
  current_phase?: string;
  progress?: number;
  risk?: string;
  start_date?: string;
  release_date?: string;
  notes?: string;
}

export const getVentures = () =>
  api.get<Venture[]>("/api/production/ventures").then(r => r.data);

// FIX-DATA-ISOLATION: Full CRUD for user-scoped ventures
export const createVenture = (input: VentureCreate) =>
  api.post<Venture>("/api/production/ventures", input).then(r => r.data);

export const updateVenture = (id: string, input: Partial<VentureCreate>) =>
  api.put<Venture>(`/api/production/ventures/${id}`, input).then(r => r.data);

export const deleteVenture = (id: string) =>
  api.delete(`/api/production/ventures/${id}`).then(() => undefined);

// ── Auth Types ─────────────────────────────────────────────
export interface RegisterInput {
  email: string;
  display_name: string;
  password: string;
  tier?: "Analyst" | "Executive";
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  tier: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

// ── Auth API ───────────────────────────────────────────────
export const register = (input: RegisterInput) =>
  api.post<TokenResponse>("/api/auth/register", input).then(r => r.data);

export const login = (input: LoginInput) =>
  api.post<TokenResponse>("/api/auth/login", input).then(r => r.data);

export const getMe = () =>
  api.get<AuthUser>("/api/auth/me").then(r => r.data);

// SEC-06 FIX: logout is handled by removeToken() in cookies.ts (server-side cookie clear)
// This is kept for direct API use if needed
export const logoutAPI = () =>
  api.post("/api/auth/logout").then(() => undefined).catch(() => undefined);
