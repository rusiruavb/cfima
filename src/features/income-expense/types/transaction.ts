import type { FINANCE_TYPES } from "@/shared/constants/sheets";
import type { BudgetItemType, SavingsBucket } from "@/features/budget/types/budget";

export type FinanceType = (typeof FINANCE_TYPES)[number];

export interface TransactionLedgerContext {
  budgetLineId: number;
  section: string;
  itemType: BudgetItemType;
  featureCategory?: string | null;
  savingsBucket?: SavingsBucket;
  fixedDepositDate?: string | null;
  fixedDepositMaturityMonths?: number | null;
  fixedDepositInterestRate?: number | null;
}

export interface Transaction {
  rowIndex: number;
  date: string;
  amount: number;
  description: string;
  financeType: FinanceType;
  category?: string;
  loanPaymentId?: number | null;
  driveLink: string;
  fileName: string;
  ledgerContext?: TransactionLedgerContext | null;
}
