import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, TrendingDown, TrendingUp } from "lucide-react";
import { formatMinorUnitsToCurrency } from "../utils/money";

interface TransactionStatsProps {
  totalRevenue: bigint;
  totalExpense: bigint;
  netProfit: bigint;
  isLoading: boolean;
}

const SKELETON_IDS = ["stats-sk-1", "stats-sk-2", "stats-sk-3"];

export default function TransactionStats({
  totalRevenue,
  totalExpense,
  netProfit,
  isLoading,
}: TransactionStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {SKELETON_IDS.map((id) => (
          <Card key={id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isProfit = netProfit >= BigInt(0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">
            {formatMinorUnitsToCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground">
            From all revenue sources
          </p>
        </CardContent>
      </Card>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatMinorUnitsToCurrency(totalExpense)}
          </div>
          <p className="text-xs text-muted-foreground">
            From all expense categories
          </p>
        </CardContent>
      </Card>

      <Card
        className={
          isProfit
            ? "border-success/20 bg-success/5"
            : "border-destructive/20 bg-destructive/5"
        }
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <Euro
            className={`h-4 w-4 ${isProfit ? "text-success" : "text-destructive"}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${isProfit ? "text-success" : "text-destructive"}`}
          >
            {formatMinorUnitsToCurrency(netProfit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Revenue minus expenses
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
