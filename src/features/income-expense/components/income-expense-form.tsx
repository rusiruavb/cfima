import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  TransactionFormFields,
  transactionFormFieldsWrapperClass,
} from "@/features/income-expense/components/transaction-form-fields";
import { useAddTransaction } from "@/features/income-expense/hooks/use-add-transaction";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/features/income-expense/schemas/transaction-schema";

export function IncomeExpenseForm() {
  const addMutation = useAddTransaction();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      category: "Income",
      financeType: "Expense",
      loanId: null,
      loanPaymentId: null,
      itemType: "regular",
      budgetLineId: null,
    },
  });

  const onSubmit = (values: TransactionFormValues) => {
    addMutation.mutate(values, {
      onSuccess: () => {
        form.reset({
          date: new Date(),
          description: "",
          category: "Income",
          financeType: "Expense",
          loanId: null,
          loanPaymentId: null,
          itemType: "regular",
          budgetLineId: null,
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="rounded-lg border border-primary/20 bg-secondary/30 p-4 sm:p-5"
      >
        <div className={transactionFormFieldsWrapperClass("inline")}>
          <TransactionFormFields form={form} layout="inline" />
          <Button
            type="submit"
            disabled={addMutation.isPending}
            className="w-full md:mb-0.5 md:w-auto"
          >
            {addMutation.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
