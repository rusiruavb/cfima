import type { TransactionFormValues } from "@/features/income-expense/schemas/transaction-schema";
import type { TransactionLedgerContext } from "@/features/income-expense/types/transaction";
import type { BudgetSection } from "@/features/budget/types/budget";

export function sectionToTransactionCategory(
  section: string,
): TransactionFormValues["category"] {
  switch (section) {
    case "income":
      return "Income";
    case "fixed":
      return "Fixed expenses";
    case "variable":
      return "Variable expenses";
    case "savings":
      return "Savings & one-off";
    default:
      return "Income";
  }
}

export function transactionCategoryToSection(
  category: TransactionFormValues["category"],
): BudgetSection {
  switch (category) {
    case "Income":
      return "income";
    case "Fixed expenses":
      return "fixed";
    case "Variable expenses":
      return "variable";
    case "Savings & one-off":
      return "savings";
    case "Loans":
      return "fixed";
    default:
      return "income";
  }
}

export function resolveTransactionCategory(
  storedCategory: string | undefined,
  financeType: "Income" | "Expense",
  loanPaymentId?: number | null,
  ledgerContext?: TransactionLedgerContext | null,
): TransactionFormValues["category"] {
  if (loanPaymentId != null) return "Loans";
  const trimmed = storedCategory?.trim();
  if (
    trimmed === "Income" ||
    trimmed === "Fixed expenses" ||
    trimmed === "Variable expenses" ||
    trimmed === "Savings & one-off" ||
    trimmed === "Loans"
  ) {
    return trimmed;
  }
  if (ledgerContext) return sectionToTransactionCategory(ledgerContext.section);
  return financeType === "Income" ? "Income" : "Variable expenses";
}
