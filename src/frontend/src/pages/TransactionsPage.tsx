import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Loader2,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRef, useState } from "react";
import TransactionForm from "../components/TransactionForm";
import TransactionFormErrorBoundary from "../components/TransactionFormErrorBoundary";
import TransactionList from "../components/TransactionList";
import TransactionStats from "../components/TransactionStats";
import { useActorReadiness } from "../hooks/useActorReadiness";
import { useGetAllTransactions } from "../hooks/useQueries";
import { isExpenseCategory, isRevenueCategory } from "../utils/category";

export default function TransactionsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "revenue" | "expense">(
    "all",
  );
  const { data: transactions = [], isLoading } = useGetAllTransactions();
  const { isReady, isInitializing, error } = useActorReadiness();

  // Track error boundary reset key to force fresh instance per open
  const errorBoundaryKeyRef = useRef(0);

  const revenues = transactions.filter((t) => isRevenueCategory(t.category));
  const expenses = transactions.filter((t) => isExpenseCategory(t.category));

  // Sum using bigint minor units
  const totalRevenue = revenues.reduce((sum, t) => sum + t.amount, BigInt(0));
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, BigInt(0));
  const netProfit = totalRevenue - totalExpense;

  const handleAddTransaction = () => {
    if (isReady) {
      // Increment key to force fresh error boundary instance
      errorBoundaryKeyRef.current += 1;
      setIsFormOpen(true);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Transaction Module
          </h2>
          <p className="text-muted-foreground">
            Manage your restaurant's revenues and expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <Alert variant="destructive" className="py-2 px-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Initialization failed
              </AlertDescription>
            </Alert>
          )}
          <Button
            onClick={handleAddTransaction}
            size="lg"
            className="gap-2"
            disabled={!isReady}
          >
            {isInitializing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Initializing...
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-5 w-5" />
                Error
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Transaction
              </>
            )}
          </Button>
        </div>
      </div>

      <TransactionStats
        totalRevenue={totalRevenue}
        totalExpense={totalExpense}
        netProfit={netProfit}
        isLoading={isLoading}
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            View and manage all your financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="revenue" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenues
              </TabsTrigger>
              <TabsTrigger value="expense" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Expenses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <TransactionList
                transactions={transactions}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="revenue" className="mt-6">
              <TransactionList transactions={revenues} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="expense" className="mt-6">
              <TransactionList transactions={expenses} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TransactionFormErrorBoundary
        onClose={handleCloseForm}
        resetKey={errorBoundaryKeyRef.current}
      >
        <TransactionForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      </TransactionFormErrorBoundary>
    </div>
  );
}
