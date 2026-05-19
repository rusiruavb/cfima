import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addBudgetLine,
  createMonthFromTemplate,
  deleteBudgetLine,
  fetchBudgetMonth,
  fetchBudgetMonths,
  postBudgetLineToLedger,
  updateBudgetLine,
} from "@/features/budget/services/budget-api";
import type { AmountMode } from "@/features/budget/types/budget";
import { INCOME_EXPENSE_QUERY_KEY } from "@/features/income-expense/hooks/use-income-expenses";

export const BUDGET_MONTHS_KEY = ["budget", "months"] as const;

export function budgetMonthKey(yearMonth: string) {
  return ["budget", "month", yearMonth] as const;
}

export function useBudgetMonths() {
  return useQuery({
    queryKey: BUDGET_MONTHS_KEY,
    queryFn: fetchBudgetMonths,
  });
}

export function useBudgetMonth(yearMonth: string) {
  return useQuery({
    queryKey: budgetMonthKey(yearMonth),
    queryFn: () => fetchBudgetMonth(yearMonth),
    retry: (count, error) => {
      if (error instanceof Error && error.message.includes("404")) return false;
      return count < 2;
    },
  });
}

export function useCreateMonthFromTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      yearMonth,
      amountMode,
    }: {
      yearMonth: string;
      amountMode?: AmountMode;
    }) => createMonthFromTemplate(yearMonth, amountMode),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: BUDGET_MONTHS_KEY });
      void queryClient.setQueryData(budgetMonthKey(data.yearMonth), data);
      toast.success(`Budget created for ${data.yearMonth}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddBudgetLine(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof addBudgetLine>[1]) =>
      addBudgetLine(yearMonth, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetMonthKey(yearMonth) });
      toast.success("Line added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBudgetLine(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateBudgetLine>[1];
    }) => updateBudgetLine(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetMonthKey(yearMonth) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudgetLine(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBudgetLine,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetMonthKey(yearMonth) });
      toast.success("Line removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePostBudgetLineToLedger(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      amount,
    }: {
      id: number;
      date: Date;
      amount: number;
    }) => postBudgetLineToLedger(id, { date, amount }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetMonthKey(yearMonth) });
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      toast.success("Posted to ledger");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
