import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { PredictionInput, PredictionResult, NLPMatchResult } from "@/lib/api";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface PredictionState {
  input: Partial<PredictionInput>;
  result: PredictionResult | null;
  isLoading: boolean;
  error: string | null;
  history: { input: PredictionInput; result: PredictionResult; timestamp: number }[];
}

interface NLPState {
  concept: string;
  matches: NLPMatchResult[];
  isLoading: boolean;
  error: string | null;
}

interface UIState {
  activeView: "dashboard" | "oracle" | "scanner" | "production" | "vault" | "market";
  oracleModalOpen: boolean;
  resultsVisible: boolean;
}

interface BosStore {
  // Prediction
  prediction: PredictionState;
  setPredictionInput: (input: Partial<PredictionInput>) => void;
  setPredictionResult: (result: PredictionResult) => void;
  setPredictionLoading: (loading: boolean) => void;
  setPredictionError: (error: string | null) => void;
  clearPrediction: () => void;

  // NLP
  nlp: NLPState;
  setNLPConcept: (concept: string) => void;
  setNLPMatches: (matches: NLPMatchResult[]) => void;
  setNLPLoading: (loading: boolean) => void;
  setNLPError: (error: string | null) => void;

  // UI
  ui: UIState;
  setActiveView: (view: UIState["activeView"]) => void;
  setOracleModalOpen: (open: boolean) => void;
  setResultsVisible: (visible: boolean) => void;
}

// ─────────────────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────────────────

const DEFAULT_PREDICTION_INPUT: Partial<PredictionInput> = {
  budget: 50_000_000,
  genre: "Action",
  cast_tier: "B-List",
  target_demographic: "18-34",
  release_season: "Summer",
  distributor_split: 45,
  tax_rate: 30,
};

// ─────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────

export const useStore = create<BosStore>()(
  devtools(
    (set) => ({
      // ── Prediction ──
      prediction: {
        input: DEFAULT_PREDICTION_INPUT,
        result: null,
        isLoading: false,
        error: null,
        history: [],
      },
      setPredictionInput: (input) =>
        set((state) => ({
          prediction: {
            ...state.prediction,
            input: { ...state.prediction.input, ...input },
          },
        })),
      setPredictionResult: (result) =>
        set((state) => ({
          prediction: {
            ...state.prediction,
            result,
            history: [
              {
                input: state.prediction.input as PredictionInput,
                result,
                timestamp: Date.now(),
              },
              ...state.prediction.history.slice(0, 9), // keep last 10
            ],
          },
        })),
      setPredictionLoading: (isLoading) =>
        set((state) => ({ prediction: { ...state.prediction, isLoading } })),
      setPredictionError: (error) =>
        set((state) => ({ prediction: { ...state.prediction, error } })),
      clearPrediction: () =>
        set((state) => ({
          prediction: {
            ...state.prediction,
            result: null,
            error: null,
            input: DEFAULT_PREDICTION_INPUT,
          },
        })),

      // ── NLP ──
      nlp: {
        concept: "",
        matches: [],
        isLoading: false,
        error: null,
      },
      setNLPConcept: (concept) =>
        set((state) => ({ nlp: { ...state.nlp, concept } })),
      setNLPMatches: (matches) =>
        set((state) => ({ nlp: { ...state.nlp, matches } })),
      setNLPLoading: (isLoading) =>
        set((state) => ({ nlp: { ...state.nlp, isLoading } })),
      setNLPError: (error) =>
        set((state) => ({ nlp: { ...state.nlp, error } })),

      // ── UI ──
      ui: {
        activeView: "dashboard",
        oracleModalOpen: false,
        resultsVisible: false,
      },
      setActiveView: (activeView) =>
        set((state) => ({ ui: { ...state.ui, activeView } })),
      setOracleModalOpen: (oracleModalOpen) =>
        set((state) => ({ ui: { ...state.ui, oracleModalOpen } })),
      setResultsVisible: (resultsVisible) =>
        set((state) => ({ ui: { ...state.ui, resultsVisible } })),
    }),
    { name: "BoxOfficeScienceStore" }
  )
);
