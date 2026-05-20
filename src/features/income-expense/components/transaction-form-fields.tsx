import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
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
import { FixedDepositFormFields } from "@/features/income-expense/components/fixed-deposit-form-fields";
import {
  TRANSACTION_CATEGORIES,
  type TransactionFormValues,
} from "@/features/income-expense/schemas/transaction-schema";
import { useLoans } from "@/features/loans/hooks/use-loans";
import { FINANCE_TYPES } from "@/shared/constants/sheets";
import { AmountInput } from "@/shared/components/amount-input";
import { DatePickerField } from "@/shared/components/date-picker-field";
import { cn } from "@/shared/lib/utils";

type TransactionFormLayout = "inline" | "stacked";

const fieldClass = {
  inline: {
    date: "w-full min-w-0 flex-1 md:min-w-[160px]",
    amount: "w-full min-w-0 flex-1 md:min-w-[120px]",
    description: "w-full min-w-0 flex-[2] md:min-w-[180px]",
    category: "w-full min-w-0 flex-1 md:min-w-[200px]",
    loan: "w-full min-w-0 flex-1 md:min-w-[220px]",
    financeType: "w-full min-w-0 flex-1 md:min-w-[140px]",
  },
  stacked: {
    date: "w-full",
    amount: "w-full",
    description: "w-full",
    category: "w-full",
    loan: "w-full",
    financeType: "w-full",
  },
} as const;

interface TransactionFormFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
  layout?: TransactionFormLayout;
}

export function TransactionFormFields({
  form,
  layout = "stacked",
}: TransactionFormFieldsProps) {
  const { data: loans = [] } = useLoans();
  const category = form.watch("category");
  const itemType = form.watch("itemType");
  const selectedLoanId = form.watch("loanId");
  const isFixedDeposit = category === "Savings & one-off" && itemType === "fixed_deposit";
  const selectedLoan = useMemo(
    () => loans.find((l) => l.id === selectedLoanId) ?? null,
    [loans, selectedLoanId],
  );
  const classes = fieldClass[layout];

  useEffect(() => {
    if (category === "Loans") {
      if (form.getValues("financeType") !== "Expense") {
        form.setValue("financeType", "Expense", { shouldValidate: true });
      }
      return;
    }
    form.setValue("loanId", null, { shouldValidate: true });
    form.setValue("loanPaymentId", null, { shouldValidate: true });

    if (category !== "Savings & one-off") {
      form.setValue("itemType", "regular", { shouldValidate: true });
      form.setValue("fixedDepositDate", null, { shouldValidate: true });
      form.setValue("fixedDepositMaturityMonths", null, { shouldValidate: true });
      form.setValue("fixedDepositInterestRate", null, { shouldValidate: true });
    }
  }, [category, form]);

  useEffect(() => {
    if (category !== "Loans") return;
    const paymentId = form.getValues("loanPaymentId");
    if (paymentId == null) return;
    const loan = loans.find((l) => l.id === selectedLoanId);
    if (!loan?.payments.some((p) => p.rowIndex === paymentId)) {
      form.setValue("loanPaymentId", null, { shouldValidate: true });
    }
  }, [category, selectedLoanId, form, loans]);

  return (
    <>
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className={classes.date}>
            <FormLabel>Date</FormLabel>
            <FormControl>
              <DatePickerField value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem className={classes.amount}>
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
        name="description"
        render={({ field }) => (
          <FormItem className={classes.description}>
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
        name="category"
        render={({ field }) => (
          <FormItem className={classes.category}>
            <FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TRANSACTION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {category === "Savings & one-off" ? (
        <FormField
          control={form.control}
          name="itemType"
          render={({ field }) => (
            <FormItem className={classes.category}>
              <FormLabel>Saving type</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                  if (v !== "fixed_deposit") {
                    form.setValue("fixedDepositDate", null);
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
      ) : null}
      {isFixedDeposit ? <FixedDepositFormFields form={form} /> : null}
      {category === "Savings & one-off" && itemType !== "fixed_deposit" ? (
        <FormField
          control={form.control}
          name="savingsBucket"
          render={({ field }) => (
            <FormItem className={classes.category}>
              <FormLabel>Savings bucket</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? "savings"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="one_off">One-off</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      {category === "Loans" ? (
        <>
          <FormField
            control={form.control}
            name="loanId"
            render={({ field }) => (
              <FormItem className={classes.loan}>
                <FormLabel>Loan</FormLabel>
                <Select onValueChange={(v) => field.onChange(v)} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a loan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loans.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
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
            name="loanPaymentId"
            render={({ field }) => (
              <FormItem className={classes.loan}>
                <FormLabel>Loan month</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value != null ? String(field.value) : ""}
                  disabled={!selectedLoan}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={selectedLoan ? "Select month" : "Select a loan first"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(selectedLoan?.payments ?? []).map((p) => (
                      <SelectItem key={p.rowIndex} value={String(p.rowIndex)}>
                        {p.month} {p.status === "paid" ? "(paid)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
      <FormField
        control={form.control}
        name="financeType"
        render={({ field }) => (
          <FormItem className={classes.financeType}>
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
    </>
  );
}

export function transactionFormFieldsWrapperClass(layout: TransactionFormLayout) {
  return cn(
    layout === "inline"
      ? "flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end"
      : "space-y-4",
  );
}
