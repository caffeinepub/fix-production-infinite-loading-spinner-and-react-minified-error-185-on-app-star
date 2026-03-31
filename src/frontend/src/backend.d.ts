import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AdminAuthStatus {
    principal: Principal;
    principalText: string;
    isAuthenticated: boolean;
}
export interface MigrationState {
    legacyCutoffId: bigint;
    legacyScalingApplied: boolean;
}
export interface IncomeBreakdown {
    cash: bigint;
    card: bigint;
}
export interface MonthlyStats {
    expensesByCategory: ExpenseBreakdown;
    incomeByCategory: IncomeBreakdown;
    totalIncome: bigint;
    totalExpenses: bigint;
    netProfit: bigint;
}
export interface DiagnosticsStats {
    nextTransactionId: bigint;
    totalUserProfiles: bigint;
    totalTransactions: bigint;
}
export interface ExpenseBreakdown {
    other: bigint;
    food: bigint;
    rent: bigint;
    utilities: bigint;
    wages: bigint;
    drinks: bigint;
}
export interface UserProfile {
    name: string;
    restaurantName: string;
}
export interface Transaction {
    id: bigint;
    owner: Principal;
    date: string;
    description: string;
    category: Category;
    amount: bigint;
}
export enum Category {
    other = "other",
    card = "card",
    cash = "cash",
    food = "food",
    rent = "rent",
    utilities = "utilities",
    wages = "wages",
    drinks = "drinks"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addTransaction(amount: bigint, description: string, date: string, category: Category): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteTransaction(id: bigint): Promise<void>;
    editTransaction(id: bigint, amount: bigint, description: string, date: string, category: Category): Promise<void>;
    getAdminAuthStatus(): Promise<AdminAuthStatus>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCallerPrincipalAsText(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentMonthStats(): Promise<MonthlyStats>;
    getDiagnosticsStats(): Promise<DiagnosticsStats>;
    getLegacyScalingDiagnostics(): Promise<MigrationState>;
    getTransactionsByCategory(category: Category): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
