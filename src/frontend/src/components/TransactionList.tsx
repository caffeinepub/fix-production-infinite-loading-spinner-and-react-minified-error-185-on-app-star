import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Category, type Transaction } from "../backend";
import { useDeleteTransaction } from "../hooks/useQueries";
import { isRevenueCategory } from "../utils/category";
import { formatMinorUnitsToCurrency } from "../utils/money";
import TransactionForm from "./TransactionForm";
import TransactionFormErrorBoundary from "./TransactionFormErrorBoundary";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const categoryLabels: Record<Category, string> = {
  [Category.cash]: "Cash",
  [Category.card]: "Card",
  [Category.food]: "Food",
  [Category.drinks]: "Drinks",
  [Category.wages]: "Wages",
  [Category.rent]: "Rent",
  [Category.utilities]: "Utilities",
  [Category.other]: "Other",
};

const categoryColors: Record<Category, string> = {
  [Category.cash]: "bg-success/10 text-success border-success/20",
  [Category.card]: "bg-success/10 text-success border-success/20",
  [Category.food]: "bg-warning/10 text-warning border-warning/20",
  [Category.drinks]: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  [Category.wages]: "bg-destructive/10 text-destructive border-destructive/20",
  [Category.rent]: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  [Category.utilities]: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  [Category.other]: "bg-muted text-muted-foreground border-border",
};

const SKELETON_IDS = [
  "list-sk-1",
  "list-sk-2",
  "list-sk-3",
  "list-sk-4",
  "list-sk-5",
];

export default function TransactionList({
  transactions,
  isLoading,
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<
    Transaction | undefined
  >();
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const deleteMutation = useDeleteTransaction();

  const handleDelete = async () => {
    if (deletingId !== null) {
      await deleteMutation.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {SKELETON_IDS.map((id) => (
          <Skeleton key={id} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transactions found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const isRevenue = isRevenueCategory(transaction.category);
              return (
                <TableRow key={transaction.id.toString()}>
                  <TableCell>
                    {isRevenue ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={categoryColors[transaction.category]}
                    >
                      {categoryLabels[transaction.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMinorUnitsToCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingId(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <TransactionFormErrorBoundary
        onClose={() => setEditingTransaction(undefined)}
      >
        <TransactionForm
          open={!!editingTransaction}
          onOpenChange={(open) => !open && setEditingTransaction(undefined)}
          transaction={editingTransaction}
        />
      </TransactionFormErrorBoundary>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={() => setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
