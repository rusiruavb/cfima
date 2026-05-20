import type { BudgetSection } from "@/features/budget/types/budget";

export const SECTION_LABELS: Record<BudgetSection, string> = {
  income: "Income",
  fixed: "Fixed expenses",
  variable: "Variable expenses",
  savings: "Savings & one-off",
};

export const SECTION_ORDER: BudgetSection[] = ["income", "fixed", "variable", "savings"];

/** UI-only category value for loan payments (stored as fixed expense + loan link). */
export const LOANS_CATEGORY = "loans" as const;
export type BudgetLineCategory = BudgetSection | typeof LOANS_CATEGORY;

export const CATEGORY_LABELS: Record<BudgetLineCategory, string> = {
  ...SECTION_LABELS,
  loans: "Loans",
};

export const CATEGORY_ORDER: BudgetLineCategory[] = [
  ...SECTION_ORDER,
  LOANS_CATEGORY,
];
