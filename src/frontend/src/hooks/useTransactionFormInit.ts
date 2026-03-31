import { useEffect, useRef } from "react";

interface UseTransactionFormInitOptions {
  open: boolean;
  transactionId?: bigint;
}

/**
 * Hook to track TransactionForm initialization state and prevent render loops.
 * Returns a stable key that changes only when the dialog opens or the mode changes.
 */
export function useTransactionFormInit({
  open,
  transactionId,
}: UseTransactionFormInitOptions) {
  const prevOpenRef = useRef(false);
  const initKeyRef = useRef(0);
  const prevTransactionIdRef = useRef<bigint | undefined>(undefined);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    const isNowOpen = open;
    const modeChanged = prevTransactionIdRef.current !== transactionId;

    // Increment key only on open transition or mode change
    if ((!wasOpen && isNowOpen) || (isNowOpen && modeChanged)) {
      initKeyRef.current += 1;
    }

    prevOpenRef.current = open;
    prevTransactionIdRef.current = transactionId;
  }, [open, transactionId]);

  return {
    initKey: initKeyRef.current,
    shouldInitialize: open && prevOpenRef.current !== open,
  };
}
