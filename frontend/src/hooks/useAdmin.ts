import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";
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
    refetchInterval: 30_000, // refresh every 30 s
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
