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
import {
  postToLedgerSchema,
  type PostToLedgerFormValues,
} from "@/features/budget/schemas/budget-schema";
import type { BudgetLine } from "@/features/budget/types/budget";
import { AmountInput } from "@/shared/components/amount-input";
import { DatePickerField } from "@/shared/components/date-picker-field";

interface PostToLedgerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: BudgetLine | null;
  onSubmit: (values: PostToLedgerFormValues) => void;
  isPending?: boolean;
}

export function PostToLedgerDialog({
  open,
  onOpenChange,
  line,
  onSubmit,
  isPending,
}: PostToLedgerDialogProps) {
  const form = useForm<PostToLedgerFormValues>({
    resolver: zodResolver(postToLedgerSchema),
    defaultValues: {
      date: new Date(),
      amount: 0,
    },
  });

  useEffect(() => {
    if (open && line) {
      form.reset({ date: new Date(), amount: line.amount });
    }
  }, [open, line, form]);

  if (!line) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Post to ledger</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{line.description}</p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => onSubmit(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction date</FormLabel>
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
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <AmountInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
