import type { FinanceType } from "@/features/income-expense/types/transaction";

export type BudgetSection = "income" | "fixed" | "variable" | "savings";
export type AmountSource = "template" | "previous_month";
export type BudgetFrequency = "monthly" | "manual_only";
export type BudgetLineStatus = "planned" | "paid" | "skipped";
export type AmountMode = "template" | "previous_month";

export type RecurringBudgetItem = {
  id: number;
  description: string;
  amount: number;
  financeType: FinanceType;
  section: BudgetSection;
  sortOrder: number;
  isActive: boolean;
  amountSource: AmountSource;
  frequency: BudgetFrequency;
};

export type MonthlyBudgetSummary = {
  id: number;
  yearMonth: string;
  status: string;
  source: string;
  createdAt: string;
};

export type BudgetLine = {
  id: number;
  recurringItemId: number | null;
  description: string;
  amount: number;
  financeType: FinanceType;
  section: BudgetSection;
  sortOrder: number;
  status: BudgetLineStatus;
  transactionId: number | null;
  paidAt: string | null;
};

export type BudgetTotals = {
  incomeTotal: number;
  fixedTotal: number;
  variableTotal: number;
  expenseTotal: number;
  savingsTotal: number;
  remaining: number;
};

export type MonthlyBudgetDetail = {
  id: number;
  yearMonth: string;
  status: string;
  source: string;
  createdAt: string;
  lines: BudgetLine[];
  totals: BudgetTotals;
  sectionOrder: BudgetSection[];
};
