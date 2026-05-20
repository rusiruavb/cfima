import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BUDGET_MONTHS_KEY } from "@/features/budget/hooks/use-budget-month";
import { INCOME_EXPENSE_QUERY_KEY } from "@/features/income-expense/hooks/use-income-expenses";
import { LOANS_QUERY_KEY } from "@/features/loans/hooks/use-loans";
import { addTransaction } from "@/features/income-expense/services/income-expense-sheets";
import type { TransactionFormValues } from "@/features/income-expense/schemas/transaction-schema";

function invalidateBudgetQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: BUDGET_MONTHS_KEY });
  void queryClient.invalidateQueries({ queryKey: ["budget", "month"] });
  void queryClient.invalidateQueries({ queryKey: ["budget", "year"] });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionFormValues) =>
      addTransaction({
        date: data.date,
        amount: data.amount,
        description: data.description,
        financeType: data.financeType,
        category: data.category,
        loanPaymentId: data.category === "Loans" ? (data.loanPaymentId ?? null) : null,
        itemType: data.category === "Savings & one-off" ? data.itemType : "regular",
        featureCategory:
          data.category === "Loans" ? "Loans" : (data.featureCategory?.trim() || null),
        savingsBucket:
          data.category === "Savings & one-off" && data.itemType !== "fixed_deposit"
            ? data.savingsBucket
            : undefined,
        fixedDepositDate:
          data.category === "Savings & one-off" && data.itemType === "fixed_deposit"
            ? (data.fixedDepositDate ?? null)
            : null,
        fixedDepositMaturityMonths:
          data.category === "Savings & one-off" && data.itemType === "fixed_deposit"
            ? (data.fixedDepositMaturityMonths ?? null)
            : null,
        fixedDepositInterestRate:
          data.category === "Savings & one-off" && data.itemType === "fixed_deposit"
            ? (data.fixedDepositInterestRate ?? null)
            : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      invalidateBudgetQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      toast.success("Transaction added");
    },
    onError: (err) => toast.error(String(err)),
  });
}
