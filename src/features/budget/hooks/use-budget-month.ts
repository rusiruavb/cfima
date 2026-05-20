import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addBudgetLine,
  createMonthFromTemplate,
  deleteBudgetLine,
  fetchAnnualBudgetTotals,
  fetchBudgetMonth,
  fetchBudgetMonths,
  postBudgetLineToLedger,
  removeBudgetLineFromLedger,
  updateBudgetLineLedger,
  updateBudgetLine,
} from "@/features/budget/services/budget-api";
import type { AmountMode } from "@/features/budget/types/budget";
import { INCOME_EXPENSE_QUERY_KEY } from "@/features/income-expense/hooks/use-income-expenses";
import { LOANS_QUERY_KEY } from "@/features/loans/hooks/use-loans";

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

export function budgetYearTotalsKey(year: string) {
  return ["budget", "year", year, "totals"] as const;
}

function invalidateYearTotals(queryClient: QueryClient, yearMonth: string) {
  void queryClient.invalidateQueries({ queryKey: budgetYearTotalsKey(yearMonth.slice(0, 4)) });
}

export function useAnnualBudgetTotals(year: string) {
  return useQuery({
    queryKey: budgetYearTotalsKey(year),
    queryFn: () => fetchAnnualBudgetTotals(year),
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
      invalidateYearTotals(queryClient, data.yearMonth);
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
      invalidateYearTotals(queryClient, yearMonth);
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
      invalidateYearTotals(queryClient, yearMonth);
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
      invalidateYearTotals(queryClient, yearMonth);
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
      invalidateYearTotals(queryClient, yearMonth);
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      toast.success("Posted to ledger");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePostedBudgetLine(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      date,
      amount,
      description,
    }: {
      id: number;
      date: Date;
      amount: number;
      description?: string;
    }) => updateBudgetLineLedger(id, { date, amount, description }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetMonthKey(yearMonth) });
      invalidateYearTotals(queryClient, yearMonth);
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      toast.success("Ledger entry updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveBudgetLineFromLedger(yearMonth: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeBudgetLineFromLedger,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetMonthKey(yearMonth) });
      invalidateYearTotals(queryClient, yearMonth);
      void queryClient.invalidateQueries({ queryKey: INCOME_EXPENSE_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: LOANS_QUERY_KEY });
      toast.success("Removed from ledger");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
