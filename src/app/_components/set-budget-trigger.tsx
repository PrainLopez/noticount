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

const currencies = ["CNY", "GBP", "USD", "EUR", "JPY"];

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
    budget_amount: z
      .number()
      .min(0.01, "Budget amount must be greater than 0")
      .max(9999999999.99, "Budget amount exceeds numeric(10, 2)"),
    currency_type: z.string().length(3, "Currency must be 3 letters"),
    time_to_effect: z
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
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 639px)").matches;
}

function BudgetForm({
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
}: {
  budgetAmountValue: string;
  currencyOpen: boolean;
  currencyValue: string;
  isFirstSetup: boolean;
  monthValue: string;
  onBudgetAmountChange: (value: string) => void;
  onCurrencyOpenChange: (open: boolean) => void;
  onCurrencySelect: (value: string) => void;
  onMonthChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Setup Monthly Budget</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Month</p>
          <Input
            type="month"
            placeholder="YYYY-MM"
            value={monthValue}
            disabled={isFirstSetup}
            onChange={event => onMonthChange(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Currency</p>
          <Popover open={currencyOpen} onOpenChange={onCurrencyOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={currencyOpen}
                className="justify-between"
              >
                {currencyValue}
                <ChevronsUpDown />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {currencies.map(currency => (
                      <CommandItem
                        key={currency}
                        value={currency}
                        onSelect={() => onCurrencySelect(currency)}
                      >
                        {currency}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isFirstSetup && (
        <p className="text-xs text-muted-foreground">
          First setup is locked to current month.
        </p>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Budget amount</p>
        <Input
          type="number"
          placeholder="0.00"
          value={budgetAmountValue}
          onChange={event => onBudgetAmountChange(event.target.value)}
        />
      </div>
      <Button
        size="sm"
        className="w-full"
        disabled={pending}
        onClick={onSubmit}
      >
        Save Budget
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
  const [currencyValue, setCurrencyValue] = useState("CNY");
  const [budgetAmountValue, setBudgetAmountValue] = useState("");
  const [monthValue, setMonthValue] = useState(resolvedCurrentMonth);

  const budgetSchema = useMemo(() => createBudgetSchema(currentMonthKey), [currentMonthKey]);

  const budgetMutation = useMutation({
    mutationFn: insertBudgetSetting,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["usage", authSession?.user?.id],
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
    if (!authSession?.user?.id) {
      toast.error("User not authenticated");
      return;
    }

    const monthToUse = isFirstSetup
      ? currentMonthKey
      : monthInputToMonthKey(monthValue);

    const { data, error } = budgetSchema.safeParse({
      budget_amount: Number(budgetAmountValue),
      currency_type: currencyValue,
      time_to_effect: monthToUse,
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
