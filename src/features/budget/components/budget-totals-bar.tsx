import { Card, CardContent } from "@/components/ui/card";
import { overviewCardClass } from "@/features/budget/lib/overview-card-styles";
import type { BudgetTotals } from "@/features/budget/types/budget";
import { Numeric } from "@/shared/components/numeric";
import { cn } from "@/shared/lib/utils";

interface BudgetTotalsBarProps {
  totals: BudgetTotals;
}

export function BudgetTotalsBar({ totals }: BudgetTotalsBarProps) {
  const items = [
    { label: "Income", value: totals.incomeTotal, className: "text-income" },
    {
      label: "Expenses",
      value: totals.expenseTotal,
      className: "text-expense font-semibold",
    },
    {
      label: "Fixed deposits",
      value: totals.fixedDepositTotal,
      className: "text-primary font-semibold",
    },
    { label: "Savings", value: totals.savingsTotal, className: "text-primary" },
    {
      label: "Remaining",
      value: totals.remaining,
      className: totals.remaining >= 0 ? "text-income font-semibold" : "text-expense font-semibold",
    },
  ];

  return (
    <Card className={overviewCardClass}>
      <CardContent className="grid grid-cols-3 gap-x-3 gap-y-2 p-3 sm:grid-cols-6 sm:gap-3">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs sm:normal-case sm:tracking-normal">
              {item.label}
            </span>
            <Numeric value={item.value} className={cn("text-sm sm:text-base", item.className)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
