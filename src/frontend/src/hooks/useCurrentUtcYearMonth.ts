import { useEffect, useState } from "react";

/**
 * Stable UTC year-month key (e.g., "2026-02") at module level to avoid
 * exhaustive-deps warning and ensure referential stability.
 */
const getUtcYearMonth = (): string => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

/**
 * Hook that returns a stable UTC year-month key and updates it
 * on window focus and on a timer/interval so month changes trigger
 * React re-renders and month-aware query keys.
 */
export function useCurrentUtcYearMonth(): string {
  const [yearMonth, setYearMonth] = useState<string>(getUtcYearMonth);

  useEffect(() => {
    const handleFocus = () => {
      setYearMonth(getUtcYearMonth());
    };

    window.addEventListener("focus", handleFocus);

    const interval = setInterval(
      () => {
        setYearMonth(getUtcYearMonth());
      },
      5 * 60 * 1000,
    );

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  return yearMonth;
}
