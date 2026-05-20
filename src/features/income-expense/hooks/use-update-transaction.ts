import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BUDGET_MONTHS_KEY } from "@/features/budget/hooks/use-budget-month";
import { INCOME_EXPENSE_QUERY_KEY } from "@/features/income-expense/hooks/use-income-expenses";
import { LOANS_QUERY_KEY } from "@/features/loans/hooks/use-loans";
import { updateTransaction } from "@/features/income-expense/services/income-expense-sheets";
import type { TransactionFormValues } from "@/features/income-expense/schemas/transaction-schema";

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rowIndex,
      data,
      existingLink,
    }: {
      rowIndex: number;
      data: TransactionFormValues;
      existingLink?: string;
    }) =>
      updateTransaction(rowIndex, {
        date: data.date,
        amount: data.amount,
        description: data.description,
        financeType: data.financeType,
        category: data.category,
        loanPaymentId: data.category === "Loans" ? (data.loanPaymentId ?? null) : null,
        existingLink,
        budgetLineId: data.budgetLineId ?? null,
        itemType: data.category === "Savings & one-off" ? data.itemType : "regular",
        featureCategory:
          data.category === "Loans" ? "Loans" : (data.featureCategory?.trim() || null),
        savingsBucket:
          data.category === "Savings & one-off" && data.itemType !== "fixed_deposit"
            ? data.savingsBucket
            : undefined,
        fixedDepositDate:
          data.category === "Savings & one-off" && data.itemType === "fixed_deposit"
            ? data.fixedDepositDate ?? null
            : null,
        fixedDepositMaturityMonths:
          data.category === "Savings & one-off" && data.itemType === "fixed_deposit"
            ? data.fixedDepositMaturityMonths ?? null
            : null,
        fixedDepositInterestRate:
          data.category === "Savings & one-off" && data.itemType === "fixed_deposit"
            ? data.fixedDepositInterestRate ?? null
            : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: BUDGET_MONTHS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["budget", "month"] });
      void queryClient.invalidateQueries({ queryKey: ["budget", "year"] });
      void queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      toast.success("Transaction updated");
    },
    onError: (err) => toast.error(String(err)),
  });
}
