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
  recurringItemSchema,
  type RecurringItemFormValues,
} from "@/features/budget/schemas/budget-schema";
import type { BudgetSection, RecurringBudgetItem } from "@/features/budget/types/budget";
import { SECTION_LABELS, SECTION_ORDER } from "@/features/budget/lib/section-labels";
import { AmountInput } from "@/shared/components/amount-input";
import { FINANCE_TYPES } from "@/shared/constants/sheets";

interface TemplateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: BudgetSection;
  item?: RecurringBudgetItem | null;
  onSubmit: (values: RecurringItemFormValues) => void;
  isPending?: boolean;
}

export function TemplateItemDialog({
  open,
  onOpenChange,
  section,
  item,
  onSubmit,
  isPending,
}: TemplateItemDialogProps) {
  const form = useForm<RecurringItemFormValues>({
    resolver: zodResolver(recurringItemSchema),
    defaultValues: {
      description: "",
      amount: undefined,
      financeType: section === "income" ? "Income" : "Expense",
      section,
      amountSource: "template",
      frequency: "monthly",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: item?.description ?? "",
        amount: item?.amount && item.amount > 0 ? item.amount : undefined,
        financeType: item?.financeType ?? (section === "income" ? "Income" : "Expense"),
        section: item?.section ?? section,
        amountSource: item?.amountSource ?? "template",
        frequency: item?.frequency ?? "monthly",
        isActive: item?.isActive ?? true,
      });
    }
  }, [open, item, section, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Edit template item" : "Add template item"}</DialogTitle>
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
                  <FormLabel>Default amount (optional)</FormLabel>
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
            <FormField
              control={form.control}
              name="amountSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount when duplicating</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="template">Use template amount</SelectItem>
                      <SelectItem value="previous_month">Use previous month</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Include when creating month</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Every month</SelectItem>
                      <SelectItem value="manual_only">Manual only (skip on duplicate)</SelectItem>
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
                {isPending ? "Saving…" : item ? "Save" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
