import { z } from "zod";
import { FINANCE_TYPES } from "@/shared/constants/sheets";

export const TRANSACTION_CATEGORIES = [
  "Income",
  "Fixed expenses",
  "Variable expenses",
  "Savings & one-off",
  "Loans",
] as const;

export const transactionSchema = z
  .object({
    date: z.date({ required_error: "Date is required" }),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    description: z.string().min(1, "Description is required"),
    financeType: z.enum(FINANCE_TYPES),
    category: z.enum(TRANSACTION_CATEGORIES),
    loanId: z.string().optional().nullable(),
    loanPaymentId: z.coerce.number().int().positive().optional().nullable(),
    itemType: z.enum(["regular", "fixed_deposit"]),
    featureCategory: z.string().optional().nullable(),
    savingsBucket: z.enum(["savings", "one_off"]).optional(),
    fixedDepositDate: z.string().nullable().optional(),
    fixedDepositMaturityMonths: z.coerce.number().int().positive().nullable().optional(),
    fixedDepositInterestRate: z.coerce.number().min(0).max(100).nullable().optional(),
    budgetLineId: z.coerce.number().int().positive().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.category !== "Loans") return;

    if (!val.loanId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["loanId"],
        message: "Select a loan",
      });
    }
    if (!val.loanPaymentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["loanPaymentId"],
        message: "Select a loan month",
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
