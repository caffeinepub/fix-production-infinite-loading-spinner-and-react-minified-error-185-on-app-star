import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

interface InitializationTimeoutScreenProps {
  onReload: () => void;
  onNavigateHome: () => void;
}

export default function InitializationTimeoutScreen({
  onReload,
  onNavigateHome,
}: InitializationTimeoutScreenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle>Initialization Timeout</CardTitle>
          <CardDescription>
            The application is taking longer than expected to initialize
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This may be due to a slow network connection or a temporary
              service issue.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground text-center">
            Please try reloading the page or return to the home screen.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onReload} className="w-full gap-2" variant="default">
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
          <Button
            onClick={onNavigateHome}
            className="w-full gap-2"
            variant="outline"
          >
            <Home className="h-4 w-4" />
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
