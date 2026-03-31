import type { QueryClient } from "@tanstack/react-query";

/**
 * Helper to wait for actor initialization with timeout.
 * Looks up the actor using the principal-aware query key pattern.
 * Returns a ready actor or throws a user-friendly error.
 */
export async function waitForActorReady(
  queryClient: QueryClient,
  principalString: string | undefined,
  timeoutMs = 8000,
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Look for actor query with the principal suffix (same pattern as useActor)
      const actorQueryState = queryClient.getQueryState([
        "actor",
        principalString,
      ]);

      if (actorQueryState?.data) {
        return actorQueryState.data;
      }

      // Check if there's an error
      if (actorQueryState?.error) {
        throw new Error(
          "Actor initialization failed. Please refresh the page and try again.",
        );
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 150));
    } catch (_error) {
      // If we catch an error during the check, continue waiting unless timeout
      if (Date.now() - startTime >= timeoutMs) {
        throw new Error(
          "The app is still initializing. Please refresh the page and try again.",
        );
      }
    }
  }

  throw new Error(
    "The app is still initializing. Please refresh the page and try again.",
  );
}
