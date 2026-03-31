import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AdminAuthStatus,
  Category,
  DiagnosticsStats,
  MigrationState,
  MonthlyStats,
  Transaction,
  UserProfile,
} from "../backend";
import { waitForActorReady } from "../utils/actorReady";
import { useActor } from "./useActor";
import { useCurrentUtcYearMonth } from "./useCurrentUtcYearMonth";
import { useInternetIdentity } from "./useInternetIdentity";

// Query key factory
const transactionKeys = {
  all: ["transactions"] as const,
  byCategory: (category: Category) =>
    ["transactions", "category", category] as const,
  monthlyStats: (yearMonth: string) =>
    ["transactions", "monthly-stats", yearMonth] as const,
};

const userKeys = {
  currentProfile: ["currentUserProfile"] as const,
};

const diagnosticsKeys = {
  stats: ["diagnostics", "stats"] as const,
  migration: ["diagnostics", "migration"] as const,
  callerPrincipal: ["diagnostics", "caller-principal"] as const,
  adminAuthStatus: ["diagnostics", "admin-auth-status"] as const,
};

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: userKeys.currentProfile,
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      try {
        if (!actor) {
          const principalString = identity?.getPrincipal().toString();
          const readyActor = await waitForActorReady(
            queryClient,
            principalString,
          );
          return readyActor.saveCallerUserProfile(profile);
        }
        return actor.saveCallerUserProfile(profile);
      } catch (error: any) {
        throw new Error(
          error.message || "Failed to save profile. Please try again.",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.currentProfile });
    },
    onError: (error: any) => {
      console.error("Failed to save profile:", error);
      toast.error(error.message || "Failed to save profile");
    },
  });
}

// Get all transactions
export function useGetAllTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: transactionKeys.all,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

// Get transactions by category
export function useGetTransactionsByCategory(category: Category) {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: transactionKeys.byCategory(category),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionsByCategory(category);
    },
    enabled: !!actor && !isFetching,
  });
}

// Get current month statistics with month-aware cache key and focus/interval refetch
export function useGetCurrentMonthStats() {
  const { actor, isFetching } = useActor();
  const currentYearMonth = useCurrentUtcYearMonth();

  return useQuery<MonthlyStats>({
    queryKey: transactionKeys.monthlyStats(currentYearMonth),
    queryFn: async () => {
      if (!actor) {
        return {
          totalIncome: BigInt(0),
          totalExpenses: BigInt(0),
          netProfit: BigInt(0),
          expensesByCategory: {
            food: BigInt(0),
            drinks: BigInt(0),
            wages: BigInt(0),
            rent: BigInt(0),
            utilities: BigInt(0),
            other: BigInt(0),
          },
          incomeByCategory: {
            cash: BigInt(0),
            card: BigInt(0),
          },
        } as MonthlyStats;
      }
      return actor.getCurrentMonthStats();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchIntervalInBackground: false,
  });
}

// Get diagnostics stats (admin only) - now supports conditional enabling
export function useGetDiagnosticsStats(enabled = true) {
  const { actor, isFetching } = useActor();

  return useQuery<DiagnosticsStats>({
    queryKey: diagnosticsKeys.stats,
    queryFn: async () => {
      if (!actor) {
        return {
          totalTransactions: BigInt(0),
          totalUserProfiles: BigInt(0),
          nextTransactionId: BigInt(0),
        };
      }
      return actor.getDiagnosticsStats();
    },
    enabled: !!actor && !isFetching && enabled,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Get legacy scaling migration diagnostics (admin only) - now supports conditional enabling
export function useGetLegacyScalingDiagnostics(enabled = true) {
  const { actor, isFetching } = useActor();

  return useQuery<MigrationState>({
    queryKey: diagnosticsKeys.migration,
    queryFn: async () => {
      if (!actor) {
        return {
          legacyScalingApplied: false,
          legacyCutoffId: BigInt(0),
        };
      }
      return actor.getLegacyScalingDiagnostics();
    },
    enabled: !!actor && !isFetching && enabled,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Get backend caller principal as text (for troubleshooting)
export function useGetCallerPrincipalAsText() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: diagnosticsKeys.callerPrincipal,
    queryFn: async () => {
      if (!actor) return "";
      return actor.getCallerPrincipalAsText();
    },
    enabled: !!actor && !isFetching,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Get backend admin auth status (for troubleshooting) - always enabled, never traps
export function useGetAdminAuthStatus() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminAuthStatus | null>({
    queryKey: diagnosticsKeys.adminAuthStatus,
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAdminAuthStatus();
    },
    enabled: !!actor && !isFetching,
    retry: false,
    refetchOnWindowFocus: true,
  });
}

// Add transaction
export function useAddTransaction() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: bigint;
      description: string;
      date: string;
      category: Category;
    }) => {
      try {
        if (!actor) {
          const principalString = identity?.getPrincipal().toString();
          const readyActor = await waitForActorReady(
            queryClient,
            principalString,
          );
          return readyActor.addTransaction(
            data.amount,
            data.description,
            data.date,
            data.category,
          );
        }
        return actor.addTransaction(
          data.amount,
          data.description,
          data.date,
          data.category,
        );
      } catch (error: any) {
        throw new Error(
          error.message || "Failed to add transaction. Please try again.",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["transactions", "monthly-stats"],
      });
      queryClient.invalidateQueries({ queryKey: diagnosticsKeys.stats });
      toast.success("Transaction added successfully");
    },
    onError: (error: any) => {
      const message = error.message || "Failed to add transaction";
      toast.error(message);
    },
  });
}

// Edit transaction
export function useEditTransaction() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      amount: bigint;
      description: string;
      date: string;
      category: Category;
    }) => {
      try {
        if (!actor) {
          const principalString = identity?.getPrincipal().toString();
          const readyActor = await waitForActorReady(
            queryClient,
            principalString,
          );
          return readyActor.editTransaction(
            data.id,
            data.amount,
            data.description,
            data.date,
            data.category,
          );
        }
        return actor.editTransaction(
          data.id,
          data.amount,
          data.description,
          data.date,
          data.category,
        );
      } catch (error: any) {
        throw new Error(
          error.message || "Failed to update transaction. Please try again.",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["transactions", "monthly-stats"],
      });
      toast.success("Transaction updated successfully");
    },
    onError: (error: any) => {
      const message = error.message || "Failed to update transaction";
      toast.error(message);
    },
  });
}

// Delete transaction
export function useDeleteTransaction() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      try {
        if (!actor) {
          const principalString = identity?.getPrincipal().toString();
          const readyActor = await waitForActorReady(
            queryClient,
            principalString,
          );
          return readyActor.deleteTransaction(id);
        }
        return actor.deleteTransaction(id);
      } catch (error: any) {
        throw new Error(
          error.message || "Failed to delete transaction. Please try again.",
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["transactions", "monthly-stats"],
      });
      queryClient.invalidateQueries({ queryKey: diagnosticsKeys.stats });
      toast.success("Transaction deleted successfully");
    },
    onError: (error: any) => {
      const message = error.message || "Failed to delete transaction";
      toast.error(message);
    },
  });
}
