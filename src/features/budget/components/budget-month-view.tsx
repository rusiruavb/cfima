import { Check, MoreHorizontal, Plus, SkipForward, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddBudgetLineDialog } from "@/features/budget/components/add-budget-line-dialog";
import { BudgetTotalsBar } from "@/features/budget/components/budget-totals-bar";
import { CreateMonthDialog } from "@/features/budget/components/create-month-dialog";
import { PostToLedgerDialog } from "@/features/budget/components/post-to-ledger-dialog";
import {
  useAddBudgetLine,
  useBudgetMonth,
  useCreateMonthFromTemplate,
  useDeleteBudgetLine,
  usePostBudgetLineToLedger,
  useUpdateBudgetLine,
} from "@/features/budget/hooks/use-budget-month";
import { SECTION_LABELS, SECTION_ORDER } from "@/features/budget/lib/section-labels";
import type { BudgetLineFormValues } from "@/features/budget/schemas/budget-schema";
import type { BudgetLine, BudgetSection } from "@/features/budget/types/budget";
import { Numeric } from "@/shared/components/numeric";
import { cn } from "@/shared/lib/utils";

interface BudgetMonthViewProps {
  yearMonth: string;
  onYearMonthChange: (yearMonth: string) => void;
}

export function BudgetMonthView({ yearMonth, onYearMonthChange }: BudgetMonthViewProps) {
  const { data: month, isLoading, isError, error } = useBudgetMonth(yearMonth);
  const createMonth = useCreateMonthFromTemplate();
  const [createOpen, setCreateOpen] = useState(false);
  const [addSection, setAddSection] = useState<BudgetSection>("income");
  const [addOpen, setAddOpen] = useState(false);
  const [postLine, setPostLine] = useState<BudgetLine | null>(null);

  const addLine = useAddBudgetLine(yearMonth);
  const updateLine = useUpdateBudgetLine(yearMonth);
  const deleteLine = useDeleteBudgetLine(yearMonth);
  const postToLedger = usePostBudgetLineToLedger(yearMonth);

  const notFound =
    isError && error instanceof Error && error.message.includes("404");

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading budget…</p>;
  }

  if (notFound || !month) {
    return (
      <>
        <Card className="border-dashed border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-muted-foreground">
              No budget sheet for{" "}
              <span className="font-medium text-primary">{yearMonth}</span> yet.
            </p>
            <Button onClick={() => setCreateOpen(true)}>Create from template</Button>
          </CardContent>
        </Card>
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

  const handleAmountBlur = (line: BudgetLine, value: string) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0 || amount === line.amount) return;
    updateLine.mutate({ id: line.id, data: { amount } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="month"
          value={yearMonth}
          onChange={(e) => onYearMonthChange(e.target.value)}
          className="w-full sm:max-w-[200px]"
        />
        <Button
          type="button"
          variant="outline"
          className="border-primary/30"
          onClick={() => setCreateOpen(true)}
        >
          New month from template
        </Button>
      </div>

      <BudgetTotalsBar totals={month.totals} />

      {SECTION_ORDER.map((section) => {
        const lines = month.lines.filter((l) => l.section === section);
        const sectionTotal = lines
          .filter((l) => l.status !== "skipped")
          .reduce((s, l) => s + l.amount, 0);

        return (
          <Card key={section} className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base text-primary">{SECTION_LABELS[section]}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={() => {
                  setAddSection(section);
                  setAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add line
              </Button>
            </CardHeader>
            <CardContent>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lines in this section.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[52px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow
                          key={line.id}
                          className={cn(
                            line.status === "skipped" && "opacity-50",
                            line.status === "paid" && "bg-income/5",
                          )}
                        >
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">
                            {line.status === "paid" ? (
                              <Numeric value={line.amount} />
                            ) : (
                              <Input
                                type="number"
                                className="ml-auto h-8 w-28 text-right font-mono-numeric"
                                defaultValue={line.amount}
                                disabled={line.status === "skipped"}
                                onBlur={(e) => handleAmountBlur(line, e.target.value)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                line.status === "paid"
                                  ? "default"
                                  : line.status === "skipped"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {line.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  aria-label="Actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {line.status === "planned" && (
                                  <>
                                    <DropdownMenuItem onClick={() => setPostLine(line)}>
                                      <Check className="mr-2 h-4 w-4" />
                                      Post to ledger
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateLine.mutate({
                                          id: line.id,
                                          data: { status: "skipped" },
                                        })
                                      }
                                    >
                                      <SkipForward className="mr-2 h-4 w-4" />
                                      Skip
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {line.status === "skipped" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateLine.mutate({
                                        id: line.id,
                                        data: { status: "planned" },
                                      })
                                    }
                                  >
                                    Restore to planned
                                  </DropdownMenuItem>
                                )}
                                {!line.transactionId && (
                                  <DropdownMenuItem
                                    className="text-expense"
                                    onClick={() => deleteLine.mutate(line.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="mt-2 text-right text-sm text-muted-foreground">
                    Subtotal:{" "}
                    <Numeric
                      value={sectionTotal}
                      className={cn(
                        "font-semibold",
                        section === "income" ? "text-income" : "text-expense",
                      )}
                    />
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AddBudgetLineDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultSection={addSection}
        isPending={addLine.isPending}
        onSubmit={(values: BudgetLineFormValues) => {
          addLine.mutate(values, { onSuccess: () => setAddOpen(false) });
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
