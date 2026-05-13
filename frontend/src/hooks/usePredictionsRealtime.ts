/**
 * usePredictionsRealtime.ts
 * ─────────────────────────
 * Subscribes to Supabase Realtime INSERT events on the predictions table
 * scoped to the current authenticated user.
 *
 * When a new prediction arrives it is prepended directly into the
 * TanStack Query cache — no full refetch needed, UI updates instantly.
 *
 * The channel is cleaned up automatically when the component unmounts.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { predictionKeys } from "@/hooks/usePredictions";
import type { Prediction } from "@/types";

export function usePredictionsRealtime(userId: string | undefined) {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        // Don't subscribe if we don't have a user yet
        if (!userId) return;

        // Clean up any existing channel before creating a new one
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
        }

        const channel = supabase
            .channel(`predictions:${userId}`)          // unique channel name per user
            .on(
                "postgres_changes",
                {
                    event: "INSERT",                        // only care about new rows
                    schema: "public",
                    table: "predictions",
                    filter: `user_id=eq.${userId}`,         // scoped to this user only
                },
                (payload) => {
                    const newPrediction = payload.new as Prediction;

                    // Merge the new prediction into the existing TanStack Query cache
                    // by prepending it to the list — no network request fired
                    queryClient.setQueryData<Prediction[]>(
                        predictionKeys.list(),
                        (existing) => {
                            if (!existing) return [newPrediction];

                            // Prevent duplicates if TanStack Query also refetched
                            const alreadyExists = existing.some((p) => p.id === newPrediction.id);
                            if (alreadyExists) return existing;

                            return [newPrediction, ...existing];
                        },
                    );

                    // Also seed the detail cache so navigating to /history/:id
                    // is instant — no additional fetch needed
                    queryClient.setQueryData(
                        predictionKeys.detail(newPrediction.id),
                        newPrediction,
                    );
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "predictions",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const deletedId = (payload.old as { id: string }).id;

                    // Remove the deleted prediction from the list cache
                    queryClient.setQueryData<Prediction[]>(
                        predictionKeys.list(),
                        (existing) => existing?.filter((p) => p.id !== deletedId) ?? [],
                    );

                    // Remove detail cache entry too
                    queryClient.removeQueries({
                        queryKey: predictionKeys.detail(deletedId),
                    });
                },
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.debug(`[Realtime] Subscribed to predictions for user ${userId.slice(0, 8)}…`);
                }
                if (status === "CHANNEL_ERROR") {
                    console.error("[Realtime] Channel error — will retry automatically");
                }
            });

        channelRef.current = channel;

        // Cleanup: unsubscribe when component unmounts or userId changes
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [userId, queryClient]);
}