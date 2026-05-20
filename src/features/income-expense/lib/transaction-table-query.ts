import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import type { Transaction } from "@/features/income-expense/types/transaction";

export type SortKey = keyof Pick<
  Transaction,
  "date" | "amount" | "description" | "financeType"
>;
export type SortDir = "asc" | "desc";

export type DateFilterMode = "all" | "month" | "range";

export interface DateFilter {
  mode: DateFilterMode;
  month: string;
  rangeFrom?: Date;
  rangeTo?: Date;
}

export interface TransactionFilters {
  date: DateFilter;
  amount: string;
  description: string;
  financeType: string;
  category: string;
}

export interface TransactionSort {
  key: SortKey;
  dir: SortDir;
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilters = {
  date: { mode: "all", month: format(new Date(), "yyyy-MM") },
  amount: "",
  description: "",
  financeType: "",
  category: "",
};

export const DEFAULT_TRANSACTION_SORT: TransactionSort = {
  key: "date",
  dir: "desc",
};

function matchesDateFilter(dateStr: string, filter: DateFilter): boolean {
  if (filter.mode === "all") return true;

  const date = parseISO(dateStr);

  if (filter.mode === "month") {
    if (!filter.month) return true;
    return format(date, "yyyy-MM") === filter.month;
  }

  if (filter.rangeFrom && date < startOfDay(filter.rangeFrom)) return false;
  if (filter.rangeTo && date > endOfDay(filter.rangeTo)) return false;
  return true;
}

export function applyTransactionQuery(
  rows: Transaction[],
  filters: TransactionFilters,
  sort: TransactionSort,
): Transaction[] {
  let result = [...rows];

  result = result.filter((row) => matchesDateFilter(row.date, filters.date));

  if (filters.amount) {
    result = result.filter((row) => String(row.amount).includes(filters.amount));
  }

  if (filters.description) {
    const q = filters.description.toLowerCase();
    result = result.filter((row) => row.description.toLowerCase().includes(q));
  }

  if (filters.financeType) {
    result = result.filter((row) => row.financeType === filters.financeType);
  }

  if (filters.category) {
    result = result.filter((row) => row.category === filters.category);
  }

  result.sort((a, b) => {
    let cmp = 0;
    if (sort.key === "amount") cmp = a.amount - b.amount;
    else if (sort.key === "date")
      cmp = parseISO(a.date).getTime() - parseISO(b.date).getTime();
    else cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  return result;
}

export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;
  if (filters.date.mode === "month") count += 1;
  else if (
    filters.date.mode === "range" &&
    (filters.date.rangeFrom || filters.date.rangeTo)
  ) {
    count += 1;
  }
  if (filters.amount) count += 1;
  if (filters.description) count += 1;
  if (filters.financeType) count += 1;
  if (filters.category) count += 1;
  return count;
}
