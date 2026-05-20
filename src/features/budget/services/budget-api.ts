import type {
  AmountMode,
  MonthlyBudgetDetail,
  MonthlyBudgetSummary,
  RecurringBudgetItem,
  BudgetLine,
} from "@/features/budget/types/budget";
import { format } from "date-fns";

const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchBudgetTemplates(): Promise<RecurringBudgetItem[]> {
  return request<RecurringBudgetItem[]>("/budget/templates");
}

export async function createBudgetTemplate(
  data: Omit<RecurringBudgetItem, "id" | "sortOrder" | "isActive" | "amount"> & {
    amount?: number;
    sortOrder?: number;
  },
): Promise<RecurringBudgetItem> {
  return request<RecurringBudgetItem>("/budget/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateBudgetTemplate(
  id: number,
  data: RecurringBudgetItem,
): Promise<RecurringBudgetItem> {
  return request<RecurringBudgetItem>(`/budget/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteBudgetTemplate(id: number): Promise<void> {
  await request(`/budget/templates/${id}`, { method: "DELETE" });
}

export async function fetchBudgetMonths(): Promise<MonthlyBudgetSummary[]> {
  return request<MonthlyBudgetSummary[]>("/budget/months");
}

export async function fetchBudgetMonth(
  yearMonth: string,
): Promise<MonthlyBudgetDetail> {
  return request<MonthlyBudgetDetail>(
    `/budget/months/${encodeURIComponent(yearMonth)}`,
  );
}

export type AnnualBudgetTotals = {
  year: string;
  incomeTotal: number;
  expenseTotal: number;
  savingsTotal: number;
  fixedDepositTotal: number;
  remaining: number;
};

export async function fetchAnnualBudgetTotals(year: string): Promise<AnnualBudgetTotals> {
  return request<AnnualBudgetTotals>(`/budget/years/${encodeURIComponent(year)}/totals`);
}

export async function createMonthFromTemplate(
  yearMonth: string,
  amountMode: AmountMode = "template",
): Promise<MonthlyBudgetDetail> {
  const result = await request<{ month: MonthlyBudgetDetail }>(
    `/budget/months/${encodeURIComponent(yearMonth)}/from-template`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMode }),
    },
  );
  return result.month;
}

export async function addBudgetLine(
  yearMonth: string,
  data: {
    description: string;
    amount: number;
    financeType: string;
    section: string;
    plannedDate?: string | null;
    itemType?: string;
    savingsBucket?: string;
    featureCategory?: string | null;
    loanPaymentId?: number | null;
    fixedDepositDate?: string;
    fixedDepositMaturityMonths?: number;
    fixedDepositInterestRate?: number;
  },
): Promise<BudgetLine> {
  return request<BudgetLine>(
    `/budget/months/${encodeURIComponent(yearMonth)}/lines`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );
}

export async function updateBudgetLine(
  id: number,
  data: Partial<{
    description: string;
    amount: number;
    financeType: string;
    section: string;
    status: string;
    itemType: string;
    fixedDepositDate: string | null;
    fixedDepositMaturityMonths: number | null;
    fixedDepositInterestRate: number | null;
  }>,
): Promise<BudgetLine> {
  return request<BudgetLine>(`/budget/lines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteBudgetLine(id: number): Promise<void> {
  await request(`/budget/lines/${id}`, { method: "DELETE" });
}

export async function postBudgetLineToLedger(
  id: number,
  data: { date: Date; amount: number },
): Promise<{ transactionId: number; line: BudgetLine }> {
  return request(`/budget/lines/${id}/post-to-ledger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: format(data.date, "yyyy-MM-dd"),
      amount: data.amount,
    }),
  });
}

export async function updateBudgetLineLedger(
  id: number,
  data: { date: Date; amount: number; description?: string },
): Promise<{ line: BudgetLine }> {
  return request(`/budget/lines/${id}/ledger`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: format(data.date, "yyyy-MM-dd"),
      amount: data.amount,
      description: data.description,
    }),
  });
}

export async function removeBudgetLineFromLedger(id: number): Promise<void> {
  await request(`/budget/lines/${id}/ledger`, { method: "DELETE" });
}

export function currentYearMonth(): string {
  return format(new Date(), "yyyy-MM");
}
