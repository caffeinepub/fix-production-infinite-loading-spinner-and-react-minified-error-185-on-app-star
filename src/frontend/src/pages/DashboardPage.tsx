import {
  Euro,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import React from "react";
import DiagnosticsPanel from "../components/DiagnosticsPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  useGetCallerUserProfile,
  useGetCurrentMonthStats,
} from "../hooks/useQueries";
import { formatMinorUnitsToCurrency } from "../utils/money";

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetCurrentMonthStats();
  const { data: profile } = useGetCallerUserProfile();

  const netProfit = stats?.netProfit || BigInt(0);
  const isProfitable = netProfit >= BigInt(0);

  const currentDate = new Date();
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your financial overview for {monthName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {isLoading
                ? "..."
                : formatMinorUnitsToCurrency(stats?.totalIncome || BigInt(0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading
                ? "..."
                : formatMinorUnitsToCurrency(stats?.totalExpenses || BigInt(0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Spending this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold flex items-center gap-2 ${isProfitable ? "text-success" : "text-destructive"}`}
            >
              {isLoading ? "..." : formatMinorUnitsToCurrency(netProfit)}
              {!isLoading &&
                (isProfitable ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isProfitable ? "Profitable" : "Loss"} this month
            </p>
          </CardContent>
        </Card>
      </div>

      <DiagnosticsPanel />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
          <CardDescription>
            Detailed breakdown of your income and expenses by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading breakdown...</p>
          ) : (
            <div className="space-y-6">
              {/* Income by Category */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Income by Category
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Cash</span>
                    <span className="text-success font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.incomeByCategory?.cash || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Cash 2</span>
                    <span className="text-success font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.incomeByCategory?.cash2 || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Card</span>
                    <span className="text-success font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.incomeByCategory?.card || BigInt(0),
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses by Category */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Expenses by Category
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Food</span>
                    <span className="text-destructive font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.expensesByCategory.food || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Drinks</span>
                    <span className="text-destructive font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.expensesByCategory.drinks || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Wages</span>
                    <span className="text-destructive font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.expensesByCategory.wages || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Rent</span>
                    <span className="text-destructive font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.expensesByCategory.rent || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Utilities</span>
                    <span className="text-destructive font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.expensesByCategory.utilities || BigInt(0),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-medium">Other</span>
                    <span className="text-destructive font-semibold">
                      {formatMinorUnitsToCurrency(
                        stats?.expensesByCategory.other || BigInt(0),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
