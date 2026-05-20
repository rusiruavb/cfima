import { sectionToTransactionCategory } from "@/features/income-expense/lib/transaction-category";
import type { TransactionLedgerContext } from "@/features/income-expense/types/transaction";
import type { Loan } from "@/features/loans/types/loan";

export function formatTransactionCategory(
  category?: string,
  ledgerContext?: TransactionLedgerContext | null,
): string {
  const value = category?.trim();
  if (value) return value;
  if (ledgerContext) return sectionToTransactionCategory(ledgerContext.section);
  return "—";
}

export function formatLoanPaymentLabel(
  loans: Loan[],
  loanPaymentId?: number | null,
): string {
  if (loanPaymentId == null) return "—";

  for (const loan of loans) {
    const payment = loan.payments.find((p) => p.rowIndex === loanPaymentId);
    if (payment) return `${loan.name} · ${payment.month}`;
  }

  return "—";
}
