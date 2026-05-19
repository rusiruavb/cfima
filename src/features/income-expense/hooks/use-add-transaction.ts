import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { INCOME_EXPENSE_QUERY_KEY } from "@/features/income-expense/hooks/use-income-expenses";
import { addTransaction } from "@/features/income-expense/services/income-expense-sheets";
import type { TransactionFormValues } from "@/features/income-expense/schemas/transaction-schema";

export function useAddTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionFormValues) =>
      addTransaction({
        date: data.date,
        amount: data.amount,
        description: data.description,
        financeType: data.financeType,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      toast.success("Transaction added");
    },
    onError: (err) => toast.error(String(err)),
  });
}
