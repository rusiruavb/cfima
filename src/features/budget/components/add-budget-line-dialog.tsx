import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  budgetLineSchema,
  type BudgetLineFormValues,
} from "@/features/budget/schemas/budget-schema";
import { SECTION_LABELS, SECTION_ORDER } from "@/features/budget/lib/section-labels";
import type { BudgetSection } from "@/features/budget/types/budget";
import { AmountInput } from "@/shared/components/amount-input";
import { FINANCE_TYPES } from "@/shared/constants/sheets";

interface AddBudgetLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSection: BudgetSection;
  onSubmit: (values: BudgetLineFormValues) => void;
  isPending?: boolean;
}

export function AddBudgetLineDialog({
  open,
  onOpenChange,
  defaultSection,
  onSubmit,
  isPending,
}: AddBudgetLineDialogProps) {
  const form = useForm<BudgetLineFormValues>({
    resolver: zodResolver(budgetLineSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      financeType: defaultSection === "income" ? "Income" : "Expense",
      section: defaultSection,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: "",
        amount: undefined,
        financeType: defaultSection === "income" ? "Income" : "Expense",
        section: defaultSection,
      });
    }
  }, [open, defaultSection, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add line to month</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => onSubmit(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <AmountInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SECTION_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SECTION_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="financeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FINANCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
