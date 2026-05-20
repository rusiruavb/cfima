import { IncomeExpenseForm } from "@/features/income-expense/components/income-expense-form";
import { IncomeExpenseTable } from "@/features/income-expense/components/income-expense-table";

export function IncomeExpensePanel() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <IncomeExpenseForm />
      <IncomeExpenseTable />
    </div>
  );
}

