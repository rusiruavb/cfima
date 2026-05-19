import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BudgetMonthView } from "@/features/budget/components/budget-month-view";
import { BudgetTemplateSection } from "@/features/budget/components/budget-template-section";
import { currentYearMonth } from "@/features/budget/services/budget-api";
import { cn } from "@/shared/lib/utils";

type BudgetTab = "month" | "template";

export function BudgetPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const monthParam = searchParams.get("month");
  const [tab, setTab] = useState<BudgetTab>(
    tabParam === "template" ? "template" : "month",
  );
  const [yearMonth, setYearMonth] = useState(monthParam ?? currentYearMonth());

  const setTabAndUrl = (next: BudgetTab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    if (next === "month") params.set("month", yearMonth);
    setSearchParams(params, { replace: true });
  };

  const setYearMonthAndUrl = (ym: string) => {
    setYearMonth(ym);
    const params = new URLSearchParams(searchParams);
    params.set("tab", "month");
    params.set("month", ym);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-primary sm:text-2xl">Monthly Budget</h1>
        <p className="text-sm text-muted-foreground">
          Plan income and expenses by month, then post to your ledger when paid
        </p>
      </div>

      <div className="flex gap-2 rounded-lg border border-primary/20 bg-secondary/30 p-1">
        <Button
          type="button"
          variant={tab === "month" ? "default" : "ghost"}
          className={cn("flex-1", tab !== "month" && "text-primary")}
          onClick={() => setTabAndUrl("month")}
        >
          Month sheet
        </Button>
        <Button
          type="button"
          variant={tab === "template" ? "default" : "ghost"}
          className={cn("flex-1", tab !== "template" && "text-primary")}
          onClick={() => setTabAndUrl("template")}
        >
          Template
        </Button>
      </div>

      {tab === "month" ? (
        <BudgetMonthView yearMonth={yearMonth} onYearMonthChange={setYearMonthAndUrl} />
      ) : (
        <BudgetTemplateSection />
      )}
    </div>
  );
}
