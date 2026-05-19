import { getDb } from "./index.js";
import { createTransaction } from "./transactions.js";

export type BudgetSection = "income" | "fixed" | "variable" | "savings";
export type AmountSource = "template" | "previous_month";
export type BudgetFrequency = "monthly" | "manual_only";
export type BudgetLineStatus = "planned" | "paid" | "skipped";
export type BudgetSource = "from_template" | "from_previous_month" | "manual";
export type AmountMode = "template" | "previous_month";

export type RecurringBudgetItemRow = {
  id: number;
  description: string;
  amount: number;
  finance_type: string;
  section: string;
  sort_order: number;
  is_active: number;
  amount_source: string;
  frequency: string;
};

export type MonthlyBudgetRow = {
  id: number;
  year_month: string;
  status: string;
  source: string;
  created_at: string;
};

export type MonthlyBudgetLineRow = {
  id: number;
  monthly_budget_id: number;
  recurring_item_id: number | null;
  description: string;
  amount: number;
  finance_type: string;
  section: string;
  sort_order: number;
  status: string;
  transaction_id: number | null;
  paid_at: string | null;
};

export type BudgetTotals = {
  incomeTotal: number;
  fixedTotal: number;
  variableTotal: number;
  expenseTotal: number;
  savingsTotal: number;
  remaining: number;
};

const SECTION_ORDER: BudgetSection[] = ["income", "fixed", "variable", "savings"];

