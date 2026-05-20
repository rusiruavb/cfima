import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BUDGET_MONTHS_KEY } from "@/features/budget/hooks/use-budget-month";
import { INCOME_EXPENSE_QUERY_KEY } from "@/features/income-expense/hooks/use-income-expenses";
import { LOANS_QUERY_KEY } from "@/features/loans/hooks/use-loans";
import { removeTransaction } from "@/features/income-expense/services/income-expense-sheets";

function invalidateBudgetQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: BUDGET_MONTHS_KEY });
  void queryClient.invalidateQueries({ queryKey: ["budget", "month"] });
  void queryClient.invalidateQueries({ queryKey: ["budget", "year"] });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rowIndex: number) => removeTransaction(rowIndex),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      invalidateBudgetQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      toast.success("Transaction deleted");
    },
    onError: (err) => toast.error(String(err)),
  });
}
