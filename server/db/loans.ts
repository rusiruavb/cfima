import { randomUUID } from "node:crypto";
import { exportBudgetData } from "./budget.js";
import { getDb } from "./index.js";
import { deleteAttachment } from "./attachments.js";
import { listLedgerEntries } from "./budget.js";

export type LoanRow = {
  id: string;
  name: string;
  type: string;
  months: number;
  monthly_payment: number;
};

export type PaymentRow = {
  id: number;
  loan_id: string;
  sort_order: number;
  month_label: string;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  remaining_balance: number;
  attachment_path: string | null;
  attachment_name: string | null;
  status: string;
  transaction_id: number | null;
  budget_line_id: number | null;
};

export function listLoans(): LoanRow[] {
  return getDb()
    .prepare("SELECT id, name, type, months, monthly_payment FROM loans ORDER BY name")
    .all() as LoanRow[];
}

export function getLoan(id: string): LoanRow | undefined {
  return getDb()
    .prepare("SELECT id, name, type, months, monthly_payment FROM loans WHERE id = ?")
    .get(id) as LoanRow | undefined;
}

export function getLoanByName(name: string): LoanRow | undefined {
  return getDb()
    .prepare("SELECT id, name, type, months, monthly_payment FROM loans WHERE name = ?")
    .get(name) as LoanRow | undefined;
}

export function listPayments(loanId: string): PaymentRow[] {
  return getDb()
    .prepare(
      `SELECT id, loan_id, sort_order, month_label, payment_amount, principal_amount,
              interest_amount, remaining_balance, attachment_path, attachment_name, status,
              transaction_id, budget_line_id
       FROM loan_payments WHERE loan_id = ? ORDER BY sort_order`,
    )
    .all(loanId) as PaymentRow[];
}

export function getPayment(id: number): PaymentRow | undefined {
  return getDb()
    .prepare(
      `SELECT id, loan_id, sort_order, month_label, payment_amount, principal_amount,
              interest_amount, remaining_balance, attachment_path, attachment_name, status,
              transaction_id, budget_line_id
       FROM loan_payments WHERE id = ?`,
    )
    .get(id) as PaymentRow | undefined;
}

function buildPaymentRows(months: number, monthlyPayment: number) {
  const rows = [];
  for (let m = 1; m <= months; m++) {
    const remaining = (months - m) * monthlyPayment;
    rows.push({
      sort_order: m,
      month_label: `Month ${m}`,
      payment_amount: monthlyPayment,
      principal_amount: monthlyPayment,
      interest_amount: 0,
      remaining_balance: remaining,
      status: "pending",
    });
  }
  return rows;
}

export function createLoan(data: {
  name: string;
  type: string;
  months: number;
  monthlyPayment: number;
}): string {
  const id = randomUUID();
  const now = new Date().toISOString();
  const db = getDb();
  const insertLoan = db.prepare(
    `INSERT INTO loans (id, name, type, months, monthly_payment, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertPayment = db.prepare(
    `INSERT INTO loan_payments (
      loan_id, sort_order, month_label, payment_amount, principal_amount,
      interest_amount, remaining_balance, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const paymentRows = buildPaymentRows(data.months, data.monthlyPayment);

  db.transaction(() => {
    insertLoan.run(id, data.name, data.type, data.months, data.monthlyPayment, now, now);
    for (const p of paymentRows) {
      insertPayment.run(
        id,
        p.sort_order,
        p.month_label,
        p.payment_amount,
        p.principal_amount,
        p.interest_amount,
        p.remaining_balance,
        p.status,
      );
    }
  })();

  return id;
}

export function updateLoan(
  id: string,
  data: {
    name: string;
    type: string;
    months: number;
    monthlyPayment: number;
  },
): string {
  const existing = getLoan(id);
  if (!existing) throw new Error("Loan not found");

  const currentPayments = listPayments(id);
  const newPaymentRows = buildPaymentRows(data.months, data.monthlyPayment);

  const merged = newPaymentRows.map((row, i) => {
    const existingPayment = currentPayments[i];
    return {
      ...row,
      attachment_path: existingPayment?.attachment_path ?? null,
      attachment_name: existingPayment?.attachment_name ?? null,
      status: existingPayment?.status ?? "pending",
    };
  });

  const now = new Date().toISOString();
  const db = getDb();

  db.transaction(() => {
    db.prepare(
      `UPDATE loans SET name = ?, type = ?, months = ?, monthly_payment = ?, updated_at = ? WHERE id = ?`,
    ).run(data.name, data.type, data.months, data.monthlyPayment, now, id);

    db.prepare("DELETE FROM loan_payments WHERE loan_id = ?").run(id);

    const insertPayment = db.prepare(
      `INSERT INTO loan_payments (
        loan_id, sort_order, month_label, payment_amount, principal_amount,
        interest_amount, remaining_balance, attachment_path, attachment_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const p of merged) {
      insertPayment.run(
        id,
        p.sort_order,
        p.month_label,
        p.payment_amount,
        p.principal_amount,
        p.interest_amount,
        p.remaining_balance,
        p.attachment_path,
        p.attachment_name,
        p.status,
      );
    }
  })();

  return id;
}

export function deleteLoan(id: string): void {
  const payments = listPayments(id);
  for (const p of payments) {
    deleteAttachment(p.attachment_path);
  }
  getDb().prepare("DELETE FROM loans WHERE id = ?").run(id);
}

export function updatePaymentStatus(id: number, status: string): void {
  getDb().prepare("UPDATE loan_payments SET status = ? WHERE id = ?").run(status, id);
}

export function updatePaymentAttachment(
  id: number,
  attachmentPath: string,
  attachmentName: string,
): void {
  const existing = getPayment(id);
  if (existing?.attachment_path && existing.attachment_path !== attachmentPath) {
    deleteAttachment(existing.attachment_path);
  }
  getDb()
    .prepare(
      "UPDATE loan_payments SET attachment_path = ?, attachment_name = ? WHERE id = ?",
    )
    .run(attachmentPath, attachmentName, id);
}

export function linkPaymentToBudgetLine(paymentId: number, budgetLineId: number): void {
  const payment = getPayment(paymentId);
  if (!payment) throw new Error("Payment not found");

  getDb()
    .prepare(
      `UPDATE loan_payments
       SET status = 'paid', budget_line_id = ?
       WHERE id = ?`,
    )
    .run(budgetLineId, paymentId);
}

export function unlinkPaymentBudgetLine(paymentId: number, budgetLineId: number): void {
  const payment = getPayment(paymentId);
  if (!payment) return;

  if (payment.budget_line_id !== budgetLineId) return;

  getDb()
    .prepare(
      `UPDATE loan_payments
       SET status = 'pending', budget_line_id = NULL
       WHERE id = ?`,
    )
    .run(paymentId);
}

export function exportAllData() {
  const transactions = listLedgerEntries();
  const loans = listLoans().map((loan) => ({
    ...loan,
    payments: listPayments(loan.id),
  }));
  return {
    exportedAt: new Date().toISOString(),
    transactions,
    loans,
    budget: exportBudgetData(),
  };
}
