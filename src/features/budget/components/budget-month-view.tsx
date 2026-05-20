import { Check, MoreHorizontal, Pencil, Plus, SkipForward, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddBudgetLineDialog } from "@/features/budget/components/add-budget-line-dialog";
import { AnnualBudgetTotalsBar } from "@/features/budget/components/annual-budget-totals-bar";
import { BudgetTotalsBar } from "@/features/budget/components/budget-totals-bar";
import { CreateMonthDialog } from "@/features/budget/components/create-month-dialog";
import { PostToLedgerDialog } from "@/features/budget/components/post-to-ledger-dialog";
import { EditTransactionDialog } from "@/features/income-expense/components/edit-transaction-dialog";
import { useIncomeExpenses } from "@/features/income-expense/hooks/use-income-expenses";
import type { Transaction } from "@/features/income-expense/types/transaction";
import { YearMonthTabs } from "@/features/budget/components/year-month-tabs";
import {
  useAddBudgetLine,
  useAnnualBudgetTotals,
  useBudgetMonth,
  useCreateMonthFromTemplate,
  useDeleteBudgetLine,
  usePostBudgetLineToLedger,
  useRemoveBudgetLineFromLedger,
  useUpdateBudgetLine,
} from "@/features/budget/hooks/use-budget-month";
import { compactCell, compactHead } from "@/features/budget/lib/compact-table";
import {
  LOANS_CATEGORY,
  SECTION_LABELS,
  SECTION_ORDER,
} from "@/features/budget/lib/section-labels";
import type { BudgetLineFormValues } from "@/features/budget/schemas/budget-schema";
import type { BudgetLine, BudgetLineStatus, BudgetSection } from "@/features/budget/types/budget";
import { Numeric } from "@/shared/components/numeric";
import { AmountInput } from "@/shared/components/amount-input";
import { cn } from "@/shared/lib/utils";

interface BudgetMonthViewProps {
  yearMonth: string;
  onYearMonthChange: (yearMonth: string) => void;
}

function sectionMonthTotal(lines: BudgetLine[], section: BudgetSection): number {
  return lines
    .filter((line) => line.section === section && line.status !== "skipped")
    .reduce((sum, line) => sum + line.amount, 0);
}

function statusBadgeVariant(status: BudgetLineStatus) {
  if (status === "paid") return "default";
  if (status === "skipped") return "secondary";
  return "outline";
}

function lineCategoryLabel(line: BudgetLine): string | null {
  const category = line.featureCategory?.trim();
  if (!category || category === "Loans") return null;
  return category;
}

function budgetLinePayload(values: BudgetLineFormValues) {
  const isLoan = values.section === LOANS_CATEGORY;
  return {
    description: values.description,
    amount: values.amount,
    financeType: values.financeType,
    section: isLoan ? "fixed" : values.section,
    plannedDate: values.plannedDate ?? null,
    itemType: isLoan ? "regular" : values.itemType,
    savingsBucket: values.savingsBucket,
    featureCategory: isLoan ? "Loans" : (values.featureCategory ?? null),
    loanPaymentId: isLoan ? (values.loanPaymentId ?? null) : null,
    fixedDepositDate:
      values.section === "savings" && values.itemType === "fixed_deposit"
        ? (values.fixedDepositDate ?? undefined)
        : undefined,
    fixedDepositMaturityMonths:
      values.section === "savings" && values.itemType === "fixed_deposit"
        ? (values.fixedDepositMaturityMonths ?? undefined)
        : undefined,
    fixedDepositInterestRate:
      values.section === "savings" && values.itemType === "fixed_deposit"
        ? (values.fixedDepositInterestRate ?? undefined)
        : undefined,
  };
}

