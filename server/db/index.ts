import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSchemaSql(): string {
  const candidates = [
    resolve(__dirname, "schema.sql"),
    // Legacy desktop builds copied schema here (cpy --parents).
    resolve(__dirname, "server/db/schema.sql"),
  ];
  for (const filePath of candidates) {
    try {
      return readFileSync(filePath, "utf8");
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
    }
  }
  throw new Error(`schema.sql not found (tried: ${candidates.join(", ")})`);
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH ?? "./data/cfima.db");
  mkdirSync(dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(readSchemaSql());

  // Add columns before indexes/migrations that depend on them (existing DBs skip CREATE TABLE).
  ensureBudgetColumns(db);
  ensureTransactionAndLoanColumns(db);
  migrateUnifiedLedger(db);
  ensureIndexes(db);

  return db;
}

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

function hasTable(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table) as { name: string } | undefined;
  return Boolean(row);
}

function addColumn(
  db: Database.Database,
  table: string,
  column: string,
  sqlTypeAndConstraints: string,
) {
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlTypeAndConstraints}`);
}

function ensureBudgetColumns(db: Database.Database) {
  if (!hasColumn(db, "recurring_budget_items", "item_type")) {
    addColumn(
      db,
      "recurring_budget_items",
      "item_type",
      "TEXT NOT NULL DEFAULT 'regular' CHECK (item_type IN ('regular', 'fixed_deposit'))",
    );
  }
  if (!hasColumn(db, "recurring_budget_items", "fixed_deposit_day")) {
    addColumn(db, "recurring_budget_items", "fixed_deposit_day", "INTEGER");
  }
  if (!hasColumn(db, "recurring_budget_items", "fixed_deposit_maturity_months")) {
    addColumn(db, "recurring_budget_items", "fixed_deposit_maturity_months", "INTEGER");
  }
  if (!hasColumn(db, "recurring_budget_items", "fixed_deposit_interest_rate")) {
    addColumn(db, "recurring_budget_items", "fixed_deposit_interest_rate", "REAL");
  }
  if (!hasColumn(db, "recurring_budget_items", "savings_bucket")) {
    addColumn(
      db,
      "recurring_budget_items",
      "savings_bucket",
      "TEXT NOT NULL DEFAULT 'savings' CHECK (savings_bucket IN ('savings', 'one_off'))",
    );
  }
  if (!hasColumn(db, "recurring_budget_items", "feature_category")) {
    addColumn(db, "recurring_budget_items", "feature_category", "TEXT");
  }

  if (!hasColumn(db, "monthly_budget_lines", "item_type")) {
    addColumn(
      db,
      "monthly_budget_lines",
      "item_type",
      "TEXT NOT NULL DEFAULT 'regular' CHECK (item_type IN ('regular', 'fixed_deposit'))",
    );
  }
  if (!hasColumn(db, "monthly_budget_lines", "fixed_deposit_date")) {
    addColumn(db, "monthly_budget_lines", "fixed_deposit_date", "TEXT");
  }
  if (!hasColumn(db, "monthly_budget_lines", "fixed_deposit_maturity_months")) {
    addColumn(db, "monthly_budget_lines", "fixed_deposit_maturity_months", "INTEGER");
  }
  if (!hasColumn(db, "monthly_budget_lines", "fixed_deposit_interest_rate")) {
    addColumn(db, "monthly_budget_lines", "fixed_deposit_interest_rate", "REAL");
  }
  if (!hasColumn(db, "monthly_budget_lines", "savings_bucket")) {
    addColumn(
      db,
      "monthly_budget_lines",
      "savings_bucket",
      "TEXT NOT NULL DEFAULT 'savings' CHECK (savings_bucket IN ('savings', 'one_off'))",
    );
  }
  if (!hasColumn(db, "monthly_budget_lines", "feature_category")) {
    addColumn(db, "monthly_budget_lines", "feature_category", "TEXT");
  }
  if (!hasColumn(db, "monthly_budget_lines", "planned_date")) {
    addColumn(db, "monthly_budget_lines", "planned_date", "TEXT");
  }
  if (!hasColumn(db, "monthly_budget_lines", "loan_payment_id")) {
    addColumn(db, "monthly_budget_lines", "loan_payment_id", "INTEGER");
  }
  if (!hasColumn(db, "monthly_budget_lines", "entry_date")) {
    addColumn(db, "monthly_budget_lines", "entry_date", "TEXT");
  }
  if (!hasColumn(db, "monthly_budget_lines", "attachment_path")) {
    addColumn(db, "monthly_budget_lines", "attachment_path", "TEXT");
  }
  if (!hasColumn(db, "monthly_budget_lines", "attachment_name")) {
    addColumn(db, "monthly_budget_lines", "attachment_name", "TEXT");
  }
}

function ensureTransactionAndLoanColumns(db: Database.Database) {
  if (hasTable(db, "transactions") && !hasColumn(db, "transactions", "category")) {
    addColumn(db, "transactions", "category", "TEXT");
  }
  if (hasTable(db, "transactions") && !hasColumn(db, "transactions", "loan_payment_id")) {
    addColumn(db, "transactions", "loan_payment_id", "INTEGER");
  }

  if (!hasColumn(db, "loan_payments", "transaction_id")) {
    addColumn(db, "loan_payments", "transaction_id", "INTEGER");
  }
  if (!hasColumn(db, "loan_payments", "budget_line_id")) {
    addColumn(db, "loan_payments", "budget_line_id", "INTEGER");
  }
}

/** One-time migration: merge legacy `transactions` rows into `monthly_budget_lines`. */
function migrateUnifiedLedger(db: Database.Database) {
  const migrated = db
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '_schema_migrations'",
    )
    .get();
  if (!migrated) {
    db.exec(
      "CREATE TABLE IF NOT EXISTS _schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
    );
  }

  const done = db
    .prepare("SELECT 1 FROM _schema_migrations WHERE name = 'unified_ledger_v1'")
    .get();
  if (done) return;

  if (!hasTable(db, "transactions")) {
    db.prepare(
      "INSERT INTO _schema_migrations (name, applied_at) VALUES ('unified_ledger_v1', ?)",
    ).run(new Date().toISOString());
    return;
  }

  const now = new Date().toISOString();

  // Copy ledger fields from transactions onto linked budget lines.
  if (hasColumn(db, "monthly_budget_lines", "transaction_id")) {
    db.exec(`
      UPDATE monthly_budget_lines
      SET
        entry_date = COALESCE(entry_date, (SELECT date FROM transactions t WHERE t.id = monthly_budget_lines.transaction_id)),
        attachment_path = COALESCE(attachment_path, (SELECT attachment_path FROM transactions t WHERE t.id = monthly_budget_lines.transaction_id)),
        attachment_name = COALESCE(attachment_name, (SELECT attachment_name FROM transactions t WHERE t.id = monthly_budget_lines.transaction_id)),
        loan_payment_id = COALESCE(loan_payment_id, (SELECT loan_payment_id FROM transactions t WHERE t.id = monthly_budget_lines.transaction_id)),
        status = CASE WHEN transaction_id IS NOT NULL THEN 'paid' ELSE status END,
        paid_at = COALESCE(paid_at, CASE WHEN transaction_id IS NOT NULL THEN '${now}' ELSE paid_at END)
      WHERE transaction_id IS NOT NULL
    `);
  }

  // Orphan transactions (no budget line): create paid lines in their month.
  const orphans = db
    .prepare(
      `SELECT t.id, t.date, t.amount, t.description, t.finance_type, t.category, t.loan_payment_id,
              t.attachment_path, t.attachment_name
       FROM transactions t
       WHERE NOT EXISTS (
         SELECT 1 FROM monthly_budget_lines l WHERE l.transaction_id = t.id
       )`,
    )
    .all() as Array<{
    id: number;
    date: string;
    amount: number;
    description: string;
    finance_type: string;
    category: string | null;
    loan_payment_id: number | null;
    attachment_path: string | null;
    attachment_name: string | null;
  }>;

  const findBudget = db.prepare(
    "SELECT id FROM monthly_budgets WHERE year_month = ?",
  );
  const maxOrderStmt = db.prepare(
    "SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM monthly_budget_lines WHERE monthly_budget_id = ? AND section = ?",
  );
  const insertLine = db.prepare(
    `INSERT INTO monthly_budget_lines
      (monthly_budget_id, recurring_item_id, description, amount, finance_type, section,
       item_type, savings_bucket, feature_category, loan_payment_id,
       planned_date, entry_date,
       fixed_deposit_date, fixed_deposit_maturity_months, fixed_deposit_interest_rate,
       attachment_path, attachment_name,
       sort_order, status, transaction_id, paid_at, created_at, updated_at)
     VALUES (?, NULL, ?, ?, ?, ?, 'regular', 'savings', ?, ?, NULL, ?, NULL, NULL, NULL, ?, ?, ?, 'paid', ?, ?, ?, ?)`,
  );

  for (const tx of orphans) {
    const yearMonth = tx.date.slice(0, 7);
    const budget = findBudget.get(yearMonth) as { id: number } | undefined;
    if (!budget) continue;

    const isLoan = tx.loan_payment_id != null || tx.category === "Loans";
    let section = "variable";
    if (isLoan) section = "fixed";
    else if (tx.category === "Income") section = "income";
    else if (tx.category === "Fixed expenses") section = "fixed";
    else if (tx.category === "Variable expenses") section = "variable";
    else if (tx.category === "Savings & one-off") section = "savings";

    const featureCategory = isLoan ? "Loans" : null;
    const maxOrder = maxOrderStmt.get(budget.id, section) as { max_order: number };
    insertLine.run(
      budget.id,
      tx.description,
      tx.amount,
      tx.finance_type,
      section,
      featureCategory,
      tx.loan_payment_id,
      tx.date,
      tx.attachment_path,
      tx.attachment_name,
      maxOrder.max_order + 1,
      tx.id,
      now,
      now,
      now,
    );
  }

  // Point loan payments at budget lines (prefer line linked to legacy transaction id).
  if (hasColumn(db, "loan_payments", "transaction_id")) {
    db.exec(`
      UPDATE loan_payments
      SET budget_line_id = (
        SELECT l.id FROM monthly_budget_lines l
        WHERE l.transaction_id = loan_payments.transaction_id
        LIMIT 1
      )
      WHERE transaction_id IS NOT NULL AND budget_line_id IS NULL
    `);
  }

  db.exec("DROP TABLE IF EXISTS transactions");

  db.prepare(
    "INSERT INTO _schema_migrations (name, applied_at) VALUES ('unified_ledger_v1', ?)",
  ).run(now);
}

function ensureIndexes(db: Database.Database) {
  if (hasColumn(db, "monthly_budget_lines", "entry_date")) {
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_monthly_budget_lines_entry_date ON monthly_budget_lines(entry_date)",
    );
  }
  if (hasColumn(db, "loan_payments", "budget_line_id")) {
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_loan_payments_budget_line_id ON loan_payments(budget_line_id)",
    );
  }
}
