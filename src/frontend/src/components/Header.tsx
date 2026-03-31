import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Receipt,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import PrincipalIndicator from "./PrincipalIndicator";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: "/login" });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error("Login error:", error);
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo/Brand - Fixed on left */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold whitespace-nowrap">
            Restaurant Finance
          </h1>
        </div>

        {/* Navigation - Scrollable horizontally with hidden scrollbar */}
        {isAuthenticated && (
          <nav className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide">
            <div className="flex items-center gap-2 whitespace-nowrap min-w-max px-2">
              <Button
                variant={currentPath === "/dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate({ to: "/dashboard" })}
                className="gap-2 flex-shrink-0"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant={currentPath === "/analytics" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate({ to: "/analytics" })}
                className="gap-2 flex-shrink-0"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button
                variant={currentPath === "/" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate({ to: "/" })}
                className="gap-2 flex-shrink-0"
              >
                <Receipt className="h-4 w-4" />
                Transactions
              </Button>
              <Button
                variant={currentPath === "/reports" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate({ to: "/reports" })}
                className="gap-2 flex-shrink-0"
              >
                <FileText className="h-4 w-4" />
                Reports
              </Button>
            </div>
          </nav>
        )}

        {/* Right side controls - Fixed on right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated && !profileLoading && userProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{userProfile.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{userProfile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {userProfile.restaurantName}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {isAuthenticated && identity && (
            <PrincipalIndicator identity={identity} />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          {!isInitializing && (
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? "outline" : "default"}
              size="sm"
              className="gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing In...
                </>
              ) : isAuthenticated ? (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