export function previousYearMonth(yearMonth: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const date = new Date(year, month - 2, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function computeBudgetTotals(lines: MonthlyBudgetLineRow[]): BudgetTotals {
  const sumSection = (section: BudgetSection) =>
    lines
      .filter((l) => l.section === section && l.status !== "skipped")
      .reduce((acc, l) => acc + l.amount, 0);

  const incomeTotal = sumSection("income");
  const fixedTotal = sumSection("fixed");
  const variableTotal = sumSection("variable");
  const savingsTotal = sumSection("savings");
  const expenseTotal = fixedTotal + variableTotal;
  const remaining = incomeTotal - expenseTotal - savingsTotal;

  return {
    incomeTotal,
    fixedTotal,
    variableTotal,
    expenseTotal,
    savingsTotal,
    remaining,
  };
}

export function listRecurringItems(): RecurringBudgetItemRow[] {
  return getDb()
    .prepare(
      `SELECT id, description, amount, finance_type, section, sort_order, is_active,
              amount_source, frequency
       FROM recurring_budget_items
       ORDER BY section, sort_order, id`,
    )
    .all() as RecurringBudgetItemRow[];
}

export function getRecurringItem(id: number): RecurringBudgetItemRow | undefined {
  return getDb()
    .prepare(
      `SELECT id, description, amount, finance_type, section, sort_order, is_active,
              amount_source, frequency
       FROM recurring_budget_items WHERE id = ?`,
    )
    .get(id) as RecurringBudgetItemRow | undefined;
}

export function createRecurringItem(data: {
  description: string;
  amount?: number;
  financeType: string;
  section: BudgetSection;
  sortOrder?: number;
  amountSource?: AmountSource;
  frequency?: BudgetFrequency;
}): number {
  const now = new Date().toISOString();
  const maxOrder = getDb()
    .prepare(
      "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM recurring_budget_items WHERE section = ?",
    )
    .get(data.section) as { max_order: number };

  const result = getDb()
    .prepare(
      `INSERT INTO recurring_budget_items
        (description, amount, finance_type, section, sort_order, is_active, amount_source, frequency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
    )
    .run(
      data.description,
      data.amount ?? 0,
      data.financeType,
      data.section,
      data.sortOrder ?? maxOrder.max_order + 1,
      data.amountSource ?? "template",
      data.frequency ?? "monthly",
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function updateRecurringItem(
  id: number,
  data: {
    description: string;
    amount?: number;
    financeType: string;
    section: BudgetSection;
    sortOrder: number;
    isActive: boolean;
    amountSource: AmountSource;
    frequency: BudgetFrequency;
  },
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE recurring_budget_items SET
        description = ?, amount = ?, finance_type = ?, section = ?, sort_order = ?,
        is_active = ?, amount_source = ?, frequency = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      data.description,
      data.amount ?? 0,
      data.financeType,
      data.section,
      data.sortOrder,
      data.isActive ? 1 : 0,
      data.amountSource,
      data.frequency,
      now,
      id,
    );
}

export function deleteRecurringItem(id: number): void {
  getDb().prepare("DELETE FROM recurring_budget_items WHERE id = ?").run(id);
}

export function listMonthlyBudgets(): MonthlyBudgetRow[] {
  return getDb()
    .prepare(
      "SELECT id, year_month, status, source, created_at FROM monthly_budgets ORDER BY year_month DESC",
    )
    .all() as MonthlyBudgetRow[];
}

export function getMonthlyBudgetByYearMonth(
  yearMonth: string,
): MonthlyBudgetRow | undefined {
  return getDb()
    .prepare(
      "SELECT id, year_month, status, source, created_at FROM monthly_budgets WHERE year_month = ?",
    )
    .get(yearMonth) as MonthlyBudgetRow | undefined;
}

export function listBudgetLines(monthlyBudgetId: number): MonthlyBudgetLineRow[] {
  return getDb()
    .prepare(
      `SELECT id, monthly_budget_id, recurring_item_id, description, amount, finance_type,
              section, sort_order, status, transaction_id, paid_at
       FROM monthly_budget_lines
       WHERE monthly_budget_id = ?
       ORDER BY section, sort_order, id`,
    )
    .all(monthlyBudgetId) as MonthlyBudgetLineRow[];
}

export function getBudgetLine(id: number): MonthlyBudgetLineRow | undefined {
  return getDb()
    .prepare(
      `SELECT id, monthly_budget_id, recurring_item_id, description, amount, finance_type,
              section, sort_order, status, transaction_id, paid_at
       FROM monthly_budget_lines WHERE id = ?`,
    )
    .get(id) as MonthlyBudgetLineRow | undefined;
}

function resolveAmount(
  item: RecurringBudgetItemRow,
  amountMode: AmountMode,
  previousByRecurringId: Map<number, number>,
): number {
  const usePrevious =
    amountMode === "previous_month" || item.amount_source === "previous_month";
  if (usePrevious && previousByRecurringId.has(item.id)) {
    return previousByRecurringId.get(item.id)!;
  }
  return item.amount;
}

export function duplicateMonthFromTemplate(
  yearMonth: string,
  amountMode: AmountMode = "template",
): { budgetId: number; lineCount: number } {
  const existing = getMonthlyBudgetByYearMonth(yearMonth);
  if (existing) {
    const err = new Error("Budget already exists for this month") as Error & {
      code: string;
    };
    err.code = "BUDGET_EXISTS";
    throw err;
  }

  const items = listRecurringItems().filter(
    (i) => i.is_active && i.frequency === "monthly",
  );

  const previousByRecurringId = new Map<number, number>();
  const prevMonth = previousYearMonth(yearMonth);
  if (prevMonth && amountMode === "previous_month") {
    const prevBudget = getMonthlyBudgetByYearMonth(prevMonth);
    if (prevBudget) {
      for (const line of listBudgetLines(prevBudget.id)) {
        if (line.recurring_item_id != null) {
          previousByRecurringId.set(line.recurring_item_id, line.amount);
        }
      }
    }
  }

  const now = new Date().toISOString();
  const source: BudgetSource =
    amountMode === "previous_month" ? "from_previous_month" : "from_template";

  const budgetResult = getDb()
    .prepare(
      "INSERT INTO monthly_budgets (year_month, status, source, created_at) VALUES (?, 'active', ?, ?)",
    )
    .run(yearMonth, source, now);
  const budgetId = Number(budgetResult.lastInsertRowid);

  const insertLine = getDb().prepare(
    `INSERT INTO monthly_budget_lines
      (monthly_budget_id, recurring_item_id, description, amount, finance_type, section,
       sort_order, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?)`,
  );

  const effectiveMode =
    amountMode === "previous_month" ? "previous_month" : "template";

  for (const item of items) {
    const amount = resolveAmount(item, effectiveMode, previousByRecurringId);
    insertLine.run(
      budgetId,
      item.id,
      item.description,
      amount,
      item.finance_type,
      item.section,
      item.sort_order,
      now,
      now,
    );
  }

  return { budgetId, lineCount: items.length };
}

export function createBudgetLine(
  yearMonth: string,
  data: {
    description: string;
    amount: number;
    financeType: string;
    section: BudgetSection;
    sortOrder?: number;
  },
): number {
  const budget = getMonthlyBudgetByYearMonth(yearMonth);
  if (!budget) {
    throw new Error("Monthly budget not found");
  }

  const maxOrder = getDb()
    .prepare(
      "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM monthly_budget_lines WHERE monthly_budget_id = ? AND section = ?",
    )
    .get(budget.id, data.section) as { max_order: number };

  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO monthly_budget_lines
        (monthly_budget_id, recurring_item_id, description, amount, finance_type, section,
         sort_order, status, created_at, updated_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, 'planned', ?, ?)`,
    )
    .run(
      budget.id,
      data.description,
      data.amount,
      data.financeType,
      data.section,
      data.sortOrder ?? maxOrder.max_order + 1,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function updateBudgetLine(
  id: number,
  data: {
    description?: string;
    amount?: number;
    financeType?: string;
    section?: BudgetSection;
    sortOrder?: number;
    status?: BudgetLineStatus;
  },
): void {
  const existing = getBudgetLine(id);
  if (!existing) throw new Error("Budget line not found");

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE monthly_budget_lines SET
        description = ?, amount = ?, finance_type = ?, section = ?, sort_order = ?,
        status = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      data.description ?? existing.description,
      data.amount ?? existing.amount,
      data.financeType ?? existing.finance_type,
      data.section ?? existing.section,
      data.sortOrder ?? existing.sort_order,
      data.status ?? existing.status,
      now,
      id,
    );
}

export function deleteBudgetLine(id: number): void {
  const line = getBudgetLine(id);
  if (!line) return;
  if (line.transaction_id) {
    throw new Error("Cannot delete a line that has been posted to the ledger");
  }
  getDb().prepare("DELETE FROM monthly_budget_lines WHERE id = ?").run(id);
}

export function postLineToLedger(
  lineId: number,
  data: { date: string; amount?: number },
): number {
  const line = getBudgetLine(lineId);
  if (!line) throw new Error("Budget line not found");
  if (line.transaction_id) throw new Error("Line already posted to ledger");
  if (line.status === "skipped") {
    throw new Error("Cannot post a skipped line");
  }

  const amount = data.amount ?? line.amount;
  const transactionId = createTransaction({
    date: data.date,
    amount,
    description: line.description,
    financeType: line.finance_type,
  });

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE monthly_budget_lines SET
        status = 'paid', transaction_id = ?, paid_at = ?, amount = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(transactionId, now, amount, now, lineId);

  return transactionId;
}

export function getMonthDetail(yearMonth: string) {
  const budget = getMonthlyBudgetByYearMonth(yearMonth);
  if (!budget) return null;

  const lines = listBudgetLines(budget.id);
  const totals = computeBudgetTotals(lines);

  return {
    budget,
    lines,
    totals,
    sectionOrder: SECTION_ORDER,
  };
}

export function exportBudgetData() {
  return {
    recurringItems: listRecurringItems(),
    monthlyBudgets: listMonthlyBudgets().map((b) => ({
      ...b,
      lines: listBudgetLines(b.id),
    })),
  };
}
