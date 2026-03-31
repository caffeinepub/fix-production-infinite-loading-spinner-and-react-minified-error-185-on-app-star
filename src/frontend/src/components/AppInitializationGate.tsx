import { useEffect, useRef, useState } from "react";
import { useActorReadiness } from "../hooks/useActorReadiness";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import InitializationTimeoutScreen from "./InitializationTimeoutScreen";

interface AppInitializationGateProps {
  children: React.ReactNode;
  timeoutMs?: number;
}

export default function AppInitializationGate({
  children,
  timeoutMs = 15000, // 15 seconds default timeout
}: AppInitializationGateProps) {
  const { identity, isInitializing: identityInitializing } =
    useInternetIdentity();
  const actorReadiness = useActorReadiness();
  const { isReady, isInitializing: actorInitializing, error } = actorReadiness;
  const [showTimeout, setShowTimeout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diagnosticsLoggedRef = useRef(false);

  const isAuthenticated = !!identity;
  const isInitializing =
    identityInitializing || (isAuthenticated && actorInitializing);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset timeout screen when initialization completes or error occurs
    if (!isInitializing || error) {
      setShowTimeout(false);
      diagnosticsLoggedRef.current = false;
      return;
    }

    // Set timeout for initialization
    timeoutRef.current = setTimeout(() => {
      setShowTimeout(true);

      // Log diagnostics once when timeout occurs
      if (!diagnosticsLoggedRef.current) {
        diagnosticsLoggedRef.current = true;
        // Capture error message outside the narrowed scope
        const currentError = actorReadiness.error;
        const errorMessage = currentError ? currentError.message : null;
        console.error("[AppInitializationGate] Initialization timeout", {
          route: window.location.pathname,
          isAuthenticated,
          identityPresent: !!identity,
          identityInitializing,
          actorInitializing,
          actorReady: isReady,
          actorError: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    isInitializing,
    error,
    timeoutMs,
    isAuthenticated,
    identity,
    identityInitializing,
    actorInitializing,
    isReady,
    actorReadiness,
  ]);

  // Show timeout screen if initialization is taking too long
  if (showTimeout && isInitializing) {
    return (
      <InitializationTimeoutScreen
        onReload={() => window.location.reload()}
        onNavigateHome={() => {
          window.location.href = "/login";
        }}
      />
    );
  }

  // Show loading spinner during normal initialization
  if (isInitializing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
