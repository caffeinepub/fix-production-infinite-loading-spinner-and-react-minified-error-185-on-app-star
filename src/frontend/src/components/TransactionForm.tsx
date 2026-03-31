import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Category, type Transaction } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAddTransaction, useEditTransaction } from "../hooks/useQueries";
import {
  categoryToString,
  getCategoryType,
  getDefaultCategory,
  isCategoryStringOfType,
  stringToCategory,
} from "../utils/category";
import {
  formatMinorUnitsToDecimal,
  parseDecimalToMinorUnits,
} from "../utils/money";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
}

interface FormData {
  amount: string;
  description: string;
  date: string;
}

export default function TransactionForm({
  open,
  onOpenChange,
  transaction,
}: TransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"revenue" | "expense">(
    "revenue",
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    categoryToString(Category.cash),
  );
  const addMutation = useAddTransaction();
  const editMutation = useEditTransaction();
  const { actor, isFetching: actorInitializing } = useActor();

  // Track if we've initialized for this open session
  const prevOpenRef = useRef(false);
  const initializedRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Initialize form ONCE when dialog opens
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    const isNowOpen = open;

    if (!wasOpen && isNowOpen && !initializedRef.current) {
      if (transaction) {
        const type = getCategoryType(transaction.category);
        setTransactionType(type);
        setSelectedCategory(categoryToString(transaction.category));
        reset({
          amount: formatMinorUnitsToDecimal(transaction.amount),
          description: transaction.description,
          date: transaction.date,
        });
      } else {
        setTransactionType("revenue");
        setSelectedCategory(categoryToString(Category.cash));
        reset({
          amount: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
      }
      initializedRef.current = true;
    }

    if (wasOpen && !isNowOpen) {
      initializedRef.current = false;
    }

    prevOpenRef.current = open;
  }, [open, transaction, reset]);

  // Handle tab/type change
  const handleTypeChange = (newType: "revenue" | "expense") => {
    setTransactionType(newType);
    if (!isCategoryStringOfType(selectedCategory, newType)) {
      setSelectedCategory(categoryToString(getDefaultCategory(newType)));
    }
  };

  const onSubmit = async (data: FormData) => {
    const amountMinorUnits = parseDecimalToMinorUnits(data.amount);
    if (amountMinorUnits === null || amountMinorUnits <= BigInt(0)) return;

    const category = stringToCategory(selectedCategory);

    if (transaction) {
      await editMutation.mutateAsync({
        id: transaction.id,
        amount: amountMinorUnits,
        description: data.description,
        date: data.date,
        category,
      });
    } else {
      await addMutation.mutateAsync({
        amount: amountMinorUnits,
        description: data.description,
        date: data.date,
        category,
      });
    }

    onOpenChange(false);
  };

  const isActorReady = !!actor && !actorInitializing;
  const isLoading = addMutation.isPending || editMutation.isPending;
  const isSubmitDisabled = !isActorReady || isLoading;

  const revenueCategories = [
    { value: categoryToString(Category.cash), label: "Cash" },
    { value: categoryToString(Category.card), label: "Card" },
  ];

  const expenseCategories = [
    { value: categoryToString(Category.food), label: "Food" },
    { value: categoryToString(Category.drinks), label: "Drinks" },
    { value: categoryToString(Category.wages), label: "Wages" },
    { value: categoryToString(Category.rent), label: "Rent" },
    { value: categoryToString(Category.utilities), label: "Utilities" },
    { value: categoryToString(Category.other), label: "Other" },
  ];

  const categories =
    transactionType === "revenue" ? revenueCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit Transaction" : "Add Transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Update the transaction details below."
              : "Enter the details of your new transaction."}
          </DialogDescription>
        </DialogHeader>

        {!isActorReady && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Initializing connection...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type selector - rendered once, not duplicated in tabs */}
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={transactionType === "revenue" ? "default" : "outline"}
                onClick={() => handleTypeChange("revenue")}
                disabled={!isActorReady}
              >
                Revenue
              </Button>
              <Button
                type="button"
                variant={transactionType === "expense" ? "default" : "outline"}
                onClick={() => handleTypeChange("expense")}
                disabled={!isActorReady}
              >
                Expense
              </Button>
            </div>
          </div>

          {/* Category - changes based on type, rendered once */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={!isActorReady}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Common fields - rendered ONCE, not duplicated */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={!isActorReady}
              {...register("amount", { required: true, min: 0.01 })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">
                Amount is required and must be positive
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              disabled={!isActorReady}
              {...register("date", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter transaction details..."
              disabled={!isActorReady}
              {...register("description", { required: true })}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                Description is required
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {transaction ? "Update" : "Add"} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
