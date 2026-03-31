/**
 * Truncates a principal string to a short form for display.
 * @param principal - The full principal string
 * @param prefixLength - Number of characters to show at the start (default: 5)
 * @param suffixLength - Number of characters to show at the end (default: 3)
 * @returns Truncated principal in format "prefix...suffix"
 */
export function truncatePrincipal(
  principal: string,
  prefixLength = 5,
  suffixLength = 3,
): string {
  if (principal.length <= prefixLength + suffixLength + 3) {
    return principal;
  }
  return `${principal.slice(0, prefixLength)}...${principal.slice(-suffixLength)}`;
}

/**
 * Copies text to clipboard using the Clipboard API.
 * @param text - The text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      textArea.remove();
    } catch (_error) {
      textArea.remove();
      throw new Error("Failed to copy to clipboard");
    }
  }
}
