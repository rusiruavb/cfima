CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  finance_type TEXT NOT NULL CHECK (finance_type IN ('Income', 'Expense')),
  attachment_path TEXT,
  attachment_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('finance', 'bank', 'family')),
  months INTEGER NOT NULL,
  monthly_payment REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loan_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id TEXT NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  month_label TEXT NOT NULL,
  payment_amount REAL NOT NULL,
  principal_amount REAL NOT NULL,
  interest_amount REAL NOT NULL,
  remaining_balance REAL NOT NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  UNIQUE(loan_id, sort_order)
);

CREATE TABLE IF NOT EXISTS recurring_budget_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL,
  finance_type TEXT NOT NULL CHECK (finance_type IN ('Income', 'Expense')),
  section TEXT NOT NULL CHECK (section IN ('income', 'fixed', 'variable', 'savings')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  amount_source TEXT NOT NULL DEFAULT 'template' CHECK (amount_source IN ('template', 'previous_month')),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'manual_only')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS monthly_budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_month TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  source TEXT NOT NULL DEFAULT 'from_template' CHECK (source IN ('from_template', 'from_previous_month', 'manual')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS monthly_budget_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monthly_budget_id INTEGER NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
  recurring_item_id INTEGER REFERENCES recurring_budget_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL,
  finance_type TEXT NOT NULL CHECK (finance_type IN ('Income', 'Expense')),
  section TEXT NOT NULL CHECK (section IN ('income', 'fixed', 'variable', 'savings')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'paid', 'skipped')),
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_year_month ON monthly_budgets(year_month);
CREATE INDEX IF NOT EXISTS idx_monthly_budget_lines_budget_id ON monthly_budget_lines(monthly_budget_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budget_lines_transaction_id ON monthly_budget_lines(transaction_id);
