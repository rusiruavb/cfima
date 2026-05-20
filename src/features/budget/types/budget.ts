import type { FinanceType } from "@/features/income-expense/types/transaction";

export type BudgetSection = "income" | "fixed" | "variable" | "savings";
export type AmountSource = "template" | "previous_month";
export type BudgetFrequency = "monthly" | "manual_only";
export type BudgetLineStatus = "planned" | "paid" | "skipped";
export type AmountMode = "template" | "previous_month";
export type BudgetItemType = "regular" | "fixed_deposit";
export type SavingsBucket = "savings" | "one_off";

export type RecurringBudgetItem = {
  id: number;
  description: string;
  amount: number;
  financeType: FinanceType;
  section: BudgetSection;
  itemType?: BudgetItemType;
  savingsBucket?: SavingsBucket;
  featureCategory?: string | null;
  fixedDepositDay?: number | null;
  fixedDepositMaturityMonths?: number | null;
  fixedDepositInterestRate?: number | null;
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
  itemType?: BudgetItemType;
  savingsBucket?: SavingsBucket;
  featureCategory?: string | null;
  loanPaymentId?: number | null;
  plannedDate?: string | null;
  fixedDepositDate?: string | null;
  fixedDepositMaturityMonths?: number | null;
  fixedDepositInterestRate?: number | null;
  sortOrder: number;
  status: BudgetLineStatus;
  entryDate: string | null;
  paidAt: string | null;
};

export type BudgetTotals = {
  incomeTotal: number;
  fixedTotal: number;
  variableTotal: number;
  expenseTotal: number;
  fixedDepositTotal: number;
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
