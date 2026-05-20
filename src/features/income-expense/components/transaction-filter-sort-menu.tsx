import { format } from "date-fns";
import { ListFilter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  countActiveFilters,
  DEFAULT_TRANSACTION_FILTERS,
  DEFAULT_TRANSACTION_SORT,
  type DateFilterMode,
  type SortDir,
  type SortKey,
  type TransactionFilters,
  type TransactionSort,
} from "@/features/income-expense/lib/transaction-table-query";
import { TRANSACTION_CATEGORIES } from "@/features/income-expense/schemas/transaction-schema";
import { FINANCE_TYPES } from "@/shared/constants/sheets";
import { DatePickerField } from "@/shared/components/date-picker-field";
import { cn } from "@/shared/lib/utils";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Amount" },
  { value: "description", label: "Description" },
  { value: "financeType", label: "Type" },
];

interface TransactionFilterSortMenuProps {
  filters: TransactionFilters;
  sort: TransactionSort;
  onFiltersChange: (filters: TransactionFilters) => void;
  onSortChange: (sort: TransactionSort) => void;
  className?: string;
}

export function TransactionFilterSortMenu({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  className,
}: TransactionFilterSortMenuProps) {
  const activeCount = countActiveFilters(filters);
  const isDefaultSort =
    sort.key === DEFAULT_TRANSACTION_SORT.key && sort.dir === DEFAULT_TRANSACTION_SORT.dir;

  const patchFilters = (patch: Partial<TransactionFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const patchDateFilter = (patch: Partial<TransactionFilters["date"]>) => {
    onFiltersChange({ ...filters, date: { ...filters.date, ...patch } });
  };

  const clearAll = () => {
    onFiltersChange(DEFAULT_TRANSACTION_FILTERS);
    onSortChange(DEFAULT_TRANSACTION_SORT);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <ListFilter className="h-4 w-4" />
          Filter & sort
          {activeCount > 0 ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] space-y-5 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">Filter & sort</p>
          {(activeCount > 0 || !isDefaultSort) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-muted-foreground"
              onClick={clearAll}
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Sort
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sort-by">Sort by</Label>
              <Select
                value={sort.key}
                onValueChange={(value) =>
                  onSortChange({ ...sort, key: value as SortKey })
                }
              >
                <SelectTrigger id="sort-by" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sort-dir">Order</Label>
              <Select
                value={sort.dir}
                onValueChange={(value) =>
                  onSortChange({ ...sort, dir: value as SortDir })
                }
              >
                <SelectTrigger id="sort-dir" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    {sort.key === "date" ? "Newest first" : "Descending"}
                  </SelectItem>
                  <SelectItem value="asc">
                    {sort.key === "date" ? "Oldest first" : "Ascending"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Filters
          </p>

          <div className="space-y-2">
            <Label>Date</Label>
            <Select
              value={filters.date.mode}
              onValueChange={(value) =>
                patchDateFilter({ mode: value as DateFilterMode })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                <SelectItem value="month">By month</SelectItem>
                <SelectItem value="range">Date range</SelectItem>
              </SelectContent>
            </Select>

            {filters.date.mode === "month" ? (
              <Input
                type="month"
                className="h-9 font-mono-numeric"
                value={filters.date.month}
                onChange={(e) => patchDateFilter({ month: e.target.value })}
              />
            ) : null}

            {filters.date.mode === "range" ? (
              <div className="grid gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <DatePickerField
                    value={filters.date.rangeFrom}
                    onChange={(date) => patchDateFilter({ rangeFrom: date })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <DatePickerField
                    value={filters.date.rangeTo}
                    onChange={(date) => patchDateFilter({ rangeTo: date })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-amount">Amount</Label>
            <Input
              id="filter-amount"
              placeholder="Contains…"
              className="h-9 text-sm"
              value={filters.amount}
              onChange={(e) => patchFilters({ amount: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-description">Description</Label>
            <Input
              id="filter-description"
              placeholder="Contains…"
              className="h-9 text-sm"
              value={filters.description}
              onChange={(e) => patchFilters({ description: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-type">Type</Label>
            <Select
              value={filters.financeType || "all"}
              onValueChange={(value) =>
                patchFilters({ financeType: value === "all" ? "" : value })
              }
            >
              <SelectTrigger id="filter-type" className="h-9">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {FINANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="filter-category">Category</Label>
            <Select
              value={filters.category || "all"}
              onValueChange={(value) =>
                patchFilters({ category: value === "all" ? "" : value })
              }
            >
              <SelectTrigger id="filter-category" className="h-9">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {TRANSACTION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {filters.date.mode === "month" && filters.date.month ? (
          <p className="text-xs text-muted-foreground">
            Showing {format(new Date(`${filters.date.month}-01`), "MMMM yyyy")}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
