import { parseISO } from "date-fns";
import { resolveTransactionCategory } from "@/features/income-expense/lib/transaction-category";
import type { TransactionFormValues } from "@/features/income-expense/schemas/transaction-schema";
import type { Transaction } from "@/features/income-expense/types/transaction";
import type { Loan } from "@/features/loans/types/loan";

export function transactionToFormValues(
  t: Transaction,
  loans: Loan[] = [],
): TransactionFormValues {
  let loanId: string | null = null;
  if (t.loanPaymentId != null) {
    for (const loan of loans) {
      if (loan.payments.some((p) => p.rowIndex === t.loanPaymentId)) {
        loanId = loan.id;
        break;
      }
    }
  }

  const category = resolveTransactionCategory(
    t.category,
    t.financeType,
    t.loanPaymentId,
    t.ledgerContext,
  );

  const ctx = t.ledgerContext;
  const itemType =
    ctx?.itemType === "fixed_deposit" ? "fixed_deposit" : ("regular" as const);

  return {
    date: parseISO(t.date),
    amount: t.amount,
    description: t.description,
    financeType: t.financeType,
    category,
    loanId,
    loanPaymentId: t.loanPaymentId ?? null,
    itemType,
    featureCategory: ctx?.featureCategory ?? null,
    savingsBucket:
      ctx?.savingsBucket === "one_off" || ctx?.savingsBucket === "savings"
        ? ctx.savingsBucket
        : "savings",
    fixedDepositDate: ctx?.fixedDepositDate ?? null,
    fixedDepositMaturityMonths: ctx?.fixedDepositMaturityMonths ?? null,
    fixedDepositInterestRate: ctx?.fixedDepositInterestRate ?? null,
    budgetLineId: ctx?.budgetLineId ?? null,
  };
}
