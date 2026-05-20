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
import { Form } from "@/components/ui/form";
import {
  TransactionFormFields,
  transactionFormFieldsWrapperClass,
} from "@/features/income-expense/components/transaction-form-fields";
import { useUpdateTransaction } from "@/features/income-expense/hooks/use-update-transaction";
import { transactionToFormValues } from "@/features/income-expense/lib/transaction-form-utils";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/features/income-expense/schemas/transaction-schema";
import type { Transaction } from "@/features/income-expense/types/transaction";
import { useLoans } from "@/features/loans/hooks/use-loans";

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}) {
  const updateMutation = useUpdateTransaction();
  const { data: loans = [], isLoading: loansLoading } = useLoans();
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? transactionToFormValues(transaction, loans)
      : undefined,
  });

  useEffect(() => {
    if (!open || !transaction || loansLoading) return;
    form.reset(transactionToFormValues(transaction, loans));
  }, [open, transaction, loans, loansLoading, form]);

  if (!transaction) return null;

  const formReady = open && !loansLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
        </DialogHeader>
        {!formReady ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : null}
        <Form {...form}>
          <form
            className={formReady ? undefined : "hidden"}
            onSubmit={form.handleSubmit((values) =>
              updateMutation.mutate(
                {
                  rowIndex: transaction.rowIndex,
                  data: values,
                  existingLink: transaction.driveLink || undefined,
                },
                { onSuccess: () => onOpenChange(false) },
              ),
            )}
          >
            <div className={transactionFormFieldsWrapperClass("stacked")}>
              <TransactionFormFields form={form} layout="stacked" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
