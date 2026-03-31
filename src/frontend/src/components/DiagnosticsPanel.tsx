import {
  AlertCircle,
  CheckCircle2,
  Database,
  Hash,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAdminAuthStatus,
  useGetCallerPrincipalAsText,
  useGetDiagnosticsStats,
  useGetLegacyScalingDiagnostics,
} from "../hooks/useQueries";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export default function DiagnosticsPanel() {
  const { identity } = useInternetIdentity();
  const { data: adminAuthStatus, isLoading: authLoading } =
    useGetAdminAuthStatus();
  const { data: callerPrincipal } = useGetCallerPrincipalAsText();

  const frontendPrincipal =
    identity?.getPrincipal().toString() || "Not logged in";
  const backendPrincipal =
    adminAuthStatus?.principalText || callerPrincipal || "Unknown";
  const isAdmin = adminAuthStatus?.isAuthenticated || false;

  // Only fetch diagnostics data if user is confirmed admin
  const { data: stats, isLoading: statsLoading } =
    useGetDiagnosticsStats(isAdmin);
  const { data: migrationState, isLoading: migrationLoading } =
    useGetLegacyScalingDiagnostics(isAdmin);

  // Show loading state while checking auth status
  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
          <CardDescription>Checking authorization...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Not logged in
  if (!identity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Authentication Required
          </CardTitle>
          <CardDescription>Please log in to view diagnostics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only administrators can view diagnostics. This panel verifies that
            all data persists correctly across canister upgrades.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identity Troubleshooting
            </CardTitle>
            <CardDescription>
              Use this information to verify your authentication status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Frontend Internet Identity Principal
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      The principal you're logged in with
                    </p>
                  </div>
                </div>
                <p className="mt-2 font-mono text-xs break-all bg-muted p-2 rounded">
                  {frontendPrincipal}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Backend Caller Principal
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      The principal the backend sees
                    </p>
                  </div>
                </div>
                <p className="mt-2 font-mono text-xs break-all bg-muted p-2 rounded">
                  {backendPrincipal}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Backend Admin Status</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Whether the backend recognizes you as admin
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold">Not Admin</p>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Troubleshooting Hint</AlertTitle>
              <AlertDescription>
                If you're unable to access diagnostics, please:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    Sign out and sign back in with the intended Internet
                    Identity principal
                  </li>
                  <li>
                    Verify you are using the intended environment (draft vs
                    live)
                  </li>
                  <li>
                    Ensure the principal shown above has been granted admin
                    access
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin user - show full diagnostics
  if (statsLoading || migrationLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
          <CardDescription>Loading diagnostics data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            Identity & Authorization
          </CardTitle>
          <CardDescription>
            Current authentication and authorization status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Frontend Internet Identity Principal
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The principal you're logged in with
                  </p>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs break-all bg-muted p-2 rounded">
                {frontendPrincipal}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Backend Caller Principal
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The principal the backend sees
                  </p>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs break-all bg-muted p-2 rounded">
                {backendPrincipal}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Backend Admin Status</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Whether the backend recognizes you as admin
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold">Admin</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Diagnostics
          </CardTitle>
          <CardDescription>
            Stable storage persistence verification - these counts should never
            decrease after an upgrade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold">
                  {stats?.totalTransactions.toString() || "0"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  User Profiles
                </p>
                <p className="text-2xl font-bold">
                  {stats?.totalUserProfiles.toString() || "0"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Next Transaction ID
                </p>
                <p className="text-2xl font-bold">
                  {stats?.nextTransactionId.toString() || "0"}
                </p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Persistence Verification</AlertTitle>
            <AlertDescription>
              After a canister upgrade, refresh this page. All three counts
              should remain the same or increase (never decrease). This confirms
              that stable storage is working correctly and no data is lost
              during upgrades.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {migrationState?.legacyScalingApplied ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            Legacy Amount Migration Status
          </CardTitle>
          <CardDescription>
            One-time migration to correct historical transaction amounts (×100
            scaling)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Migration Applied</p>
                <p className="text-xs text-muted-foreground">
                  {migrationState?.legacyScalingApplied
                    ? "All legacy transactions have been corrected"
                    : "Migration has not been applied yet"}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {migrationState?.legacyScalingApplied ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Legacy Cutoff ID</p>
                <p className="text-xs text-muted-foreground">
                  Transactions with ID &lt;{" "}
                  {migrationState?.legacyCutoffId.toString() || "0"} were
                  migrated
                </p>
              </div>
              <div className="text-2xl font-bold">
                {migrationState?.legacyCutoffId.toString() || "0"}
              </div>
            </div>
          </div>

          {migrationState?.legacyScalingApplied ? (
            <Alert className="mt-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Migration Complete</AlertTitle>
              <AlertDescription>
                All transactions created before ID{" "}
                {migrationState.legacyCutoffId.toString()} have been corrected.
                New transactions (ID ≥{" "}
                {migrationState.legacyCutoffId.toString()}) are stored correctly
                and were not modified. This migration is idempotent and will not
                be applied again on future upgrades.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Migration Pending</AlertTitle>
              <AlertDescription>
                The legacy amount scaling migration has not been applied yet.
                This will be automatically applied on the next canister upgrade.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
