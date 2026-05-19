import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgetTemplates } from "@/features/budget/hooks/use-budget-templates";
import type { AmountMode } from "@/features/budget/types/budget";

interface CreateMonthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultYearMonth: string;
  onConfirm: (yearMonth: string, amountMode: AmountMode) => void;
  isPending?: boolean;
}

export function CreateMonthDialog({
  open,
  onOpenChange,
  defaultYearMonth,
  onConfirm,
  isPending,
}: CreateMonthDialogProps) {
  const { data: templates = [] } = useBudgetTemplates();
  const [yearMonth, setYearMonth] = useState(defaultYearMonth);
  const [amountMode, setAmountMode] = useState<AmountMode>("template");

  const monthlyCount = templates.filter(
    (t) => t.isActive && t.frequency === "monthly",
  ).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setYearMonth(defaultYearMonth);
          setAmountMode("template");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create month from template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will copy {monthlyCount} active monthly template item
            {monthlyCount === 1 ? "" : "s"} into a new budget sheet.
          </p>
          <div className="space-y-2">
            <Label htmlFor="budget-month">Month</Label>
            <Input
              id="budget-month"
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Amounts</Label>
            <Select
              value={amountMode}
              onValueChange={(v) => setAmountMode(v as AmountMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Use template amounts</SelectItem>
                <SelectItem value="previous_month">Use previous month amounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!yearMonth || isPending}
            onClick={() => onConfirm(yearMonth, amountMode)}
          >
            {isPending ? "Creating…" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
