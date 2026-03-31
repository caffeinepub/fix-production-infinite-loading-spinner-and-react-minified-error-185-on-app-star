import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

interface ActorReadinessState {
  isReady: boolean;
  isInitializing: boolean;
  error: Error | null;
  retry: () => void;
}

/**
 * Hook that derives reactive actor readiness/error state from React Query
 * and exposes a retry action for actor initialization.
 */
export function useActorReadiness(): ActorReadinessState {
  const queryClient = useQueryClient();
  const { identity, isInitializing: identityInitializing } =
    useInternetIdentity();
  const principalString = identity?.getPrincipal().toString();

  const [state, setState] = useState<Omit<ActorReadinessState, "retry">>({
    isReady: false,
    isInitializing: true,
    error: null,
  });

  // Memoize retry function to prevent unnecessary re-renders
  const retry = useCallback(() => {
    try {
      if (principalString) {
        queryClient.invalidateQueries({ queryKey: ["actor", principalString] });
        queryClient.refetchQueries({ queryKey: ["actor", principalString] });
      }
    } catch (error) {
      console.error("Error during actor retry:", error);
    }
  }, [queryClient, principalString]);

  // Track previous state to avoid unnecessary updates
  const prevStateRef = useRef(state);

  useEffect(() => {
    // If identity is still initializing, keep initializing state
    if (identityInitializing) {
      const newState = {
        isReady: false,
        isInitializing: true,
        error: null,
      };

      // Only update if state actually changed
      if (
        prevStateRef.current.isReady !== newState.isReady ||
        prevStateRef.current.isInitializing !== newState.isInitializing ||
        prevStateRef.current.error !== newState.error
      ) {
        prevStateRef.current = newState;
        setState(newState);
      }
      return;
    }

    // Subscribe to actor query state changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.query?.queryKey[0] === "actor" &&
        event?.query?.queryKey[1] === principalString
      ) {
        const queryState = queryClient.getQueryState([
          "actor",
          principalString,
        ]);

        const newState = {
          isReady: !!queryState?.data,
          isInitializing: queryState?.fetchStatus === "fetching",
          error: queryState?.error as Error | null,
        };

        // Only update if state actually changed
        if (
          prevStateRef.current.isReady !== newState.isReady ||
          prevStateRef.current.isInitializing !== newState.isInitializing ||
          prevStateRef.current.error !== newState.error
        ) {
          prevStateRef.current = newState;
          setState(newState);
        }
      }
    });

    // Initial state check
    const queryState = queryClient.getQueryState(["actor", principalString]);
    const initialState = {
      isReady: !!queryState?.data,
      isInitializing: queryState?.fetchStatus === "fetching",
      error: queryState?.error as Error | null,
    };

    // Only update if state actually changed
    if (
      prevStateRef.current.isReady !== initialState.isReady ||
      prevStateRef.current.isInitializing !== initialState.isInitializing ||
      prevStateRef.current.error !== initialState.error
    ) {
      prevStateRef.current = initialState;
      setState(initialState);
    }

    return unsubscribe;
  }, [queryClient, principalString, identityInitializing]);

  return {
    ...state,
    retry,
  };
}
