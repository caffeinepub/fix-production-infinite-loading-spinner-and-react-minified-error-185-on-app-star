import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Banner that detects embedded contexts (e.g., iframe) and shows a warning
 * with an action to open the app in a new tab.
 */
export default function EmbeddedContextBanner() {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Detect if running in an iframe
    try {
      setIsEmbedded(window.self !== window.top);
    } catch (_e) {
      // If we can't access window.top due to cross-origin, assume embedded
      setIsEmbedded(true);
    }
  }, []);

  const handleOpenInNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  if (!isEmbedded) {
    return null;
  }

  return (
    <Alert variant="default" className="mb-4 border-warning bg-warning/10">
      <AlertTriangle className="h-4 w-4 text-warning" />
      <AlertTitle>Preview Mode</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          Some features may be limited in preview mode. For the best experience,
          open the app in a new tab.
        </span>
        <Button
          onClick={handleOpenInNewTab}
          variant="outline"
          size="sm"
          className="gap-2 whitespace-nowrap"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </Button>
      </AlertDescription>
    </Alert>
  );
}
