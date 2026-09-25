import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "./auth.api";
import { taxpayerApi } from "./taxpayer.api";
import type { LoginPayload, RegisterPayload } from "../types/auth.types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

/**
 * The session query. Every other piece of auth-derived state (current user,
 * isAdmin, isSubscriber — see `hooks/useAuth.ts`) reads from this cache
 * rather than duplicating it in a separate store; this *is* the app's server
 * state for "who am I", so React Query owns it, not Zustand.
 */
export function useMeQuery() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    // Session state rarely changes on its own; mutations below invalidate it
    // explicitly when it does.
    staleTime: 5 * 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

/** Looks a company up by tax number for the registration form; nothing is cached or stored. */
export function useTaxpayerLookupMutation() {
  return useMutation({ mutationFn: (taxNumber: string) => taxpayerApi.lookup(taxNumber) });
}
