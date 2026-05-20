import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUpdateLoanPayment } from "@/features/loans/hooks/use-update-loan-payment";
import type { Loan, LoanPayment } from "@/features/loans/types/loan";
import { Numeric } from "@/shared/components/numeric";
import { LEDGER_TABLE_COMPACT } from "@/shared/lib/compact-table";
import { cn } from "@/shared/lib/utils";

interface LoanDetailTableProps {
  loan: Loan;
}

export function LoanDetailTable({ loan }: LoanDetailTableProps) {
  const { toggleMutation } = useUpdateLoanPayment(loan.id);

  return (
    <>
      {/* Mobile card list */}
      <ul className="space-y-3 lg:hidden">
        {loan.payments.map((payment) => (
          <li key={payment.rowIndex}>
            <PaymentCard
              payment={payment}
              onToggle={() =>
                toggleMutation.mutate({ rowIndex: payment.rowIndex })
              }
              isToggling={toggleMutation.isPending}
            />
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-primary/20 lg:block">
        <Table className={LEDGER_TABLE_COMPACT}>
          <TableHeader>
            <TableRow className="border-primary/20 bg-secondary hover:bg-secondary">
              <TableHead>Month</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="no-print w-[72px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loan.payments.map((payment) => (
              <PaymentRow
                key={payment.rowIndex}
                payment={payment}
                onToggle={() =>
                  toggleMutation.mutate({ rowIndex: payment.rowIndex })
                }
                isToggling={toggleMutation.isPending}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function PaymentCard({
  payment,
  onToggle,
  isToggling,
}: {
  payment: LoanPayment;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const isPaid = payment.status === "paid";

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-card p-4",
        isPaid && "line-through opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono-numeric text-sm text-muted-foreground">
          Month {payment.month}
        </span>
        <span className="text-sm font-medium capitalize">{payment.status}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <span className="text-muted-foreground">Payment</span>
        <Numeric value={payment.paymentAmount} className="justify-end text-right" />
        <span className="text-muted-foreground">Principal</span>
        <Numeric value={payment.principalAmount} className="justify-end text-right" />
        <span className="text-muted-foreground">Interest</span>
        <Numeric value={payment.interestAmount} className="justify-end text-right" />
        <span className="text-muted-foreground">Remaining</span>
        <Numeric value={payment.remainingBalance} className="justify-end text-right" />
      </div>
      <div className="no-print mt-4">
        <Button
          variant={isPaid ? "secondary" : "default"}
          size="sm"
          className="w-full"
          onClick={onToggle}
          disabled={isToggling}
        >
          <Check className="mr-1 h-4 w-4" />
          {isPaid ? "Undo" : "Mark paid"}
        </Button>
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
  onToggle,
  isToggling,
}: {
  payment: LoanPayment;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const isPaid = payment.status === "paid";

  return (
    <TableRow className={cn(isPaid && "line-through opacity-70")}>
      <TableCell className="font-mono-numeric">{payment.month}</TableCell>
      <TableCell>
        <Numeric value={payment.paymentAmount} />
      </TableCell>
      <TableCell>
        <Numeric value={payment.principalAmount} />
      </TableCell>
      <TableCell>
        <Numeric value={payment.interestAmount} />
      </TableCell>
      <TableCell>
        <Numeric value={payment.remainingBalance} />
      </TableCell>
      <TableCell className="capitalize">{payment.status}</TableCell>
      <TableCell className="no-print">
        <Button
          variant={isPaid ? "secondary" : "default"}
          size="sm"
          onClick={onToggle}
          disabled={isToggling}
          aria-label={isPaid ? "Mark as pending" : "Mark as paid"}
        >
          <Check className="h-4 w-4" />
          {isPaid ? "Undo" : "Paid"}
        </Button>
      </TableCell>
    </TableRow>
  );
}
