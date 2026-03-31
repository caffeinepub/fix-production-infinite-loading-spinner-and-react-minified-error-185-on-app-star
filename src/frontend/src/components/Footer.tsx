import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container flex h-16 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          © 2025. Built with{" "}
          <Heart className="inline h-4 w-4 fill-destructive text-destructive" />{" "}
          using{" "}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
