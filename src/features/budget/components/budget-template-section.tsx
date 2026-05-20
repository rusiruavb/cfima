import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BudgetTemplateTotalsBar } from "@/features/budget/components/budget-template-totals-bar";
import { TemplateItemDialog } from "@/features/budget/components/template-item-dialog";
import {
  useBudgetTemplates,
  useCreateBudgetTemplate,
  useDeleteBudgetTemplate,
  useUpdateBudgetTemplate,
} from "@/features/budget/hooks/use-budget-templates";
import { SECTION_LABELS, SECTION_ORDER } from "@/features/budget/lib/section-labels";
import {
  computeTemplateTotals,
  sectionMonthlyTotal,
} from "@/features/budget/lib/template-totals";
import type { RecurringItemFormValues } from "@/features/budget/schemas/budget-schema";
import type { BudgetSection, RecurringBudgetItem } from "@/features/budget/types/budget";
import { compactCell, compactHead } from "@/features/budget/lib/compact-table";
import { Numeric } from "@/shared/components/numeric";
import { cn } from "@/shared/lib/utils";

function duplicateLabel(item: RecurringBudgetItem): string | null {
  if (item.frequency === "manual_only") return "Manual";
  if (item.amountSource === "previous_month") return "Prev month";
  if (item.itemType === "fixed_deposit") return "Fixed deposit";
  return null;
}

export function BudgetTemplateSection() {
  const { data: items = [], isLoading } = useBudgetTemplates();
  const createMutation = useCreateBudgetTemplate();
  const updateMutation = useUpdateBudgetTemplate();
  const deleteMutation = useDeleteBudgetTemplate();

  const [dialogSection, setDialogSection] = useState<BudgetSection>("income");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringBudgetItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const openAdd = (section: BudgetSection) => {
    setEditingItem(null);
    setDialogSection(section);
    setDialogOpen(true);
  };

  const openEdit = (item: RecurringBudgetItem) => {
    setEditingItem(item);
    setDialogSection(item.section);
    setDialogOpen(true);
  };

  const handleSubmit = (values: RecurringItemFormValues) => {
    if (editingItem) {
      updateMutation.mutate(
        {
          id: editingItem.id,
          data: {
            ...editingItem,
            ...values,
            amount: values.amount ?? 0,
            sortOrder: editingItem.sortOrder,
            isActive: values.isActive ?? true,
            amountSource: values.amountSource ?? "template",
            frequency: values.frequency ?? "monthly",
          },
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMutation.mutate(
        {
          description: values.description,
          amount: values.amount ?? 0,
          financeType: values.financeType,
          section: values.section,
          amountSource: values.amountSource ?? "template",
          frequency: values.frequency ?? "monthly",
          itemType: values.itemType ?? "regular",
          fixedDepositDay:
            values.section === "savings" && values.itemType === "fixed_deposit"
              ? (values.fixedDepositDay ?? undefined)
              : undefined,
          fixedDepositMaturityMonths:
            values.section === "savings" && values.itemType === "fixed_deposit"
              ? (values.fixedDepositMaturityMonths ?? undefined)
              : undefined,
          fixedDepositInterestRate:
            values.section === "savings" && values.itemType === "fixed_deposit"
              ? (values.fixedDepositInterestRate ?? undefined)
              : undefined,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading template…</p>;
  }

  const totals = computeTemplateTotals(items);

  return (
    <div className="space-y-3">
      <BudgetTemplateTotalsBar totals={totals} />

      <Card className="border-primary/20">
        <CardHeader className="space-y-1 px-4 py-3 sm:px-5">
          <CardTitle className="text-base text-primary">Recurring template</CardTitle>
          <CardDescription className="text-xs leading-snug sm:text-sm">
            Items copied when you create a month. Edits apply to future months only. For recurring
            fixed deposits, use <span className="font-medium text-primary">Savings</span> → Add →{" "}
            <span className="font-medium text-primary">Saving type: Fixed deposit</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={compactHead}>Description</TableHead>
                <TableHead className={cn(compactHead, "w-24 text-right")}>Amount</TableHead>
                <TableHead className={cn(compactHead, "w-10")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {SECTION_ORDER.map((section) => {
                const sectionItems = items.filter((item) => item.section === section);
                const sectionTotal = sectionMonthlyTotal(items, section);

                return (
                  <SectionRows
                    key={section}
                    section={section}
                    sectionItems={sectionItems}
                    sectionTotal={sectionTotal}
                    onAdd={() => openAdd(section)}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TemplateItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        section={dialogSection}
        item={editingItem}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove template item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will not affect months you already created. Future duplicates will omit this
              item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId !== null) {
                  deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SectionRowsProps {
  section: BudgetSection;
  sectionItems: RecurringBudgetItem[];
  sectionTotal: number;
  onAdd: () => void;
  onEdit: (item: RecurringBudgetItem) => void;
  onDelete: (id: number) => void;
}

function SectionRows({
  section,
  sectionItems,
  sectionTotal,
  onAdd,
  onEdit,
  onDelete,
}: SectionRowsProps) {
  return (
    <>
      <TableRow className="border-primary/15 bg-secondary/40 hover:bg-secondary/40">
        <TableCell colSpan={3} className={cn(compactCell, "py-2")}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{SECTION_LABELS[section]}</span>
            {sectionItems.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({sectionItems.length})
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {sectionItems.length > 0 ? (
                <>
                  Subtotal{" "}
                  <Numeric
                    value={sectionTotal}
                    className={cn(
                      "font-medium",
                      section === "income" ? "text-income" : "text-expense",
                    )}
                  />
                </>
              ) : (
                "No items"
              )}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 shrink-0 gap-1 px-2 text-primary"
              onClick={onAdd}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:inline">Add</span>
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {sectionItems.map((item) => {
        const meta = duplicateLabel(item);

        return (
          <TableRow
            key={item.id}
            className={cn(!item.isActive && "opacity-50")}
          >
            <TableCell className={compactCell}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="min-w-0 truncate text-sm font-medium">{item.description}</span>
                <div className="flex shrink-0 items-center gap-1.5">
                  {item.featureCategory?.trim() ? (
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                      {item.featureCategory}
                    </Badge>
                  ) : null}
                  {meta ? (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                      {meta}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </TableCell>
            <TableCell className={cn(compactCell, "text-right font-mono-numeric text-sm text-muted-foreground")}>
              {item.amount > 0 ? <Numeric value={item.amount} /> : "—"}
            </TableCell>
            <TableCell className={cn(compactCell, "w-10 p-1")}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    aria-label={`Actions for ${item.description}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-expense"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
