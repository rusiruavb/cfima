import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";
import { getAttachmentPath, saveAttachment } from "./db/attachments.js";
import { getDb } from "./db/index.js";
import {
  createLoan,
  deleteLoan,
  exportAllData,
  getLoan,
  getPayment,
  linkPaymentToBudgetLine,
  listLoans,
  listPayments,
  unlinkPaymentBudgetLine,
  updateLoan,
  updatePaymentAttachment,
  updatePaymentStatus,
} from "./db/loans.js";
import {
  createBudgetLine,
  createLedgerEntry,
  createRecurringItem,
  deleteBudgetLine,
  deleteLedgerEntry,
  deleteRecurringItem,
  duplicateMonthFromTemplate,
  getAnnualBudgetTotals,
  getBudgetLine,
  getMonthDetail,
  getRecurringItem,
  listMonthlyBudgets,
  listRecurringItems,
  postLineToLedger,
  removeLineFromLedger,
  updateBudgetLine,
  updateLedgerEntry,
  updatePostedLineInLedger,
  updateRecurringItem,
} from "./db/budget.js";
import {
  getLedgerEntry,
  listLedgerEntries,
} from "./db/budget.js";

function mapRecurringItem(r: ReturnType<typeof listRecurringItems>[number]) {
  return {
    id: r.id,
    description: r.description,
    amount: r.amount,
    financeType: r.finance_type,
    section: r.section,
    itemType: r.item_type,
    savingsBucket: r.savings_bucket,
    featureCategory: r.feature_category,
    fixedDepositDay: r.fixed_deposit_day,
    fixedDepositMaturityMonths: r.fixed_deposit_maturity_months,
    fixedDepositInterestRate: r.fixed_deposit_interest_rate,
    sortOrder: r.sort_order,
    isActive: Boolean(r.is_active),
    amountSource: r.amount_source,
    frequency: r.frequency,
  };
}

function mapBudgetLine(
  l: NonNullable<ReturnType<typeof getMonthDetail>>["lines"][number],
) {
  return {
    id: l.id,
    recurringItemId: l.recurring_item_id,
    description: l.description,
    amount: l.amount,
    financeType: l.finance_type,
    section: l.section,
    itemType: l.item_type,
    savingsBucket: l.savings_bucket,
    featureCategory: l.feature_category,
    plannedDate: l.planned_date,
    fixedDepositDate: l.fixed_deposit_date,
    fixedDepositMaturityMonths: l.fixed_deposit_maturity_months,
    fixedDepositInterestRate: l.fixed_deposit_interest_rate,
    sortOrder: l.sort_order,
    status: l.status,
    entryDate: l.entry_date,
    paidAt: l.paid_at,
  };
}

function fileUrl(path: string | null): string {
  if (!path) return "";
  return `/api/files/${encodeURIComponent(path)}`;
}

