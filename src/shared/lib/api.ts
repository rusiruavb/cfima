import type { Transaction, FinanceType } from "@/features/income-expense/types/transaction";
import type { Loan, PaymentStatus } from "@/features/loans/types/loan";
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

export function sanitizeName(name: string): string {
  return name.replace(/[[\]*?:/\\]/g, "").slice(0, 100).trim();
}

// Transactions
export async function fetchTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>("/transactions");
}

export async function addTransaction(data: {
  date: Date;
  amount: number;
  description: string;
  financeType: FinanceType;
  category?: string;
  loanPaymentId?: number | null;
  itemType?: "regular" | "fixed_deposit";
  featureCategory?: string | null;
  savingsBucket?: "savings" | "one_off";
  fixedDepositDate?: string | null;
  fixedDepositMaturityMonths?: number | null;
  fixedDepositInterestRate?: number | null;
  file?: File | null;
}): Promise<void> {
  const formData = new FormData();
  formData.append("date", format(data.date, "yyyy-MM-dd"));
  formData.append("amount", String(data.amount));
  formData.append("description", data.description);
  formData.append("financeType", data.financeType);
  if (data.category) formData.append("category", data.category);
  if (data.loanPaymentId != null) formData.append("loanPaymentId", String(data.loanPaymentId));
  if (data.itemType) formData.append("itemType", data.itemType);
  if (data.featureCategory != null) formData.append("featureCategory", data.featureCategory);
  if (data.savingsBucket) formData.append("savingsBucket", data.savingsBucket);
  if (data.fixedDepositDate != null) formData.append("fixedDepositDate", data.fixedDepositDate);
  if (data.fixedDepositMaturityMonths != null) {
    formData.append("fixedDepositMaturityMonths", String(data.fixedDepositMaturityMonths));
  }
  if (data.fixedDepositInterestRate != null) {
    formData.append("fixedDepositInterestRate", String(data.fixedDepositInterestRate));
  }
  if (data.file) formData.append("file", data.file);
  await request("/transactions", { method: "POST", body: formData });
}

export async function updateTransaction(
  rowIndex: number,
  data: {
    date: Date;
    amount: number;
    description: string;
    financeType: FinanceType;
    category?: string;
    loanPaymentId?: number | null;
    file?: File | null;
    existingLink?: string;
    budgetLineId?: number | null;
    itemType?: "regular" | "fixed_deposit";
    featureCategory?: string | null;
    savingsBucket?: "savings" | "one_off";
    fixedDepositDate?: string | null;
    fixedDepositMaturityMonths?: number | null;
    fixedDepositInterestRate?: number | null;
  },
): Promise<void> {
  const formData = new FormData();
  formData.append("date", format(data.date, "yyyy-MM-dd"));
  formData.append("amount", String(data.amount));
  formData.append("description", data.description);
  formData.append("financeType", data.financeType);
  if (data.category) formData.append("category", data.category);
  if (data.loanPaymentId != null) formData.append("loanPaymentId", String(data.loanPaymentId));
  if (data.budgetLineId != null) formData.append("budgetLineId", String(data.budgetLineId));
  if (data.itemType) formData.append("itemType", data.itemType);
  if (data.featureCategory != null) formData.append("featureCategory", data.featureCategory);
  if (data.savingsBucket) formData.append("savingsBucket", data.savingsBucket);
  if (data.fixedDepositDate != null) formData.append("fixedDepositDate", data.fixedDepositDate);
  if (data.fixedDepositMaturityMonths != null) {
    formData.append("fixedDepositMaturityMonths", String(data.fixedDepositMaturityMonths));
  }
  if (data.fixedDepositInterestRate != null) {
    formData.append("fixedDepositInterestRate", String(data.fixedDepositInterestRate));
  }
  if (!data.file && data.existingLink) {
    formData.append("keepAttachment", "true");
  }
  if (data.file) formData.append("file", data.file);
  await request(`/transactions/${rowIndex}`, { method: "PUT", body: formData });
}

export async function removeTransaction(rowIndex: number): Promise<void> {
  await request(`/transactions/${rowIndex}`, { method: "DELETE" });
}

// Loans
export async function fetchAllLoans(): Promise<Loan[]> {
  return request<Loan[]>("/loans");
}

export async function fetchLoanById(loanId: string): Promise<Loan> {
  return request<Loan>(`/loans/${encodeURIComponent(loanId)}`);
}

export async function createLoan(data: {
  name: string;
  type: string;
  months: number;
  monthlyPayment: number;
}): Promise<{ id: string; name: string }> {
  return request("/loans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateLoan(
  id: string,
  data: {
    name: string;
    type: string;
    months: number;
    monthlyPayment: number;
  },
): Promise<{ id: string; name: string }> {
  return request(`/loans/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteLoan(id: string): Promise<void> {
  await request(`/loans/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function togglePaymentStatus(
  loanId: string,
  paymentId: number,
): Promise<PaymentStatus> {
  const { status } = await request<{ status: PaymentStatus }>(
    `/loans/${encodeURIComponent(loanId)}/payments/${paymentId}/status`,
    { method: "PATCH" },
  );
  return status;
}

export async function uploadPaymentFile(
  loanId: string,
  paymentId: number,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await request(`/loans/${encodeURIComponent(loanId)}/payments/${paymentId}/file`, {
    method: "POST",
    body: formData,
  });
}

export function downloadExport(): void {
  window.location.href = `${API_BASE}/export`;
}
