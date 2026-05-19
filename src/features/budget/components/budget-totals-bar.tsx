import { Card, CardContent } from "@/components/ui/card";
import type { BudgetTotals } from "@/features/budget/types/budget";
import { Numeric } from "@/shared/components/numeric";
import { cn } from "@/shared/lib/utils";

interface BudgetTotalsBarProps {
  totals: BudgetTotals;
}

export function BudgetTotalsBar({ totals }: BudgetTotalsBarProps) {
  const items = [
    { label: "Income", value: totals.incomeTotal, className: "text-income" },
    { label: "Fixed", value: totals.fixedTotal, className: "text-expense" },
    { label: "Variable", value: totals.variableTotal, className: "text-expense" },
    {
      label: "Expenses total",
      value: totals.expenseTotal,
      className: "text-expense font-semibold",
    },
    { label: "Savings", value: totals.savingsTotal, className: "text-primary" },
    {
      label: "Remaining",
      value: totals.remaining,
      className: totals.remaining >= 0 ? "text-income font-semibold" : "text-expense font-semibold",
    },
  ];

  return (
    <Card className="border-primary/20 bg-secondary/30">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <Numeric value={item.value} className={cn("text-lg", item.className)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
