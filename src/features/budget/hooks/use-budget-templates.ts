import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBudgetTemplate,
  deleteBudgetTemplate,
  fetchBudgetTemplates,
  updateBudgetTemplate,
} from "@/features/budget/services/budget-api";
import type { RecurringBudgetItem } from "@/features/budget/types/budget";

export const BUDGET_TEMPLATES_KEY = ["budget", "templates"] as const;

export function useBudgetTemplates() {
  return useQuery({
    queryKey: BUDGET_TEMPLATES_KEY,
    queryFn: fetchBudgetTemplates,
  });
}

export function useCreateBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudgetTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUDGET_TEMPLATES_KEY });
      toast.success("Template item added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RecurringBudgetItem }) =>
      updateBudgetTemplate(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUDGET_TEMPLATES_KEY });
      toast.success("Template item updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudgetTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBudgetTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUDGET_TEMPLATES_KEY });
      toast.success("Template item removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
