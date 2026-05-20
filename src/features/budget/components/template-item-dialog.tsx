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
      itemType: "regular",
      fixedDepositDay: null,
      fixedDepositMaturityMonths: null,
      fixedDepositInterestRate: null,
      amountSource: "template",
      frequency: "monthly",
      isActive: true,
    },
  });

  const selectedSection = form.watch("section");
  const itemType = form.watch("itemType") ?? "regular";
  const isFixedDeposit = selectedSection === "savings" && itemType === "fixed_deposit";

  useEffect(() => {
    if (open) {
      form.reset({
        description: item?.description ?? "",
        amount: item?.amount && item.amount > 0 ? item.amount : undefined,
        financeType: item?.financeType ?? (section === "income" ? "Income" : "Expense"),
        section: item?.section ?? section,
        itemType: item?.itemType ?? "regular",
        fixedDepositDay: item?.fixedDepositDay ?? null,
        fixedDepositMaturityMonths: item?.fixedDepositMaturityMonths ?? null,
        fixedDepositInterestRate: item?.fixedDepositInterestRate ?? null,
        amountSource: item?.amountSource ?? "template",
        frequency: item?.frequency ?? "monthly",
        isActive: item?.isActive ?? true,
      });
    }
  }, [open, item, section, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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

            {selectedSection === "savings" && (
              <FormField
                control={form.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saving type</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        if (v !== "fixed_deposit") {
                          form.setValue("fixedDepositDay", null);
                          form.setValue("fixedDepositMaturityMonths", null);
                          form.setValue("fixedDepositInterestRate", null);
                        }
                      }}
                      value={field.value ?? "regular"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular saving</SelectItem>
                        <SelectItem value="fixed_deposit">Fixed deposit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isFixedDeposit && (
              <div className="space-y-4 rounded-lg border border-primary/15 bg-secondary/20 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="fixedDepositDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit date (day)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={31}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            placeholder="10"
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          We’ll apply this day to each month (clamped for shorter months).
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fixedDepositInterestRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest %</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={100}
                            step="0.01"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            placeholder="8.50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fixedDepositMaturityMonths"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <FormLabel>Maturity</FormLabel>
                          <Select
                            onValueChange={(v) => {
                              if (v === "custom") {
                                field.onChange(field.value ?? null);
                                return;
                              }
                              field.onChange(Number(v));
                            }}
                            value={
                              field.value == null
                                ? ""
                                : [3, 6, 9, 12, 24, 36].includes(field.value)
                                  ? String(field.value)
                                  : "custom"
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select period" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="3">3 months</SelectItem>
                              <SelectItem value="6">6 months</SelectItem>
                              <SelectItem value="9">9 months</SelectItem>
                              <SelectItem value="12">1 year</SelectItem>
                              <SelectItem value="24">2 years</SelectItem>
                              <SelectItem value="36">3 years</SelectItem>
                              <SelectItem value="custom">Custom…</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <FormLabel htmlFor="fd-custom-months">Custom months</FormLabel>
                          <FormControl>
                            <Input
                              id="fd-custom-months"
                              type="number"
                              inputMode="numeric"
                              min={1}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === "" ? null : Number(e.target.value),
                                )
                              }
                              placeholder="18"
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
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
