import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { LogIn, Receipt } from "lucide-react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

export default function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile, isFetched } = useGetCallerUserProfile();

  const isLoggingIn = loginStatus === "logging-in";

  useEffect(() => {
    if (identity && isFetched) {
      if (!userProfile) {
        navigate({ to: "/profile-setup" });
      } else {
        navigate({ to: "/" });
      }
    }
  }, [identity, userProfile, isFetched, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Welcome to Restaurant Finance
          </CardTitle>
          <CardDescription>
            Sign in with Internet Identity to access your financial tracking
            dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full gap-2"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Sign In with Internet Identity
              </>
            )}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            <p>Secure authentication powered by the Internet Computer</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
