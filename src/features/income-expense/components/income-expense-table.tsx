import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditTransactionDialog } from "@/features/income-expense/components/edit-transaction-dialog";
import { TransactionFilterSortMenu } from "@/features/income-expense/components/transaction-filter-sort-menu";
import { useDeleteTransaction } from "@/features/income-expense/hooks/use-delete-transaction";
import { useIncomeExpenses } from "@/features/income-expense/hooks/use-income-expenses";
import type { Transaction } from "@/features/income-expense/types/transaction";
import {
  formatLoanPaymentLabel,
  formatTransactionCategory,
} from "@/features/income-expense/lib/transaction-display-utils";
import {
  applyTransactionQuery,
  DEFAULT_TRANSACTION_FILTERS,
  DEFAULT_TRANSACTION_SORT,
  type TransactionFilters,
  type TransactionSort,
} from "@/features/income-expense/lib/transaction-table-query";
import { useLoans } from "@/features/loans/hooks/use-loans";
import { DateText } from "@/shared/components/date-text";
import { Numeric } from "@/shared/components/numeric";
import { LEDGER_TABLE_COMPACT } from "@/shared/lib/compact-table";
import { cn } from "@/shared/lib/utils";

export function IncomeExpenseTable() {
  const { data = [], isLoading, isError, refetch } = useIncomeExpenses();
  const { data: loans = [] } = useLoans();
  const deleteMutation = useDeleteTransaction();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [sort, setSort] = useState<TransactionSort>(DEFAULT_TRANSACTION_SORT);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const filtered = useMemo(
    () => applyTransactionQuery(data, filters, sort),
    [data, filters, sort],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-expense/30 p-8 text-center">
        <p className="text-expense">Failed to load transactions.</p>
        <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <TransactionFilterSortMenu
          filters={filters}
          sort={sort}
          onFiltersChange={setFilters}
          onSortChange={setSort}
        />
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-primary/20 py-12 text-center text-muted-foreground">
            No transactions match your filters.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((row) => (
              <li
                key={row.rowIndex}
                className="rounded-lg border border-primary/20 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <DateText value={row.date} className="text-sm text-muted-foreground" />
                    <p className="font-medium leading-snug">{row.description}</p>
                  </div>
                  <Numeric
                    value={row.amount}
                    className={cn(
                      "shrink-0 text-lg font-semibold",
                      row.financeType === "Income" ? "text-income" : "text-expense",
                    )}
                  />
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground/80">Category:</span>{" "}
                    {formatTransactionCategory(row.category, row.ledgerContext)}
                  </p>
                  {row.loanPaymentId != null ? (
                    <p>
                      <span className="font-medium text-foreground/80">Loan:</span>{" "}
                      {formatLoanPaymentLabel(loans, row.loanPaymentId)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant={row.financeType === "Income" ? "income" : "expense"}
                    className="px-2 py-0 text-[10px]"
                  >
                    {row.financeType}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit transaction"
                      onClick={() => setEditing(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete transaction"
                      onClick={() => setDeleting(row)}
                    >
                      <Trash2 className="h-4 w-4 text-expense" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-primary/20 lg:block">
        <Table className={LEDGER_TABLE_COMPACT}>
          <TableHeader>
            <TableRow className="border-primary/20 bg-secondary hover:bg-secondary">
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Loan</TableHead>
              <TableHead className="w-[88px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No transactions match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.rowIndex}>
                  <TableCell>
                    <DateText value={row.date} />
                  </TableCell>
                  <TableCell>
                    <Numeric
                      value={row.amount}
                      className={cn(
                        row.financeType === "Income" ? "text-income" : "text-expense",
                      )}
                    />
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={row.financeType === "Income" ? "income" : "expense"}
                      className="px-2 py-0 text-[10px]"
                    >
                      {row.financeType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTransactionCategory(row.category, row.ledgerContext)}
                  </TableCell>
                  <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                    {formatLoanPaymentLabel(loans, row.loanPaymentId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Edit transaction"
                        onClick={() => setEditing(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Delete transaction"
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-expense" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditTransactionDialog
        open={editing != null}
        onOpenChange={(open) => !open && setEditing(null)}
        transaction={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the row from your Google Sheet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-expense"
              onClick={() => {
                if (deleting) deleteMutation.mutate(deleting.rowIndex);
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

