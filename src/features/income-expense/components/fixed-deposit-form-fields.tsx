import { format, parseISO } from "date-fns";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransactionFormValues } from "@/features/income-expense/schemas/transaction-schema";
import { DatePickerField } from "@/shared/components/date-picker-field";

interface FixedDepositFormFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
}

export function FixedDepositFormFields({ form }: FixedDepositFormFieldsProps) {
  return (
    <div className="space-y-4 rounded-lg border border-primary/15 bg-secondary/20 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="fixedDepositDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deposit date</FormLabel>
              <FormControl>
                <DatePickerField
                  value={field.value ? parseISO(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? format(date, "yyyy-MM-dd") : null)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fixedDepositInterestRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interest %</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.01"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? null : Number(e.target.value))
                  }
                  placeholder="8.50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="fixedDepositMaturityMonths"
        render={({ field }) => (
          <FormItem>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <FormLabel>Maturity</FormLabel>
                <Select
                  onValueChange={(v) => {
                    if (v === "custom") return;
                    field.onChange(Number(v));
                  }}
                  value={
                    field.value == null
                      ? ""
                      : [3, 6, 9, 12, 24, 36].includes(field.value)
                        ? String(field.value)
                        : "custom"
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="9">9 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="tx-fd-custom-months">Custom months</FormLabel>
                <FormControl>
                  <Input
                    id="tx-fd-custom-months"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="18"
                  />
                </FormControl>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
