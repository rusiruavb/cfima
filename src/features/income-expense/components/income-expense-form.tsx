import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { useAddTransaction } from "@/features/income-expense/hooks/use-add-transaction";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/features/income-expense/schemas/transaction-schema";
import { FINANCE_TYPES } from "@/shared/constants/sheets";
import { AmountInput } from "@/shared/components/amount-input";
import { DatePickerField } from "@/shared/components/date-picker-field";

export function IncomeExpenseForm() {
  const addMutation = useAddTransaction();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      financeType: "Expense",
    },
  });

  const onSubmit = (values: TransactionFormValues) => {
    addMutation.mutate(values, {
      onSuccess: () => {
        form.reset({
          date: new Date(),
          description: "",
          financeType: "Expense",
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-lg border border-primary/20 bg-secondary/30 p-4 sm:p-5 md:flex-row md:flex-wrap md:items-end"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="w-full min-w-0 flex-1 md:min-w-[160px]">
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
            <FormItem className="w-full min-w-0 flex-1 md:min-w-[120px]">
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
            <FormItem className="w-full min-w-0 flex-[2] md:min-w-[180px]">
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
          name="financeType"
          render={({ field }) => (
            <FormItem className="w-full min-w-0 flex-1 md:min-w-[140px]">
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
        <Button
          type="submit"
          disabled={addMutation.isPending}
          className="w-full md:mb-0.5 md:w-auto"
        >
          {addMutation.isPending ? "Adding…" : "Add"}
        </Button>
      </form>
    </Form>
  );
}
