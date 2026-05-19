import type { BudgetSection } from "@/features/budget/types/budget";

export const SECTION_LABELS: Record<BudgetSection, string> = {
  income: "Income",
  fixed: "Fixed expenses",
  variable: "Variable expenses",
  savings: "Savings & one-off",
};

export const SECTION_ORDER: BudgetSection[] = ["income", "fixed", "variable", "savings"];
