// src/types/index.ts
// Central domain types — kept in sync with backend Pydantic schemas

export type ModelType = "tumor" | "stroke";

export interface TopResult extends Record<string, unknown> {
  label: string;
  confidence: number;
}

export interface Prediction extends Record<string, unknown> {
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

export interface Profile extends Record<string, unknown> {
    id: string;
    full_name: string | null;
    email: string | null;        // ← add this line
    role: "user" | "admin";
    avatar_url: string | null;
    created_at: string;
}

// Admin-only types
export interface UserSummary {
    id: string;
    full_name: string | null;
    email: string | null;        // ← add this line
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

export interface AuditEvent extends Record<string, unknown> {
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
        Relationships: [];
      };
      predictions: {
        Row: Prediction;
        Insert: Omit<Prediction, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      audit_log: {
        Row: AuditEvent;
        Insert: Omit<AuditEvent, "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
