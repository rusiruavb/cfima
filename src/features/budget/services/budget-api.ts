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

export function currentYearMonth(): string {
  return format(new Date(), "yyyy-MM");
}
