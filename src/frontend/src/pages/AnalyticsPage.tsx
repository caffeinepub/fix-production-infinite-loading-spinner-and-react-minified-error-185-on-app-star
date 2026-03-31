import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Euro, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Category } from "../backend";
import { useGetAllTransactions } from "../hooks/useQueries";
import {
  formatMinorUnitsToCurrency,
  minorUnitsToMajorNumber,
} from "../utils/money";

interface PeriodDataBigInt {
  period: string;
  income: bigint;
  expenses: bigint;
  netProfit: bigint;
}

export default function AnalyticsPage() {
  const { data: transactions, isLoading } = useGetAllTransactions();
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [comparisonMonth1, setComparisonMonth1] = useState<string>("");
  const [comparisonMonth2, setComparisonMonth2] = useState<string>("");

  // Process transactions into monthly and yearly data using bigint aggregation
  const { monthlyData, yearlyData, availableYears, availableMonths } =
    useMemo(() => {
      if (!transactions || transactions.length === 0) {
        return {
          monthlyData: [],
          yearlyData: [],
          availableYears: [],
          availableMonths: [],
        };
      }

      const monthlyMap = new Map<string, PeriodDataBigInt>();
      const yearlyMap = new Map<string, PeriodDataBigInt>();
      const yearsSet = new Set<string>();
      const monthsSet = new Set<string>();

      for (const transaction of transactions) {
        const date = new Date(transaction.date);
        const year = date.getFullYear().toString();
        const month = date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        yearsSet.add(year);
        monthsSet.add(monthKey);

        // Keep amounts as bigint for aggregation
        const amount = transaction.amount;
        const isIncome =
          transaction.category === Category.cash ||
          transaction.category === Category.card;

        // Monthly aggregation in bigint
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            period: month,
            income: 0n,
            expenses: 0n,
            netProfit: 0n,
          });
        }
        const monthData = monthlyMap.get(monthKey)!;
        if (isIncome) {
          monthData.income += amount;
        } else {
          monthData.expenses += amount;
        }
        monthData.netProfit = monthData.income - monthData.expenses;

        // Yearly aggregation in bigint
        if (!yearlyMap.has(year)) {
          yearlyMap.set(year, {
            period: year,
            income: 0n,
            expenses: 0n,
            netProfit: 0n,
          });
        }
        const yearData = yearlyMap.get(year)!;
        if (isIncome) {
          yearData.income += amount;
        } else {
          yearData.expenses += amount;
        }
        yearData.netProfit = yearData.income - yearData.expenses;
      }

      // Convert to number only for chart rendering (with overflow protection)
      const sortedMonthly = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([_, data]) => ({
          period: data.period,
          income: minorUnitsToMajorNumber(data.income),
          expenses: minorUnitsToMajorNumber(data.expenses),
          netProfit: minorUnitsToMajorNumber(data.netProfit),
        }));

      const sortedYearly = Array.from(yearlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([_, data]) => ({
          period: data.period,
          income: minorUnitsToMajorNumber(data.income),
          expenses: minorUnitsToMajorNumber(data.expenses),
          netProfit: minorUnitsToMajorNumber(data.netProfit),
        }));

      const sortedYears = Array.from(yearsSet).sort();
      const sortedMonths = Array.from(monthsSet).sort();

      return {
        monthlyData: sortedMonthly,
        yearlyData: sortedYearly,
        availableYears: sortedYears,
        availableMonths: sortedMonths,
      };
    }, [transactions]);

  // Filter monthly data by selected year
  const filteredMonthlyData = useMemo(() => {
    if (selectedYear === "all") return monthlyData;
    return monthlyData.filter((data) => data.period.includes(selectedYear));
  }, [monthlyData, selectedYear]);

  // Get comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonMonth1 || !comparisonMonth2) return null;

    const month1Data = monthlyData.find((d) => {
      const date = new Date(`${comparisonMonth1}-01`);
      const monthStr = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      return d.period === monthStr;
    });

    const month2Data = monthlyData.find((d) => {
      const date = new Date(`${comparisonMonth2}-01`);
      const monthStr = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      return d.period === monthStr;
    });

    if (!month1Data || !month2Data) return null;

    return {
      month1: {
        ...month1Data,
        period: new Date(`${comparisonMonth1}-01`).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      },
      month2: {
        ...month2Data,
        period: new Date(`${comparisonMonth2}-01`).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      },
    };
  }, [monthlyData, comparisonMonth1, comparisonMonth2]);

  // Custom tooltip formatter that uses shared money utilities
  const formatTooltipValue = (value: number) => {
    // Convert number back to bigint minor units for proper formatting
    const minorUnits = BigInt(Math.round(value * 100));
    return formatMinorUnitsToCurrency(minorUnits);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          </div>
          <p className="text-muted-foreground">
            Historical trends and comparisons
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">
              No transaction data available. Add transactions to see analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        </div>
        <p className="text-muted-foreground">
          Historical trends and comparisons
        </p>
      </div>

      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Trends</TabsTrigger>
          <TabsTrigger value="comparison">Period Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filter by Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Income & Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredMonthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={formatTooltipValue}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill="hsl(var(--success))"
                    name="Income"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="hsl(var(--destructive))"
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Net Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={filteredMonthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={formatTooltipValue}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="netProfit"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Net Profit"
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Income & Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={yearlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={formatTooltipValue}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    fill="hsl(var(--success))"
                    name="Income"
                  />
                  <Bar
                    dataKey="expenses"
                    fill="hsl(var(--destructive))"
                    name="Expenses"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yearly Net Profit Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={yearlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    formatter={formatTooltipValue}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="netProfit"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Net Profit"
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period 1:</span>
              <Select
                value={comparisonMonth1}
                onValueChange={setComparisonMonth1}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => {
                    const date = new Date(`${month}-01`);
                    const label = date.toLocaleString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <SelectItem key={month} value={month}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Period 2:</span>
              <Select
                value={comparisonMonth2}
                onValueChange={setComparisonMonth2}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map((month) => {
                    const date = new Date(`${month}-01`);
                    const label = date.toLocaleString("en-US", {
                      month: "long",
                      year: "numeric",
                    });
                    return (
                      <SelectItem key={month} value={month}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {comparisonData ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {comparisonData.month1.period}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">Income</span>
                      </div>
                      <span className="text-lg font-bold text-success">
                        {formatTooltipValue(comparisonData.month1.income)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Expenses</span>
                      </div>
                      <span className="text-lg font-bold text-destructive">
                        {formatTooltipValue(comparisonData.month1.expenses)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Euro
                          className={`h-4 w-4 ${comparisonData.month1.netProfit >= 0 ? "text-success" : "text-destructive"}`}
                        />
                        <span className="text-sm font-semibold">
                          Net Profit
                        </span>
                      </div>
                      <span
                        className={`text-xl font-bold ${comparisonData.month1.netProfit >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {formatTooltipValue(comparisonData.month1.netProfit)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {comparisonData.month2.period}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium">Income</span>
                      </div>
                      <span className="text-lg font-bold text-success">
                        {formatTooltipValue(comparisonData.month2.income)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Expenses</span>
                      </div>
                      <span className="text-lg font-bold text-destructive">
                        {formatTooltipValue(comparisonData.month2.expenses)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Euro
                          className={`h-4 w-4 ${comparisonData.month2.netProfit >= 0 ? "text-success" : "text-destructive"}`}
                        />
                        <span className="text-sm font-semibold">
                          Net Profit
                        </span>
                      </div>
                      <span
                        className={`text-xl font-bold ${comparisonData.month2.netProfit >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {formatTooltipValue(comparisonData.month2.netProfit)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Side-by-Side Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={[comparisonData.month1, comparisonData.month2]}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis dataKey="period" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={formatTooltipValue}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="income"
                        fill="hsl(var(--success))"
                        name="Income"
                      />
                      <Bar
                        dataKey="expenses"
                        fill="hsl(var(--destructive))"
                        name="Expenses"
                      />
                      <Bar
                        dataKey="netProfit"
                        fill="hsl(var(--primary))"
                        name="Net Profit"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  Select two periods to compare
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
