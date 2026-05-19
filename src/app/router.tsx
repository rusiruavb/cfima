import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { BudgetPage } from "@/features/budget";
import { IncomeExpensePage } from "@/features/income-expense";
import { LoanDetailPage, LoansPage } from "@/features/loans";
import { SummaryPage } from "@/features/summary";
import { AppLayout } from "@/shared/components/app-layout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/income-expense" replace />} />
          <Route path="income-expense" element={<IncomeExpensePage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="loans/:loanId" element={<LoanDetailPage />} />
          <Route path="summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
