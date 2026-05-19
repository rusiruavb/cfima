import { IncomeExpenseForm } from "@/features/income-expense/components/income-expense-form";
import { IncomeExpenseTable } from "@/features/income-expense/components/income-expense-table";

export function IncomeExpensePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-primary sm:text-2xl">Income & Expense</h1>
        <p className="text-sm text-muted-foreground">
          Track actual income and expense transactions
        </p>
      </div>
      <IncomeExpenseForm />
      <IncomeExpenseTable />
    </div>
  );
}
