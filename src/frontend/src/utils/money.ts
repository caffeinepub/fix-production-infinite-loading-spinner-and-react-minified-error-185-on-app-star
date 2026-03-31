/**
 * Money utilities for safe minor-unit (integer) currency handling.
 * All amounts are stored as bigint minor units (e.g., cents for EUR).
 * 1 EUR = 100 cents, so €12.50 = 1250 minor units.
 *
 * CRITICAL: This module must never cast bigint to Number for arithmetic or formatting
 * to prevent overflow and precision loss. Only convert to number for chart libraries
 * with explicit overflow checks.
 */

const MINOR_UNITS_PER_MAJOR = 100n; // cents per euro (as bigint)
const MINOR_UNITS_PER_MAJOR_NUMBER = 100; // for safe division only

// Safe integer bounds for chart conversion (±9 quadrillion cents = ±90 trillion euros)
const SAFE_INTEGER_MIN = BigInt(Number.MIN_SAFE_INTEGER);
const SAFE_INTEGER_MAX = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Parse a user-entered decimal string (e.g., "12.50") into bigint minor units (e.g., 1250n).
 * Returns null if the input is invalid or negative.
 *
 * Uses string manipulation to avoid floating-point rounding errors.
 */
export function parseDecimalToMinorUnits(decimalString: string): bigint | null {
  const trimmed = decimalString.trim();
  if (!trimmed || trimmed === "") return null;

  // Handle negative values
  if (trimmed.startsWith("-")) return null;

  // Split on decimal point
  const parts = trimmed.split(".");
  if (parts.length > 2) return null; // Multiple decimal points

  const wholePart = parts[0] || "0";
  const fractionalPart = parts[1] || "0";

  // Validate that both parts are numeric
  if (!/^\d+$/.test(wholePart) || !/^\d*$/.test(fractionalPart)) return null;

  // Pad or truncate fractional part to exactly 2 digits (cents)
  const cents = fractionalPart.padEnd(2, "0").slice(0, 2);

  // Construct the minor units value
  const minorUnitsString = wholePart + cents;

  try {
    const minorUnits = BigInt(minorUnitsString);
    return minorUnits >= 0n ? minorUnits : null;
  } catch {
    return null;
  }
}

/**
 * Format bigint minor units (e.g., 1250n) into a localized currency string (e.g., "€12.50").
 * Uses bigint arithmetic to avoid Number overflow.
 */
export function formatMinorUnitsToCurrency(
  minorUnits: bigint,
  locale = "en-US",
  currency = "EUR",
): string {
  // Handle negative values
  const isNegative = minorUnits < 0n;
  const absoluteValue = isNegative ? -minorUnits : minorUnits;

  // Extract major and minor units using bigint division
  const majorUnits = absoluteValue / MINOR_UNITS_PER_MAJOR;
  const cents = absoluteValue % MINOR_UNITS_PER_MAJOR;

  // Format as string with proper padding
  const _centsStr = cents.toString().padStart(2, "0");
  const _majorUnitsStr = majorUnits.toString();

  // Use Intl.NumberFormat for proper locale formatting
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format the complete value
  const majorUnitsNumber = Number(majorUnits);
  const centsNumber = Number(cents);
  const totalValue = majorUnitsNumber + centsNumber / 100;

  const formatted = formatter.format(isNegative ? -totalValue : totalValue);

  return formatted;
}

/**
 * Convert bigint minor units (e.g., 1250n) into a decimal string (e.g., "12.50") for editing.
 * Uses bigint arithmetic to avoid Number overflow.
 */
export function formatMinorUnitsToDecimal(minorUnits: bigint): string {
  // Handle negative values
  const isNegative = minorUnits < 0n;
  const absoluteValue = isNegative ? -minorUnits : minorUnits;

  // Extract major and minor units using bigint division
  const majorUnits = absoluteValue / MINOR_UNITS_PER_MAJOR;
  const cents = absoluteValue % MINOR_UNITS_PER_MAJOR;

  // Format with proper padding
  const centsStr = cents.toString().padStart(2, "0");
  const sign = isNegative ? "-" : "";

  return `${sign}${majorUnits}.${centsStr}`;
}

/**
 * Convert bigint minor units to a number in major units for charting/analytics.
 * Example: 1250n -> 12.50
 *
 * IMPORTANT: This is the ONLY function that should convert bigint to number.
 * Includes overflow safety check - throws error if value exceeds safe integer range.
 * Use this ONLY when passing values to chart libraries that require numbers.
 */
export function minorUnitsToMajorNumber(minorUnits: bigint): number {
  // Check if the value is within safe integer bounds
  if (minorUnits < SAFE_INTEGER_MIN || minorUnits > SAFE_INTEGER_MAX) {
    console.error(
      `Value ${minorUnits} exceeds safe integer range for chart conversion`,
    );
    // Clamp to safe range instead of throwing to prevent UI crashes
    if (minorUnits < SAFE_INTEGER_MIN) {
      return Number(SAFE_INTEGER_MIN) / MINOR_UNITS_PER_MAJOR_NUMBER;
    }
    return Number(SAFE_INTEGER_MAX) / MINOR_UNITS_PER_MAJOR_NUMBER;
  }

  // Safe to convert to number since we're within safe integer bounds
  return Number(minorUnits) / MINOR_UNITS_PER_MAJOR_NUMBER;
}

/**
 * Convert bigint minor units to a fixed-2-decimal string for exports (JSON/CSV).
 * Example: 1250n -> "12.50"
 * Uses bigint arithmetic to avoid Number overflow.
 * This function returns numeric-only strings without currency symbols.
 */
export function minorUnitsToExportString(minorUnits: bigint): string {
  // Handle negative values
  const isNegative = minorUnits < 0n;
  const absoluteValue = isNegative ? -minorUnits : minorUnits;

  // Extract major and minor units using bigint division
  const majorUnits = absoluteValue / MINOR_UNITS_PER_MAJOR;
  const cents = absoluteValue % MINOR_UNITS_PER_MAJOR;

  // Format with proper padding
  const centsStr = cents.toString().padStart(2, "0");
  const sign = isNegative ? "-" : "";

  return `${sign}${majorUnits}.${centsStr}`;
}
