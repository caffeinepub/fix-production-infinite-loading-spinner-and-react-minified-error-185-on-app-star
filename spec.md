# Restaurant Finance Tracker

## Current State

App has Dashboard and Reports modules. Both show total income as a single value (cash + card combined). The backend `MonthlyStats` type includes `expensesByCategory` (breakdown of expenses by food/drinks/wages/rent/utilities/other) but has NO income breakdown — cash and card are summed together into `totalIncome`.

## Requested Changes (Diff)

### Add
- `IncomeBreakdown` type in backend with `cash: Int` and `card: Int` fields
- `incomeByCategory: IncomeBreakdown` field to `MonthlyStats` backend type
- Logic in `getCurrentMonthStats` to accumulate cash and card income separately
- Income by category section in DashboardPage (cash row + card row under the Monthly Summary card)
- Income by category section in ReportsPage for both monthly and yearly tabs (UI only, NOT in exports)
- `incomeByCategory` to the empty fallback `MonthlyStats` in `useQueries.ts`

### Modify
- `getCurrentMonthStats` in `main.mo` — track cashTotal and cardTotal separately, return them in `incomeByCategory`
- `MonthlyStats` type in `main.mo` — add `incomeByCategory` field
- `DashboardPage.tsx` — add income breakdown UI section
- `ReportsPage.tsx` — update `calculateStats` to return `incomeByCategory`, add income breakdown display in both tab views
- `useQueries.ts` — update fallback MonthlyStats object to include `incomeByCategory: { cash: BigInt(0), card: BigInt(0) }`

### Remove
- Nothing removed

## Implementation Plan

1. Add `IncomeBreakdown` type and update `MonthlyStats` in `main.mo`
2. Update `getCurrentMonthStats` to track cash/card separately
3. Update fallback in `useQueries.ts` for `useGetCurrentMonthStats`
4. Add income breakdown UI to `DashboardPage.tsx` (after or alongside the expense breakdown)
5. Update `calculateStats` in `ReportsPage.tsx` to return `incomeByCategory`
6. Add income breakdown UI to both monthly and yearly tabs in `ReportsPage.tsx` (not in export functions)
