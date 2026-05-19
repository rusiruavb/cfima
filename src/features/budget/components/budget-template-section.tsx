import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemplateItemDialog } from "@/features/budget/components/template-item-dialog";
import {
  useBudgetTemplates,
  useCreateBudgetTemplate,
  useDeleteBudgetTemplate,
  useUpdateBudgetTemplate,
} from "@/features/budget/hooks/use-budget-templates";
import { SECTION_LABELS, SECTION_ORDER } from "@/features/budget/lib/section-labels";
import type { RecurringItemFormValues } from "@/features/budget/schemas/budget-schema";
import type { BudgetSection, RecurringBudgetItem } from "@/features/budget/types/budget";
import { Numeric } from "@/shared/components/numeric";

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
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading template…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Permanent items copied when you create a new month from template. Edit here anytime;
        past months are not changed.
      </p>

      {SECTION_ORDER.map((section) => {
        const sectionItems = items.filter((i) => i.section === section);
        const sectionTotal = sectionItems
          .filter((i) => i.isActive && i.frequency === "monthly" && i.amount > 0)
          .reduce((sum, i) => sum + i.amount, 0);

        return (
          <Card key={section} className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-base text-primary">{SECTION_LABELS[section]}</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 border-primary/30"
                onClick={() => openAdd(section)}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {sectionItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Duplicate</TableHead>
                      <TableHead className="w-[88px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionItems.map((item) => (
                      <TableRow
                        key={item.id}
                        className={!item.isActive ? "opacity-50" : undefined}
                      >
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.amount > 0 ? (
                            <Numeric value={item.amount} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                          {item.frequency === "manual_only"
                            ? "Manual"
                            : item.amountSource === "previous_month"
                              ? "Prev month"
                              : "Template"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEdit(item)}
                              aria-label="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-expense"
                              onClick={() => setDeleteId(item.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {sectionItems.length > 0 && (
                <p className="text-right text-sm text-muted-foreground">
                  Active monthly subtotal:{" "}
                  <Numeric value={sectionTotal} className="font-semibold text-primary" />
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

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
