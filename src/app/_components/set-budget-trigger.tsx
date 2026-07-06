"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { use, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { insertBudgetSetting } from "@/src/api/user-budget-settings";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";
import { currencyTypeValues } from "@/src/db/schema";

type SetBudgetTriggerProps = {
  currentMonthKey: number;
  isFirstSetup: boolean;
};

function monthInputToMonthKey(monthInput: string): number {
  const [yearText, monthText] = monthInput.split("-");
  return Number(`${yearText}${monthText}`);
}

function monthKeyToMonthInput(monthKey: number): string {
  const year = Math.floor(monthKey / 100);
  const month = monthKey % 100;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage = Reflect.get(error, "message");
    const maybeDetails = Reflect.get(error, "details");

    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      if (typeof maybeDetails === "string" && maybeDetails.length > 0) {
        return `${maybeMessage} (${maybeDetails})`;
      }
      return maybeMessage;
    }
  }

  return "Unknown error";
}

function createBudgetSchema(currentMonthKey: number) {
  return z.object({
    budgetAmount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "金额格式不正确")
      .refine(value => Number(value) > 0, "Budget amount must be greater than 0")
      .refine(value => Number(value) <= 9999999999.99, "Budget amount exceeds numeric(18, 2)"),
    currencyType: z.enum(currencyTypeValues),
    timeToEffect: z
      .number()
      .int()
      .min(currentMonthKey, "Month cannot be earlier than current month")
      .max(999912, "Invalid month")
      .refine((value) => {
        const month = value % 100;
        return month >= 1 && month <= 12;
      }, "Month must be between 01 and 12"),
  });
}

function isSmDownViewport(): boolean {
  return false;
}

type BudgetFormProps = {
  budgetAmountValue: string;
  currencyOpen: boolean;
  currencyValue: string;
  isFirstSetup: boolean;
  monthValue: string;
  onBudgetAmountChange: (value: string) => void;
  onCurrencyOpenChange: (open: boolean) => void;
  onCurrencySelect: (currency: string) => void;
  onMonthChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
};

function BudgetForm(props: BudgetFormProps) {
  const {
    budgetAmountValue,
    currencyOpen,
    currencyValue,
    isFirstSetup,
    monthValue,
    onBudgetAmountChange,
    onCurrencyOpenChange,
    onCurrencySelect,
    onMonthChange,
    onSubmit,
    pending,
  } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Currency</span>
        <Popover open={currencyOpen} onOpenChange={onCurrencyOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={currencyOpen} className="w-full justify-between">
              {currencyValue}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
            <Command>
              <CommandList>
                <CommandGroup>
                  {currencyTypeValues.map(curr => (
                    <CommandItem
                      key={curr}
                      value={curr}
                      onSelect={() => onCurrencySelect(curr)}
                    >
                      <span>{curr}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Budget amount</span>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={budgetAmountValue}
          onChange={e => onBudgetAmountChange(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {!isFirstSetup && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Effective from</span>
          <Input
            type="month"
            value={monthValue}
            onChange={e => onMonthChange(e.target.value)}
          />
        </div>
      )}

      <Button onClick={onSubmit} disabled={pending}>
        {pending ? "Saving..." : "Save budget"}
      </Button>
    </div>
  );
}

export default function SetBudgetTrigger({ currentMonthKey, isFirstSetup }: SetBudgetTriggerProps) {
  const authSession = use(AuthSessionCtx);
  const queryClient = useQueryClient();
  const isSmDown = isSmDownViewport();
  const resolvedCurrentMonth = useMemo(
    () => monthKeyToMonthInput(currentMonthKey),
    [currentMonthKey],
  );

  const [open, setOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState<string>(currencyTypeValues[0]);
  const [budgetAmountValue, setBudgetAmountValue] = useState("");
  const [monthValue, setMonthValue] = useState(resolvedCurrentMonth);

  const budgetSchema = useMemo(() => createBudgetSchema(currentMonthKey), [currentMonthKey]);

  const budgetMutation = useMutation({
    mutationFn: insertBudgetSetting,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["usage", authSession?.userId],
      });
      toast.success("Budget has been saved");
      setOpen(false);
      setCurrencyOpen(false);
      setBudgetAmountValue("");
      setMonthValue(resolvedCurrentMonth);
    },
    onError: (error) => {
      toast.error(`Budget setup failed: ${formatErrorMessage(error)}`);
    },
  });

  const handleSubmit = () => {
    if (!authSession?.userId) {
      toast.error("User not authenticated");
      return;
    }

    const monthToUse = isFirstSetup
      ? currentMonthKey
      : monthInputToMonthKey(monthValue);

    const { data, error } = budgetSchema.safeParse({
      budgetAmount: budgetAmountValue.trim(),
      currencyType: currencyValue,
      timeToEffect: monthToUse,
    });

    if (error) {
      const issueMessage = error.issues.map(issue => issue.message).join("; ");
      toast.error(`Budget form error: ${issueMessage}`);
      return;
    }

    budgetMutation.mutate(data);
  };

  const form = (
    <BudgetForm
      budgetAmountValue={budgetAmountValue}
      currencyOpen={currencyOpen}
      currencyValue={currencyValue}
      isFirstSetup={isFirstSetup}
      monthValue={isFirstSetup ? resolvedCurrentMonth : monthValue}
      onBudgetAmountChange={setBudgetAmountValue}
      onCurrencyOpenChange={setCurrencyOpen}
      onCurrencySelect={(currency) => {
        setCurrencyValue(currency);
        setCurrencyOpen(false);
      }}
      onMonthChange={setMonthValue}
      onSubmit={handleSubmit}
      pending={budgetMutation.isPending}
    />
  );

  if (isSmDown) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button size="sm" variant="outline">Set Budget</Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader className="text-left">
              <DrawerTitle>Set Budget</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {form}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">Set Budget</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {form}
      </PopoverContent>
    </Popover>
  );
}