export function BudgetMonthView({ yearMonth, onYearMonthChange }: BudgetMonthViewProps) {
  const { data: month, isLoading, isError, error } = useBudgetMonth(yearMonth);
  const year = yearMonth.slice(0, 4);
  const {
    data: annualTotals,
    isLoading: annualLoading,
    isError: annualIsError,
    error: annualError,
  } = useAnnualBudgetTotals(year);
  const createMonth = useCreateMonthFromTemplate();
  const [createOpen, setCreateOpen] = useState(false);
  const [addSection, setAddSection] = useState<BudgetSection>("income");
  const [addOpen, setAddOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [postLine, setPostLine] = useState<BudgetLine | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [draftAmounts, setDraftAmounts] = useState<Record<number, number | undefined>>({});
  const { data: transactions = [] } = useIncomeExpenses();

  const addLine = useAddBudgetLine(yearMonth);
  const updateLine = useUpdateBudgetLine(yearMonth);
  const deleteLine = useDeleteBudgetLine(yearMonth);
  const postToLedger = usePostBudgetLineToLedger(yearMonth);
  const removeFromLedger = useRemoveBudgetLineFromLedger(yearMonth);

  const handleEditPostedLine = (line: BudgetLine) => {
    if (line.status !== "paid") return;
    const tx = transactions.find((t) => t.rowIndex === line.id);
    if (tx) setEditTransaction(tx);
  };

  const notFound =
    isError && error instanceof Error && error.message.includes("404");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading budget…</p>;
  }

  if (notFound || !month) {
    return (
      <>
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <YearMonthTabs value={yearMonth} onChange={onYearMonthChange} />
          </div>
          <AnnualBudgetTotalsBar
            year={year}
            totals={annualTotals}
            isLoading={annualLoading}
            error={
              annualIsError
                ? annualError instanceof Error
                  ? annualError
                  : new Error(String(annualError))
                : null
            }
          />
          <Card className="border-dashed border-primary/30">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <p className="text-muted-foreground">
                No budget sheet for{" "}
                <span className="font-medium text-primary">{yearMonth}</span> yet.
              </p>
              <Button onClick={() => setCreateOpen(true)}>Create from template</Button>
            </CardContent>
          </Card>
        </div>
        <CreateMonthDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultYearMonth={yearMonth}
          isPending={createMonth.isPending}
          onConfirm={(ym, mode) => {
            createMonth.mutate(
              { yearMonth: ym, amountMode: mode },
              {
                onSuccess: (data) => {
                  setCreateOpen(false);
                  onYearMonthChange(data.yearMonth);
                },
              },
            );
          }}
        />
      </>
    );
  }

  const commitDraftAmount = (line: BudgetLine) => {
    const draft = draftAmounts[line.id];
    if (draft == null) return;
    if (!Number.isFinite(draft) || draft <= 0 || draft === line.amount) return;
    updateLine.mutate({
      id: line.id,
      data: { amount: draft },
    });
  };

  const openAdd = (section: BudgetSection) => {
    setAddSection(section);
    setAddOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <YearMonthTabs value={yearMonth} onChange={onYearMonthChange} className="w-full sm:max-w-[460px]" />
        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-primary/30"
            onClick={() => setCreateOpen(true)}
          >
            New month from template
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setAddSection("income");
              setQuickAddOpen(true);
            }}
          >
            Add income/expense
          </Button>
        </div>
      </div>

      <AnnualBudgetTotalsBar
        year={year}
        totals={annualTotals}
        isLoading={annualLoading}
        error={
          annualIsError
            ? annualError instanceof Error
              ? annualError
              : new Error(String(annualError))
            : null
        }
      />

      <BudgetTotalsBar totals={month.totals} />

      <Card className="border-primary/20">
        <CardHeader className="space-y-1 px-4 py-3 sm:px-5">
          <CardTitle className="text-base text-primary">
            {yearMonth.replace("-", " · ")}
          </CardTitle>
          <CardDescription className="text-xs leading-snug sm:text-sm">
            Edit amounts inline, then post planned lines to your ledger when paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={compactHead}>Description</TableHead>
                <TableHead className={cn(compactHead, "w-28 text-right")}>Amount</TableHead>
                <TableHead className={cn(compactHead, "w-10")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {SECTION_ORDER.map((section) => {
                const lines = month.lines.filter((line) => line.section === section);
                const sectionTotal = sectionMonthTotal(month.lines, section);

                return (
                  <MonthSectionRows
                    key={section}
                    section={section}
                    lines={lines}
                    sectionTotal={sectionTotal}
                    onAdd={() => openAdd(section)}
                    onPost={setPostLine}
                    onEditLedger={handleEditPostedLine}
                    onRemoveFromLedger={(id) => removeFromLedger.mutate(id)}
                    onUpdate={(id, data) => updateLine.mutate({ id, data })}
                    onDelete={(id) => deleteLine.mutate(id)}
                    draftAmounts={draftAmounts}
                    setDraftAmount={(lineId, next) =>
                      setDraftAmounts((prev) => ({ ...prev, [lineId]: next }))
                    }
                    onCommitDraftAmount={commitDraftAmount}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddBudgetLineDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultSection={addSection}
        isPending={addLine.isPending}
        onSubmit={(values: BudgetLineFormValues) => {
          addLine.mutate(budgetLinePayload(values), {
            onSuccess: (line) => {
              setAddOpen(false);
              if (!values.postToLedger) return;
              const date = values.plannedDate ? new Date(values.plannedDate) : new Date();
              postToLedger.mutate({ id: line.id, date, amount: line.amount });
            },
          });
        }}
      />

      <AddBudgetLineDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultSection="income"
        isPending={addLine.isPending}
        onSubmit={(values: BudgetLineFormValues) => {
          addLine.mutate(budgetLinePayload(values), {
            onSuccess: (line) => {
              setQuickAddOpen(false);
              if (!values.postToLedger) return;
              const date = values.plannedDate ? new Date(values.plannedDate) : new Date();
              postToLedger.mutate({ id: line.id, date, amount: line.amount });
            },
          });
        }}
      />

      <PostToLedgerDialog
        open={postLine !== null}
        onOpenChange={(open) => !open && setPostLine(null)}
        line={postLine}
        isPending={postToLedger.isPending}
        onSubmit={(values) => {
          if (!postLine) return;
          postToLedger.mutate(
            { id: postLine.id, date: values.date, amount: values.amount },
            { onSuccess: () => setPostLine(null) },
          );
        }}
      />

      <EditTransactionDialog
        open={editTransaction != null}
        onOpenChange={(open) => !open && setEditTransaction(null)}
        transaction={editTransaction}
      />

      <CreateMonthDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultYearMonth={yearMonth}
        isPending={createMonth.isPending}
        onConfirm={(ym, mode) => {
          createMonth.mutate(
            { yearMonth: ym, amountMode: mode },
            {
              onSuccess: (data) => {
                setCreateOpen(false);
                onYearMonthChange(data.yearMonth);
              },
            },
          );
        }}
      />
    </div>
  );
}

interface MonthSectionRowsProps {
  section: BudgetSection;
  lines: BudgetLine[];
  sectionTotal: number;
  onAdd: () => void;
  onPost: (line: BudgetLine) => void;
  onEditLedger: (line: BudgetLine) => void;
  onRemoveFromLedger: (id: number) => void;
  onUpdate: (id: number, data: { status: BudgetLineStatus }) => void;
  onDelete: (id: number) => void;
  draftAmounts: Record<number, number | undefined>;
  setDraftAmount: (lineId: number, next: number | undefined) => void;
  onCommitDraftAmount: (line: BudgetLine) => void;
}

function MonthSectionRows({
  section,
  lines,
  sectionTotal,
  onAdd,
  onPost,
  onEditLedger,
  onRemoveFromLedger,
  onUpdate,
  onDelete,
  draftAmounts,
  setDraftAmount,
  onCommitDraftAmount,
}: MonthSectionRowsProps) {
  return (
    <>
      <TableRow className="border-primary/15 bg-secondary/40 hover:bg-secondary/40">
        <TableCell colSpan={3} className={cn(compactCell, "py-2")}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{SECTION_LABELS[section]}</span>
            {lines.length > 0 && (
              <span className="text-xs text-muted-foreground">({lines.length})</span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {lines.length > 0 ? (
                <>
                  Subtotal{" "}
                  <Numeric
                    value={sectionTotal}
                    className={cn(
                      "font-medium",
                      section === "income" ? "text-income" : "text-expense",
                    )}
                  />
                </>
              ) : (
                "No lines"
              )}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 shrink-0 gap-1 px-2 text-primary"
              onClick={onAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:inline">Add</span>
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {lines.map((line) => {
        const categoryLabel = lineCategoryLabel(line);
        return (
        <TableRow
          key={line.id}
          className={cn(
            line.status === "skipped" && "opacity-50",
            line.status === "paid" && "bg-income/5",
          )}
        >
          <TableCell className={compactCell}>
            <div className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate text-sm font-medium">{line.description}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                {categoryLabel ? (
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {categoryLabel}
                  </Badge>
                ) : null}
                {line.loanPaymentId != null || line.featureCategory === "Loans" ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    Loan
                  </Badge>
                ) : line.itemType === "fixed_deposit" ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    FD
                    {line.fixedDepositMaturityMonths
                      ? ` · ${line.fixedDepositMaturityMonths} mo`
                      : ""}
                    {line.fixedDepositInterestRate != null
                      ? ` · ${line.fixedDepositInterestRate}%`
                      : ""}
                    {line.fixedDepositDate ? ` · ${line.fixedDepositDate}` : ""}
                  </Badge>
                ) : null}
                <Badge
                  variant={statusBadgeVariant(line.status)}
                  className="px-1.5 py-0 text-[10px] font-normal capitalize"
                >
                  {line.status}
                </Badge>
              </div>
            </div>
          </TableCell>
          <TableCell className={cn(compactCell, "text-right")}>
            {line.status === "paid" ? (
              <Numeric value={line.amount} className="text-sm" />
            ) : (
              <AmountInput
                value={draftAmounts[line.id] ?? line.amount}
                onChange={(v) => setDraftAmount(line.id, v)}
                disabled={line.status === "skipped"}
                className="ml-auto h-7 w-24 text-right text-sm"
                onBlur={() => onCommitDraftAmount(line)}
              />
            )}
          </TableCell>
          <TableCell className={cn(compactCell, "w-10 p-1")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  aria-label={`Actions for ${line.description}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {line.status === "paid" ? (
                  <>
                    <DropdownMenuItem onClick={() => onEditLedger(line)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-expense"
                      onClick={() => onRemoveFromLedger(line.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    {line.status === "planned" && (
                      <>
                        <DropdownMenuItem onClick={() => onPost(line)}>
                          <Check className="mr-2 h-4 w-4" />
                          Post to ledger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdate(line.id, { status: "skipped" })}>
                          <SkipForward className="mr-2 h-4 w-4" />
                          Skip
                        </DropdownMenuItem>
                      </>
                    )}
                    {line.status === "skipped" && (
                      <DropdownMenuItem onClick={() => onUpdate(line.id, { status: "planned" })}>
                        Restore to planned
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-expense" onClick={() => onDelete(line.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        );
      })}
    </>
  );
}
