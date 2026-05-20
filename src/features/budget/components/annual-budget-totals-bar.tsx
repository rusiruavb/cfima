import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { overviewCardClass } from "@/features/budget/lib/overview-card-styles";
import type { AnnualBudgetTotals } from "@/features/budget/services/budget-api";
import { Numeric } from "@/shared/components/numeric";
import { cn } from "@/shared/lib/utils";

interface AnnualBudgetTotalsBarProps {
  year: string;
  totals?: AnnualBudgetTotals | null;
  isLoading?: boolean;
  error?: Error | null;
}

export function AnnualBudgetTotalsBar({
  year,
  totals,
  isLoading,
  error,
}: AnnualBudgetTotalsBarProps) {
  const items = totals
    ? [
        {
          label: "Annual income",
          value: totals.incomeTotal,
          className: "text-income",
        },
        {
          label: "Annual expenses",
          value: totals.expenseTotal,
          className: "text-expense font-semibold",
        },
        {
          label: "Annual fixed deposits",
          value: totals.fixedDepositTotal,
          className: "text-primary font-semibold",
        },
        {
          label: "Annual savings",
          value: totals.savingsTotal,
          className: "text-primary",
        },
        {
          label: "Annual remaining",
          value: totals.remaining,
          className:
            totals.remaining >= 0
              ? "text-income font-semibold"
              : "text-expense font-semibold",
        },
      ]
    : [];

  return (
    <Card className={overviewCardClass}>
      <CardHeader className="px-4 py-3 sm:px-5">
        <CardTitle className="text-base text-primary">
          Year {year} overview
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 sm:px-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading annual totals…
          </p>
        ) : error ? (
          <div className="space-y-1 text-sm">
            <p className="text-destructive">
              Could not load annual totals: {error.message}
            </p>
            <p className="text-muted-foreground">
              If you are developing locally, run{" "}
              <code className="rounded bg-secondary px-1">pnpm dev</code> so the
              API server is running (not only the Vite client).
            </p>
          </div>
        ) : totals ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-5">
            {items.map((item) => (
              <div key={item.label} className="min-w-0">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs sm:normal-case sm:tracking-normal">
                  {item.label}
                </span>
                <Numeric
                  value={item.value}
                  className={cn("text-sm sm:text-base", item.className)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No annual data yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
