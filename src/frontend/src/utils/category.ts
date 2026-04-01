import { Category } from "../backend";

// Revenue categories
const REVENUE_CATEGORIES = [Category.cash, Category.cash2, Category.card];

// Expense categories
const EXPENSE_CATEGORIES = [
  Category.food,
  Category.drinks,
  Category.wages,
  Category.rent,
  Category.utilities,
  Category.other,
];

/**
 * Convert a backend Category to a stable UI string
 */
export function categoryToString(category: Category): string {
  return category.toString();
}

/**
 * Convert a UI string back to a backend Category
 */
export function stringToCategory(str: string): Category {
  return str as Category;
}

/**
 * Determine if a category is a revenue category
 */
export function isRevenueCategory(category: Category): boolean {
  return REVENUE_CATEGORIES.includes(category);
}

/**
 * Determine if a category is an expense category
 */
export function isExpenseCategory(category: Category): boolean {
  return EXPENSE_CATEGORIES.includes(category);
}

/**
 * Get the transaction type (revenue or expense) for a category
 */
export function getCategoryType(category: Category): "revenue" | "expense" {
  return isRevenueCategory(category) ? "revenue" : "expense";
}

/**
 * Get the default category for a transaction type
 */
export function getDefaultCategory(type: "revenue" | "expense"): Category {
  return type === "revenue" ? Category.cash : Category.food;
}

/**
 * Get all revenue categories
 */
export function getRevenueCategories(): Category[] {
  return [...REVENUE_CATEGORIES];
}

/**
 * Get all expense categories
 */
export function getExpenseCategories(): Category[] {
  return [...EXPENSE_CATEGORIES];
}

/**
 * Check if a category string belongs to a specific type
 */
export function isCategoryStringOfType(
  categoryStr: string,
  type: "revenue" | "expense",
): boolean {
  const category = stringToCategory(categoryStr);
  return type === "revenue"
    ? isRevenueCategory(category)
    : isExpenseCategory(category);
}
