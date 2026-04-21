import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/api";
import type { Prediction, PredictRequest, PredictResponse } from "@/types";

// ── Query keys ────────────────────────────────────────────────────────────────
export const predictionKeys = {
  all: ["predictions"] as const,
  list: () => [...predictionKeys.all, "list"] as const,
  detail: (id: string) => [...predictionKeys.all, "detail", id] as const,
};

// ── Fetch prediction history (server-side via FastAPI + RLS) ──────────────────
export function usePredictions() {
  return useQuery({
    queryKey: predictionKeys.list(),
    queryFn: async (): Promise<Prediction[]> => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw new Error(error.message);
      return (data ?? []) as Prediction[];
    },
  });
}

// ── Single prediction detail ──────────────────────────────────────────────────
export function usePrediction(id: string) {
  return useQuery({
    queryKey: predictionKeys.detail(id),
    queryFn: async (): Promise<Prediction> => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data as Prediction;
    },
    enabled: !!id,
  });
}

// ── Run inference mutation ────────────────────────────────────────────────────
export function useRunInference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: PredictRequest): Promise<PredictResponse> => {
      const { data } = await apiClient.post<PredictResponse>(
        "/api/v1/predictions/predict",
        req,
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate history so the new result appears immediately
      queryClient.invalidateQueries({ queryKey: predictionKeys.list() });
    },
  });
}

// ── Delete prediction ─────────────────────────────────────────────────────────
export function useDeletePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("predictions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: predictionKeys.list() });
    },
  });
}

// ── Get presigned URL for an image path ──────────────────────────────────────
export async function getSignedUrl(
  bucket: "scan-images" | "gradcam-maps",
  path: string,
  expiresIn = 3600,
): Promise<string> {
  // Strip bucket prefix if present
  const objectPath = path.startsWith(bucket + "/")
    ? path.slice(bucket.length + 1)
    : path;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, expiresIn);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}
