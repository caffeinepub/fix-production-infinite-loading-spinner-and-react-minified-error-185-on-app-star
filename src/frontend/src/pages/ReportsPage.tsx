import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Category, type Transaction } from "../backend";
import { useGetAllTransactions } from "../hooks/useQueries";
import {
  formatMinorUnitsToCurrency,
  minorUnitsToExportString,
} from "../utils/money";

export default function ReportsPage() {
  const { data: transactions, isLoading } = useGetAllTransactions();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().getMonth().toString(),
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getAvailableYears = () => {
    if (!transactions || transactions.length === 0)
      return [new Date().getFullYear().toString()];
    const years = new Set<string>();
    for (const t of transactions) {
      const year = new Date(t.date).getFullYear().toString();
      years.add(year);
    }
    return Array.from(years).sort(
      (a, b) => Number.parseInt(b) - Number.parseInt(a),
    );
  };

  const filterTransactionsByMonth = (month: number, year: number) => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const filterTransactionsByYear = (year: number) => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getFullYear() === year;
    });
  };

  const calculateStats = (filteredTransactions: Transaction[]) => {
    let totalIncome = BigInt(0);
    let totalExpenses = BigInt(0);
    const expensesByCategory = {
      food: BigInt(0),
      drinks: BigInt(0),
      wages: BigInt(0),
      rent: BigInt(0),
      utilities: BigInt(0),
      other: BigInt(0),
    };
    const incomeByCategory = {
      cash: BigInt(0),
      cash2: BigInt(0),
      card: BigInt(0),
    };

    for (const t of filteredTransactions) {
      switch (t.category) {
        case Category.cash:
          totalIncome += t.amount;
          incomeByCategory.cash += t.amount;
          break;
        case Category.cash2:
          totalIncome += t.amount;
          incomeByCategory.cash2 += t.amount;
          break;
        case Category.card:
          totalIncome += t.amount;
          incomeByCategory.card += t.amount;
          break;
        case Category.food:
          totalExpenses += t.amount;
          expensesByCategory.food += t.amount;
          break;
        case Category.drinks:
          totalExpenses += t.amount;
          expensesByCategory.drinks += t.amount;
          break;
        case Category.wages:
          totalExpenses += t.amount;
          expensesByCategory.wages += t.amount;
          break;
        case Category.rent:
          totalExpenses += t.amount;
          expensesByCategory.rent += t.amount;
          break;
        case Category.utilities:
          totalExpenses += t.amount;
          expensesByCategory.utilities += t.amount;
          break;
        case Category.other:
          totalExpenses += t.amount;
          expensesByCategory.other += t.amount;
          break;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      expensesByCategory,
      incomeByCategory,
    };
  };

  const exportToJSON = (type: "monthly" | "yearly") => {
    const month = Number.parseInt(selectedMonth);
    const year = Number.parseInt(selectedYear);

    let data: Record<string, unknown>;
    if (type === "monthly") {
      const filteredTransactions = filterTransactionsByMonth(month, year);
      const stats = calculateStats(filteredTransactions);
      data = {
        reportType: "Monthly Report",
        period: `${months[month]} ${year}`,
        totalIncome: minorUnitsToExportString(stats.totalIncome),
        totalExpenses: minorUnitsToExportString(stats.totalExpenses),
        netProfit: minorUnitsToExportString(stats.netProfit),
        expensesByCategory: {
          food: minorUnitsToExportString(stats.expensesByCategory.food),
          drinks: minorUnitsToExportString(stats.expensesByCategory.drinks),
          wages: minorUnitsToExportString(stats.expensesByCategory.wages),
          rent: minorUnitsToExportString(stats.expensesByCategory.rent),
          utilities: minorUnitsToExportString(
            stats.expensesByCategory.utilities,
          ),
          other: minorUnitsToExportString(stats.expensesByCategory.other),
        },
        transactions: filteredTransactions.map((t) => ({
          id: Number(t.id),
          date: t.date,
          description: t.description,
          category: t.category,
          amount: minorUnitsToExportString(t.amount),
        })),
      };
    } else {
      const filteredTransactions = filterTransactionsByYear(year);
      const stats = calculateStats(filteredTransactions);
      data = {
        reportType: "Yearly Report",
        period: year.toString(),
        totalIncome: minorUnitsToExportString(stats.totalIncome),
        totalExpenses: minorUnitsToExportString(stats.totalExpenses),
        netProfit: minorUnitsToExportString(stats.netProfit),
        expensesByCategory: {
          food: minorUnitsToExportString(stats.expensesByCategory.food),
          drinks: minorUnitsToExportString(stats.expensesByCategory.drinks),
          wages: minorUnitsToExportString(stats.expensesByCategory.wages),
          rent: minorUnitsToExportString(stats.expensesByCategory.rent),
          utilities: minorUnitsToExportString(
            stats.expensesByCategory.utilities,
          ),
          other: minorUnitsToExportString(stats.expensesByCategory.other),
        },
      };
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-report-${type === "monthly" ? `${months[month]}-` : ""}${year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON report exported successfully");
  };

  const exportToCSV = (type: "monthly" | "yearly") => {
    const month = Number.parseInt(selectedMonth);
    const year = Number.parseInt(selectedYear);

    let csvContent = "";

    if (type === "monthly") {
      const filteredTransactions = filterTransactionsByMonth(month, year);
      const stats = calculateStats(filteredTransactions);

      csvContent = `Monthly Report - ${months[month]} ${year}\n\n`;
      csvContent += "Summary\n";
      csvContent += "Metric,Amount\n";
      csvContent += `Total Income,${minorUnitsToExportString(stats.totalIncome)}\n`;
      csvContent += `Total Expenses,${minorUnitsToExportString(stats.totalExpenses)}\n`;
      csvContent += `Net Profit,${minorUnitsToExportString(stats.netProfit)}\n\n`;
      csvContent += "Expenses by Category\n";
      csvContent += "Category,Amount\n";
      csvContent += `Food,${minorUnitsToExportString(stats.expensesByCategory.food)}\n`;
      csvContent += `Drinks,${minorUnitsToExportString(stats.expensesByCategory.drinks)}\n`;
      csvContent += `Wages,${minorUnitsToExportString(stats.expensesByCategory.wages)}\n`;
      csvContent += `Rent,${minorUnitsToExportString(stats.expensesByCategory.rent)}\n`;
      csvContent += `Utilities,${minorUnitsToExportString(stats.expensesByCategory.utilities)}\n`;
      csvContent += `Other,${minorUnitsToExportString(stats.expensesByCategory.other)}\n\n`;
      csvContent += "Transactions\n";
      csvContent += "ID,Date,Description,Category,Amount\n";
      for (const t of filteredTransactions) {
        csvContent += `${t.id},"${t.date}","${t.description}",${t.category},${minorUnitsToExportString(t.amount)}\n`;
      }
    } else {
      const filteredTransactions = filterTransactionsByYear(year);
      const stats = calculateStats(filteredTransactions);

      csvContent = `Yearly Report - ${year}\n\n`;
      csvContent += "Summary\n";
      csvContent += "Metric,Amount\n";
      csvContent += `Total Income,${minorUnitsToExportString(stats.totalIncome)}\n`;
      csvContent += `Total Expenses,${minorUnitsToExportString(stats.totalExpenses)}\n`;
      csvContent += `Net Profit,${minorUnitsToExportString(stats.netProfit)}\n\n`;
      csvContent += "Expenses by Category\n";
      csvContent += "Category,Amount\n";
      csvContent += `Food,${minorUnitsToExportString(stats.expensesByCategory.food)}\n`;
      csvContent += `Drinks,${minorUnitsToExportString(stats.expensesByCategory.drinks)}\n`;
      csvContent += `Wages,${minorUnitsToExportString(stats.expensesByCategory.wages)}\n`;
      csvContent += `Rent,${minorUnitsToExportString(stats.expensesByCategory.rent)}\n`;
      csvContent += `Utilities,${minorUnitsToExportString(stats.expensesByCategory.utilities)}\n`;
      csvContent += `Other,${minorUnitsToExportString(stats.expensesByCategory.other)}\n`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}-report-${type === "monthly" ? `${months[month]}-` : ""}${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV report exported successfully");
  };

  const exportToPDF = (type: "monthly" | "yearly") => {
    const month = Number.parseInt(selectedMonth);
    const year = Number.parseInt(selectedYear);

    let htmlContent = "";

    if (type === "monthly") {
      const filteredTransactions = filterTransactionsByMonth(month, year);
      const stats = calculateStats(filteredTransactions);

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Monthly Report - ${months[month]} ${year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            .summary { margin: 20px 0; }
            .summary-item { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Monthly Report - ${months[month]} ${year}</h1>
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-item"><strong>Total Income:</strong> ${formatMinorUnitsToCurrency(stats.totalIncome)}</div>
            <div class="summary-item"><strong>Total Expenses:</strong> ${formatMinorUnitsToCurrency(stats.totalExpenses)}</div>
            <div class="summary-item"><strong>Net Profit:</strong> ${formatMinorUnitsToCurrency(stats.netProfit)}</div>
          </div>
          <h2>Expenses by Category</h2>
          <table>
            <tr><th>Category</th><th>Amount</th></tr>
            <tr><td>Food</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.food)}</td></tr>
            <tr><td>Drinks</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.drinks)}</td></tr>
            <tr><td>Wages</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.wages)}</td></tr>
            <tr><td>Rent</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.rent)}</td></tr>
            <tr><td>Utilities</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.utilities)}</td></tr>
            <tr><td>Other</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.other)}</td></tr>
          </table>
          ${
            filteredTransactions.length > 0
              ? `
          <h2>Transactions</h2>
          <table>
            <tr><th>ID</th><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
            ${filteredTransactions
              .map(
                (t) => `
              <tr>
                <td>${t.id}</td>
                <td>${t.date}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td>${formatMinorUnitsToCurrency(t.amount)}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
          `
              : ""
          }
        </body>
        </html>
      `;
    } else {
      const filteredTransactions = filterTransactionsByYear(year);
      const stats = calculateStats(filteredTransactions);

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Yearly Report - ${year}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #3b82f6; color: white; }
            .summary { margin: 20px 0; }
            .summary-item { margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Yearly Report - ${year}</h1>
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-item"><strong>Total Income:</strong> ${formatMinorUnitsToCurrency(stats.totalIncome)}</div>
            <div class="summary-item"><strong>Total Expenses:</strong> ${formatMinorUnitsToCurrency(stats.totalExpenses)}</div>
            <div class="summary-item"><strong>Net Profit:</strong> ${formatMinorUnitsToCurrency(stats.netProfit)}</div>
          </div>
          <h2>Expenses by Category</h2>
          <table>
            <tr><th>Category</th><th>Amount</th></tr>
            <tr><td>Food</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.food)}</td></tr>
            <tr><td>Drinks</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.drinks)}</td></tr>
            <tr><td>Wages</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.wages)}</td></tr>
            <tr><td>Rent</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.rent)}</td></tr>
            <tr><td>Utilities</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.utilities)}</td></tr>
            <tr><td>Other</td><td>${formatMinorUnitsToCurrency(stats.expensesByCategory.other)}</td></tr>
          </table>
        </body>
        </html>
      `;
    }

    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
      toast.success("PDF report opened for printing");
    } else {
      toast.error("Failed to open print window. Please allow pop-ups.");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const monthlyTransactions = filterTransactionsByMonth(
    Number.parseInt(selectedMonth),
    Number.parseInt(selectedYear),
  );
  const monthlyStats = calculateStats(monthlyTransactions);

  const yearlyTransactions = filterTransactionsByYear(
    Number.parseInt(selectedYear),
  );
  const yearlyStats = calculateStats(yearlyTransactions);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        </div>
        <p className="text-muted-foreground">
          Generate and export business reports in multiple formats
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>
            Select the time period for your report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-medium mb-2">Month</div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-medium mb-2">Year</div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Report</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Monthly Report - {months[Number.parseInt(selectedMonth)]}{" "}
                {selectedYear}
              </CardTitle>
              <CardDescription>
                Financial summary for the selected month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Income
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {formatMinorUnitsToCurrency(monthlyStats.totalIncome)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatMinorUnitsToCurrency(monthlyStats.totalExpenses)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Net Profit
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      monthlyStats.netProfit >= BigInt(0)
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatMinorUnitsToCurrency(monthlyStats.netProfit)}
                  </p>
                </div>
              </div>

              {/* Income by Category */}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Income by Category
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Cash</span>
                    <span className="text-sm font-semibold text-success">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.incomeByCategory.cash,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Cash 2</span>
                    <span className="text-sm font-semibold text-success">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.incomeByCategory.cash2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Card</span>
                    <span className="text-sm font-semibold text-success">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.incomeByCategory.card,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses by Category */}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Expenses by Category
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Food</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.expensesByCategory.food,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Drinks</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.expensesByCategory.drinks,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Wages</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.expensesByCategory.wages,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Rent</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.expensesByCategory.rent,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Utilities</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.expensesByCategory.utilities,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Other</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        monthlyStats.expensesByCategory.other,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Export Report</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => exportToJSON("monthly")}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileJson className="h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    onClick={() => exportToPDF("monthly")}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Print PDF
                  </Button>
                  <Button
                    onClick={() => exportToCSV("monthly")}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Report - {selectedYear}</CardTitle>
              <CardDescription>
                Annual financial summary for the selected year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Income
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {formatMinorUnitsToCurrency(yearlyStats.totalIncome)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Expenses
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatMinorUnitsToCurrency(yearlyStats.totalExpenses)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Net Profit
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      yearlyStats.netProfit >= BigInt(0)
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {formatMinorUnitsToCurrency(yearlyStats.netProfit)}
                  </p>
                </div>
              </div>

              {/* Income by Category */}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Income by Category
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Cash</span>
                    <span className="text-sm font-semibold text-success">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.incomeByCategory.cash,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Cash 2</span>
                    <span className="text-sm font-semibold text-success">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.incomeByCategory.cash2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Card</span>
                    <span className="text-sm font-semibold text-success">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.incomeByCategory.card,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expenses by Category */}
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Expenses by Category
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Food</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.expensesByCategory.food,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Drinks</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.expensesByCategory.drinks,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Wages</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.expensesByCategory.wages,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Rent</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.expensesByCategory.rent,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Utilities</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.expensesByCategory.utilities,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Other</span>
                    <span className="text-sm font-semibold">
                      {formatMinorUnitsToCurrency(
                        yearlyStats.expensesByCategory.other,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold mb-3">Export Report</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => exportToJSON("yearly")}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileJson className="h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    onClick={() => exportToPDF("yearly")}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Print PDF
                  </Button>
                  <Button
                    onClick={() => exportToCSV("yearly")}
                    variant="outline"
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
