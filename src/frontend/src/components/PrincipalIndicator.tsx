import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { copyToClipboard, truncatePrincipal } from "@/utils/principal";
import type { Identity } from "@icp-sdk/core/agent";
import { Check, Copy, User } from "lucide-react";
import { useState } from "react";

interface PrincipalIndicatorProps {
  identity: Identity;
}

export default function PrincipalIndicator({
  identity,
}: PrincipalIndicatorProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const fullPrincipal = identity.getPrincipal().toString();
  const shortPrincipal = truncatePrincipal(fullPrincipal);

  const handleCopy = async () => {
    try {
      await copyToClipboard(fullPrincipal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy principal:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 font-mono text-xs"
          aria-label="View principal"
        >
          <User className="h-3 w-3" />
          <span className="hidden sm:inline">{shortPrincipal}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-1">Your Principal</h4>
            <p className="text-xs text-muted-foreground">
              This is your unique Internet Identity principal for this
              application.
            </p>
          </div>
          <div className="rounded-md bg-muted p-3 break-all font-mono text-xs">
            {fullPrincipal}
          </div>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Principal
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