export function createApp() {
  // Ensure DB + schema initialization happens after env is set by caller.
  getDb();

  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  const isProduction = process.env.NODE_ENV === "production";
  const clientUrl =
    process.env.CLIENT_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "http://localhost:5173";

  app.use(
    cors({
      origin: isProduction ? true : clientUrl,
    }),
  );
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  function mapLedgerContext(lineId: number) {
    const line = getBudgetLine(lineId);
    if (!line || line.status !== "paid") return null;
    return {
      budgetLineId: line.id,
      section: line.section,
      itemType: line.item_type,
      featureCategory: line.feature_category,
      savingsBucket: line.savings_bucket,
      fixedDepositDate: line.fixed_deposit_date,
      fixedDepositMaturityMonths: line.fixed_deposit_maturity_months,
      fixedDepositInterestRate: line.fixed_deposit_interest_rate,
    };
  }

  // Transactions
  app.get("/api/transactions", (_req, res) => {
    try {
      const rows = listLedgerEntries();
      res.json(
        rows.map((r) => ({
          rowIndex: r.id,
          date: r.date,
          amount: r.amount,
          description: r.description,
          financeType: r.finance_type,
          category: r.category ?? "",
          loanPaymentId: r.loan_payment_id ?? null,
          driveLink: fileUrl(r.attachment_path),
          fileName: r.attachment_name ?? "",
          ledgerContext: mapLedgerContext(r.id),
        })),
      );
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/transactions", upload.single("file"), (req, res) => {
    try {
      const {
        date,
        amount,
        description,
        financeType,
        category,
        loanPaymentId,
        itemType,
        featureCategory,
        savingsBucket,
        fixedDepositDate,
        fixedDepositMaturityMonths,
        fixedDepositInterestRate,
      } = req.body as {
        date: string;
        amount: string;
        description: string;
        financeType: string;
        category?: string;
        loanPaymentId?: string;
        itemType?: string;
        featureCategory?: string;
        savingsBucket?: string;
        fixedDepositDate?: string;
        fixedDepositMaturityMonths?: string;
        fixedDepositInterestRate?: string;
      };
      let attachmentPath: string | null = null;
      let attachmentName: string | null = null;
      if (req.file) {
        const saved = saveAttachment(req.file.buffer, req.file.originalname);
        attachmentPath = saved.path;
        attachmentName = saved.name;
      }
      const parsedLoanPaymentId =
        loanPaymentId != null && String(loanPaymentId).trim()
          ? Number(loanPaymentId)
          : null;
      const id = createLedgerEntry({
        date,
        amount: Number(amount),
        description: description ?? "",
        financeType,
        category: category?.trim() ? category.trim() : null,
        loanPaymentId: parsedLoanPaymentId,
        itemType: itemType === "fixed_deposit" ? "fixed_deposit" : "regular",
        savingsBucket: savingsBucket === "one_off" ? "one_off" : "savings",
        featureCategory: featureCategory?.trim() || null,
        fixedDepositDate: fixedDepositDate || null,
        fixedDepositMaturityMonths:
          fixedDepositMaturityMonths != null && String(fixedDepositMaturityMonths).trim()
            ? Number(fixedDepositMaturityMonths)
            : null,
        fixedDepositInterestRate:
          fixedDepositInterestRate != null && String(fixedDepositInterestRate).trim()
            ? Number(fixedDepositInterestRate)
            : null,
        attachmentPath,
        attachmentName,
      });
      res.json({ rowIndex: id });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/api/transactions/:id", upload.single("file"), (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        date,
        amount,
        description,
        financeType,
        keepAttachment,
        category,
        loanPaymentId,
        budgetLineId,
        itemType,
        featureCategory,
        savingsBucket,
        fixedDepositDate,
        fixedDepositMaturityMonths,
        fixedDepositInterestRate,
      } = req.body as {
        date: string;
        amount: string;
        description: string;
        financeType: string;
        keepAttachment?: string;
        category?: string;
        loanPaymentId?: string;
        budgetLineId?: string;
        itemType?: string;
        featureCategory?: string;
        savingsBucket?: string;
        fixedDepositDate?: string;
        fixedDepositMaturityMonths?: string;
        fixedDepositInterestRate?: string;
      };
      const existing = getLedgerEntry(id);
      if (!existing) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }
      let attachmentPath =
        keepAttachment === "true" ? existing.attachment_path : null;
      let attachmentName =
        keepAttachment === "true" ? existing.attachment_name : null;
      if (req.file) {
        const saved = saveAttachment(req.file.buffer, req.file.originalname);
        attachmentPath = saved.path;
        attachmentName = saved.name;
      }

      const nextLoanPaymentId =
        loanPaymentId != null && String(loanPaymentId).trim()
          ? Number(loanPaymentId)
          : null;

      if (existing.loan_payment_id != null && existing.loan_payment_id !== nextLoanPaymentId) {
        unlinkPaymentBudgetLine(existing.loan_payment_id, id);
      }

      const nextCategory = category?.trim() ? category.trim() : null;
      updateLedgerEntry(id, {
        date,
        amount: Number(amount),
        description: description ?? "",
        financeType,
        category: nextCategory,
        loanPaymentId: nextLoanPaymentId,
        itemType:
          itemType === "fixed_deposit" || itemType === "regular" ? itemType : "regular",
        savingsBucket:
          savingsBucket === "savings" || savingsBucket === "one_off" ? savingsBucket : "savings",
        featureCategory: nextCategory === "Loans" ? "Loans" : (featureCategory?.trim() || null),
        fixedDepositDate: fixedDepositDate !== undefined ? fixedDepositDate || null : null,
        fixedDepositMaturityMonths:
          fixedDepositMaturityMonths != null && String(fixedDepositMaturityMonths).trim()
            ? Number(fixedDepositMaturityMonths)
            : null,
        fixedDepositInterestRate:
          fixedDepositInterestRate != null && String(fixedDepositInterestRate).trim()
            ? Number(fixedDepositInterestRate)
            : null,
        attachmentPath,
        attachmentName,
      });

      if (nextLoanPaymentId != null) {
        linkPaymentToBudgetLine(nextLoanPaymentId, id);
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      deleteLedgerEntry(id);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Budget templates
  app.get("/api/budget/templates", (_req, res) => {
    try {
      res.json(listRecurringItems().map(mapRecurringItem));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/budget/templates", (req, res) => {
    try {
      const {
        description,
        amount,
        financeType,
        section,
        sortOrder,
        amountSource,
        frequency,
        itemType,
        savingsBucket,
        featureCategory,
        fixedDepositDay,
        fixedDepositMaturityMonths,
        fixedDepositInterestRate,
      } =
        req.body as {
          description: string;
          amount?: number;
          financeType: string;
          section: string;
          sortOrder?: number;
          amountSource?: string;
          frequency?: string;
          itemType?: string;
          savingsBucket?: string;
          featureCategory?: string | null;
          fixedDepositDay?: number;
          fixedDepositMaturityMonths?: number;
          fixedDepositInterestRate?: number;
        };
      const id = createRecurringItem({
        description,
        amount:
          amount != null && !Number.isNaN(Number(amount))
            ? Number(amount)
            : undefined,
        financeType,
        section: section as "income" | "fixed" | "variable" | "savings",
        itemType: itemType === "fixed_deposit" ? "fixed_deposit" : "regular",
        savingsBucket: savingsBucket === "one_off" ? "one_off" : "savings",
        featureCategory: featureCategory ?? null,
        fixedDepositDay:
          fixedDepositDay != null && Number.isFinite(Number(fixedDepositDay))
            ? Number(fixedDepositDay)
            : undefined,
        fixedDepositMaturityMonths:
          fixedDepositMaturityMonths != null &&
          Number.isFinite(Number(fixedDepositMaturityMonths))
            ? Number(fixedDepositMaturityMonths)
            : undefined,
        fixedDepositInterestRate:
          fixedDepositInterestRate != null &&
          Number.isFinite(Number(fixedDepositInterestRate))
            ? Number(fixedDepositInterestRate)
            : undefined,
        sortOrder,
        amountSource: amountSource as "template" | "previous_month" | undefined,
        frequency: frequency as "monthly" | "manual_only" | undefined,
      });
      const item = getRecurringItem(id);
      res.status(201).json(mapRecurringItem(item!));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/api/budget/templates/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = getRecurringItem(id);
      if (!existing) {
        res.status(404).json({ error: "Template item not found" });
        return;
      }
      const {
        description,
        amount,
        financeType,
        section,
        sortOrder,
        isActive,
        amountSource,
        frequency,
        itemType,
        savingsBucket,
        featureCategory,
        fixedDepositDay,
        fixedDepositMaturityMonths,
        fixedDepositInterestRate,
      } =
        req.body as {
          description: string;
          amount?: number;
          financeType: string;
          section: string;
          sortOrder: number;
          isActive: boolean;
          amountSource: string;
          frequency: string;
          itemType?: string;
          savingsBucket?: string;
          featureCategory?: string | null;
          fixedDepositDay?: number;
          fixedDepositMaturityMonths?: number;
          fixedDepositInterestRate?: number;
        };
      updateRecurringItem(id, {
        description,
        amount:
          amount != null && !Number.isNaN(Number(amount))
            ? Number(amount)
            : undefined,
        financeType,
        section: section as "income" | "fixed" | "variable" | "savings",
        itemType: itemType === "fixed_deposit" ? "fixed_deposit" : "regular",
        savingsBucket: savingsBucket === "one_off" ? "one_off" : "savings",
        featureCategory: featureCategory ?? null,
        fixedDepositDay:
          fixedDepositDay != null && Number.isFinite(Number(fixedDepositDay))
            ? Number(fixedDepositDay)
            : undefined,
        fixedDepositMaturityMonths:
          fixedDepositMaturityMonths != null &&
          Number.isFinite(Number(fixedDepositMaturityMonths))
            ? Number(fixedDepositMaturityMonths)
            : undefined,
        fixedDepositInterestRate:
          fixedDepositInterestRate != null &&
          Number.isFinite(Number(fixedDepositInterestRate))
            ? Number(fixedDepositInterestRate)
            : undefined,
        sortOrder: Number(sortOrder),
        isActive: Boolean(isActive),
        amountSource: amountSource as "template" | "previous_month",
        frequency: frequency as "monthly" | "manual_only",
      });
      const item = getRecurringItem(id);
      res.json(mapRecurringItem(item!));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/budget/templates/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!getRecurringItem(id)) {
        res.status(404).json({ error: "Template item not found" });
        return;
      }
      deleteRecurringItem(id);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Budget months
  app.get("/api/budget/months", (_req, res) => {
    try {
      res.json(
        listMonthlyBudgets().map((b) => ({
          id: b.id,
          yearMonth: b.year_month,
          status: b.status,
          source: b.source,
          createdAt: b.created_at,
        })),
      );
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/budget/months/:yearMonth", (req, res) => {
    try {
      const detail = getMonthDetail(req.params.yearMonth);
      if (!detail) {
        res.status(404).json({ error: "Monthly budget not found" });
        return;
      }
      res.json({
        id: detail.budget.id,
        yearMonth: detail.budget.year_month,
        status: detail.budget.status,
        source: detail.budget.source,
        createdAt: detail.budget.created_at,
        lines: detail.lines.map(mapBudgetLine),
        totals: detail.totals,
        sectionOrder: detail.sectionOrder,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/budget/months/:yearMonth/from-template", (req, res) => {
    try {
      const yearMonth = req.params.yearMonth;
      if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        res.status(400).json({ error: "Invalid yearMonth format (use yyyy-MM)" });
        return;
      }
      const { amountMode } = (req.body ?? {}) as { amountMode?: string };
      const mode = amountMode === "previous_month" ? "previous_month" : "template";
      const result = duplicateMonthFromTemplate(yearMonth, mode);
      const detail = getMonthDetail(yearMonth);
      res.status(201).json({
        budgetId: result.budgetId,
        lineCount: result.lineCount,
        month: {
          id: detail!.budget.id,
          yearMonth: detail!.budget.year_month,
          status: detail!.budget.status,
          source: detail!.budget.source,
          createdAt: detail!.budget.created_at,
          lines: detail!.lines.map(mapBudgetLine),
          totals: detail!.totals,
          sectionOrder: detail!.sectionOrder,
        },
      });
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "BUDGET_EXISTS") {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/budget/months/:yearMonth/lines", (req, res) => {
    try {
      const {
        description,
        amount,
        financeType,
        section,
        sortOrder,
        itemType,
        savingsBucket,
        featureCategory,
        plannedDate,
        fixedDepositDate,
        fixedDepositMaturityMonths,
        fixedDepositInterestRate,
      } = req.body as {
        description: string;
        amount: number;
        financeType: string;
        section: string;
        sortOrder?: number;
        itemType?: string;
        savingsBucket?: string;
        featureCategory?: string | null;
        plannedDate?: string | null;
        fixedDepositDate?: string;
        fixedDepositMaturityMonths?: number;
        fixedDepositInterestRate?: number;
      };
      const id = createBudgetLine(req.params.yearMonth, {
        description,
        amount: Number(amount),
        financeType,
        section: section as "income" | "fixed" | "variable" | "savings",
        itemType: itemType === "fixed_deposit" ? "fixed_deposit" : "regular",
        savingsBucket: savingsBucket === "one_off" ? "one_off" : "savings",
        featureCategory: featureCategory ?? null,
        plannedDate: plannedDate ?? null,
        fixedDepositDate,
        fixedDepositMaturityMonths:
          fixedDepositMaturityMonths != null &&
          Number.isFinite(Number(fixedDepositMaturityMonths))
            ? Number(fixedDepositMaturityMonths)
            : undefined,
        fixedDepositInterestRate:
          fixedDepositInterestRate != null &&
          Number.isFinite(Number(fixedDepositInterestRate))
            ? Number(fixedDepositInterestRate)
            : undefined,
        sortOrder,
      });
      const detail = getMonthDetail(req.params.yearMonth);
      const line = detail!.lines.find((l) => l.id === id);
      res.status(201).json(mapBudgetLine(line!));
    } catch (error) {
      const err = error as Error;
      if (err.message === "Monthly budget not found") {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/api/budget/lines/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = getBudgetLine(id);
      if (!existing) {
        res.status(404).json({ error: "Budget line not found" });
        return;
      }
      const {
        description,
        amount,
        financeType,
        section,
        sortOrder,
        status,
        itemType,
        savingsBucket,
        featureCategory,
        fixedDepositDate,
        fixedDepositMaturityMonths,
        fixedDepositInterestRate,
      } = req.body as {
        description?: string;
        amount?: number;
        financeType?: string;
        section?: string;
        sortOrder?: number;
        status?: string;
        itemType?: string;
        savingsBucket?: string;
        featureCategory?: string | null;
        fixedDepositDate?: string | null;
        fixedDepositMaturityMonths?: number | null;
        fixedDepositInterestRate?: number | null;
      };
      updateBudgetLine(id, {
        description,
        amount: amount !== undefined ? Number(amount) : undefined,
        financeType,
        section: section as
          | "income"
          | "fixed"
          | "variable"
          | "savings"
          | undefined,
        itemType: itemType === "fixed_deposit" ? "fixed_deposit" : undefined,
        savingsBucket: savingsBucket === "one_off" ? "one_off" : undefined,
        featureCategory: featureCategory ?? undefined,
        fixedDepositDate,
        fixedDepositMaturityMonths:
          fixedDepositMaturityMonths !== undefined && fixedDepositMaturityMonths !== null
            ? Number(fixedDepositMaturityMonths)
            : fixedDepositMaturityMonths,
        fixedDepositInterestRate:
          fixedDepositInterestRate !== undefined && fixedDepositInterestRate !== null
            ? Number(fixedDepositInterestRate)
            : fixedDepositInterestRate,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        status: status as "planned" | "paid" | "skipped" | undefined,
      });
      const updated = getBudgetLine(id);
      res.json(mapBudgetLine(updated!));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/budget/lines/:id", (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!getBudgetLine(id)) {
        res.status(404).json({ error: "Budget line not found" });
        return;
      }
      deleteBudgetLine(id);
      res.json({ ok: true });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("posted to the ledger")) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/budget/lines/:id/post-to-ledger", (req, res) => {
    try {
      const id = Number(req.params.id);
      const { date, amount } = (req.body ?? {}) as {
        date?: string;
        amount?: number;
      };
      const postDate = date ?? new Date().toISOString().slice(0, 10);
      const transactionId = postLineToLedger(id, {
        date: postDate,
        amount: amount !== undefined ? Number(amount) : undefined,
      });
      const line = getBudgetLine(id);
      res.json({
        transactionId,
        line: mapBudgetLine(line!),
      });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message.includes("already posted") || err.message.includes("skipped")) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/api/budget/lines/:id/ledger", (req, res) => {
    try {
      const id = Number(req.params.id);
      const { date, amount, description } = (req.body ?? {}) as {
        date?: string;
        amount?: number;
        description?: string;
      };
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: "Invalid date format (use yyyy-MM-dd)" });
        return;
      }
      if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }
      updatePostedLineInLedger(id, {
        date,
        amount: Number(amount),
        description,
      });
      const line = getBudgetLine(id);
      res.json({ line: mapBudgetLine(line!) });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/budget/lines/:id/ledger", (req, res) => {
    try {
      const id = Number(req.params.id);
      removeLineFromLedger(id);
      res.json({ ok: true });
    } catch (error) {
      const err = error as Error;
      if (err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  });

  // Annual budget totals (aggregated across existing months)
  app.get("/api/budget/years/:year/totals", (req, res) => {
    try {
      const year = req.params.year;
      if (!/^\d{4}$/.test(year)) {
        res.status(400).json({ error: "Invalid year format (use yyyy)" });
        return;
      }
      res.json(getAnnualBudgetTotals(year));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Loans
  function mapLoan(loanId: string) {
    const loan = getLoan(loanId);
    if (!loan) return null;
    const payments = listPayments(loanId);
    const paidCount = payments.filter((p) => p.status === "paid").length;
    return {
      id: loan.id,
      name: loan.name,
      type: loan.type,
      months: loan.months,
      monthlyPayment: loan.monthly_payment,
      paidCount,
      status: paidCount === loan.months && loan.months > 0 ? "complete" : "active",
      payments: payments.map((p) => ({
        rowIndex: p.id,
        month: p.month_label,
        paymentAmount: p.payment_amount,
        principalAmount: p.principal_amount,
        interestAmount: p.interest_amount,
        remainingBalance: p.remaining_balance,
        attachedFile: p.attachment_name ?? "",
        fileName: p.attachment_name ?? "",
        fileLink: fileUrl(p.attachment_path),
        status: p.status,
      })),
    };
  }

  app.get("/api/loans", (_req, res) => {
    try {
      const loans = listLoans()
        .map((l) => mapLoan(l.id))
        .filter(Boolean);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/loans/:id", (req, res) => {
    try {
      const loan = mapLoan(req.params.id);
      if (!loan) {
        res.status(404).json({ error: "Loan not found" });
        return;
      }
      res.json(loan);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/loans", (req, res) => {
    try {
      const { name, type, months, monthlyPayment } = req.body as {
        name: string;
        type: string;
        months: number;
        monthlyPayment: number;
      };
      const id = createLoan({ name, type, months, monthlyPayment });
      res.json({ id, name });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/api/loans/:id", (req, res) => {
    try {
      const { name, type, months, monthlyPayment } = req.body as {
        name: string;
        type: string;
        months: number;
        monthlyPayment: number;
      };
      const id = updateLoan(req.params.id, {
        name,
        type,
        months,
        monthlyPayment,
      });
      res.json({ id, name });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/api/loans/:id", (req, res) => {
    try {
      deleteLoan(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/api/loans/:loanId/payments/:paymentId/status", (req, res) => {
    try {
      const payment = getPayment(Number(req.params.paymentId));
      if (!payment || payment.loan_id !== req.params.loanId) {
        res.status(404).json({ error: "Payment not found" });
        return;
      }
      const newStatus = payment.status === "paid" ? "pending" : "paid";
      updatePaymentStatus(payment.id, newStatus);
      res.json({ status: newStatus });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post(
    "/api/loans/:loanId/payments/:paymentId/file",
    upload.single("file"),
    (req, res) => {
      try {
        if (!req.file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }
        const payment = getPayment(Number(req.params.paymentId));
        if (!payment || payment.loan_id !== req.params.loanId) {
          res.status(404).json({ error: "Payment not found" });
          return;
        }
        const saved = saveAttachment(req.file.buffer, req.file.originalname);
        updatePaymentAttachment(payment.id, saved.path, saved.name);
        res.json({ name: saved.name, link: fileUrl(saved.path) });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  // Files
  app.get("/api/files/:filename", (req, res) => {
    try {
      const filename = decodeURIComponent(req.params.filename);
      if (filename.includes("..") || filename.includes("/")) {
        res.status(400).json({ error: "Invalid file" });
        return;
      }
      res.sendFile(getAttachmentPath(filename));
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Export
  app.get("/api/export", (_req, res) => {
    try {
      const data = exportAllData();
      const filename = `monthly-export-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Production: serve Vite build (Electron sets APP_ROOT to app.asar path in packaged builds).
  const distPath = resolve(process.env.APP_ROOT ?? process.cwd(), "dist");
  if (isProduction && existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }

  return app;
}

