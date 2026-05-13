// import { useQuery } from "@tanstack/react-query";
// import apiClient from "@/lib/api";
// import type { AuditEvent, PlatformStats, UserSummary } from "@/types";
//
// export function useAdminUsers() {
//   return useQuery({
//     queryKey: ["admin", "users"],
//     queryFn: async (): Promise<UserSummary[]> => {
//       const { data } = await apiClient.get<UserSummary[]>("/api/v1/admin/users");
//       return data;
//     },
//   });
// }
//
// export function useAdminStats() {
//   return useQuery({
//     queryKey: ["admin", "stats"],
//     queryFn: async (): Promise<PlatformStats> => {
//       const { data } = await apiClient.get<PlatformStats>("/api/v1/admin/stats");
//       return data;
//     },
//     refetchInterval: 30_000, // refresh every 30 s
//   });
// }
//
// export function useAuditLog() {
//   return useQuery({
//     queryKey: ["admin", "audit"],
//     queryFn: async (): Promise<AuditEvent[]> => {
//       const { data } = await apiClient.get<AuditEvent[]>("/api/v1/admin/audit");
//       return data;
//     },
//   });
// }


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { AuditEvent, PlatformStats, UserSummary } from "@/types";

export function useAdminUsers() {
    return useQuery({
        queryKey: ["admin", "users"],
        queryFn: async (): Promise<UserSummary[]> => {
            const { data } = await apiClient.get<UserSummary[]>("/api/v1/admin/users");
            return data;
        },
    });
}

export function useAdminStats() {
    return useQuery({
        queryKey: ["admin", "stats"],
        queryFn: async (): Promise<PlatformStats> => {
            const { data } = await apiClient.get<PlatformStats>("/api/v1/admin/stats");
            return data;
        },
        refetchInterval: 30_000,
    });
}

export function useAuditLog() {
    return useQuery({
        queryKey: ["admin", "audit"],
        queryFn: async (): Promise<AuditEvent[]> => {
            const { data } = await apiClient.get<AuditEvent[]>("/api/v1/admin/audit");
            return data;
        },
    });
}

// ── NEW: role promotion/demotion mutation ─────────────────────────────────────
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               userId,
                               role,
                           }: {
            userId: string;
            role: "user" | "admin";
        }) => {
            const { error } = await supabase
                .from("profiles")
                .update({ role })
                .eq("id", userId);

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            // Refresh the user list after a role change
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        },
    });
}