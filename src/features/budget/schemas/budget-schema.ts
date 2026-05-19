import { z } from "zod";
import { FINANCE_TYPES } from "@/shared/constants/sheets";

const budgetSection = z.enum(["income", "fixed", "variable", "savings"]);
const amountSource = z.enum(["template", "previous_month"]);
const frequency = z.enum(["monthly", "manual_only"]);

export const recurringItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .nonnegative("Amount cannot be negative")
    .optional(),
  financeType: z.enum(FINANCE_TYPES),
  section: budgetSection,
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  amountSource: amountSource.optional(),
  frequency: frequency.optional(),
});

export type RecurringItemFormValues = z.infer<typeof recurringItemSchema>;

export const budgetLineSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  financeType: z.enum(FINANCE_TYPES),
  section: budgetSection,
});

export type BudgetLineFormValues = z.infer<typeof budgetLineSchema>;

export const postToLedgerSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

export type PostToLedgerFormValues = z.infer<typeof postToLedgerSchema>;
