// src/types/index.ts
// Central domain types — kept in sync with backend Pydantic schemas

export type ModelType = "tumor" | "stroke";

export interface TopResult {
  label: string;
  confidence: number;
}

export interface Prediction {
  id: string;
  model_type: ModelType;
  result: string;
  confidence_score: number;
  top_3_results: TopResult[];
  image_path: string;
  gradcam_path: string | null;
  model_version: string;
  created_at: string;
  low_confidence_warning?: boolean;
}

export interface PredictRequest {
  image_path: string;
  model_type: ModelType;
  user_id: string;
}

export interface PredictResponse extends Prediction {
  prediction_id: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: "user" | "admin";
  avatar_url: string | null;
  created_at: string;
}

// Admin-only types
export interface UserSummary {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  scan_count: number;
}

export interface PlatformStats {
  total_users: number;
  total_predictions: number;
  tumor_predictions: number;
  stroke_predictions: number;
  avg_confidence: number;
  predictions_today: number;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  user_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Supabase DB type stub (expand with Supabase CLI: supabase gen types) ──────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      predictions: {
        Row: Prediction;
        Insert: Omit<Prediction, "id" | "created_at">;
        Update: never;
      };
      audit_log: {
        Row: AuditEvent;
        Insert: Omit<AuditEvent, "id" | "created_at">;
        Update: never;
      };
    };
  };
}
