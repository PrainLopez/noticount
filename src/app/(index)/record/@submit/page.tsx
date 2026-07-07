"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { insertAccountRecord } from "@/src/api/account-records";
import { AuthSessionCtx } from "@/src/app/_context/auth-session-ctx";
import { currencyTypeValues, recordTypeValues } from "@/src/db/schema";

export default function AccountInput() {
  const authSession = use(AuthSessionCtx);
  const queryClient = useQueryClient();

  const [currentComboboxOpen, setCurrentComboboxOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState<string>(currencyTypeValues[0]);
  const [transactionType, setTransactionType] = useState<string>(recordTypeValues[0]);

  const mutation = useMutation({
    mutationFn: insertAccountRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-records", authSession?.userId] });
      queryClient.invalidateQueries({ queryKey: ["usage", authSession?.userId] });
      toast.success("记录提交成功");
      (document.getElementById("amount-input") as HTMLInputElement).value = "";
      (document.getElementById("note-input") as HTMLInputElement).value = "";
    },
    onError: (error) => {
      toast.error(`记录提交错误:\n${error}`);
    },
  });

  const formSubmit = (e?: React.FormEvent) => {
    if (e)
      e.preventDefault();

    if (!authSession?.userId) {
      toast.error("表单错误:未登录");
      return;
    }

    const amountText = (document.getElementById("amount-input") as HTMLInputElement)?.value || "";
    const noteText = (document.getElementById("note-input") as HTMLInputElement)?.value || "";

    const recordSchema = z.object({
      amount: z
        .string()
        .regex(/^\d+(?:\.\d{1,2})?$/, "金额格式不正确")
        .refine(value => Number(value) > 0, "金额必须大于0"),
      currencyType: z.enum(currencyTypeValues, { errorMap: () => ({ message: "货币类型无效" }) }),
      note: z.string().max(80, "备注不能超过80字"),
      recordType: z.enum(recordTypeValues, { errorMap: () => ({ message: "记录类型无效" }) }),
    });

    const { data, error } = recordSchema.safeParse({
      amount: amountText.trim(),
      currencyType: currencyValue,
      note: noteText,
      recordType: transactionType,
    });

    if (error) {
      const message = error.issues.map(issue => issue.message).join("; ");
      toast.error(`表单错误:${message}`);
      return;
    }

    mutation.mutate(data);
  };

  return (
    <Card className="rounded-lg w-full">
      <CardContent>
        <form>
          <div className="grid grid-cols-[3fr_5rem] sm:grid-cols-[3fr_5rem_3fr_1fr] gap-2">
            <Input id="amount-input" type="number" placeholder="Amount" />
            <Popover
              open={currentComboboxOpen}
              onOpenChange={setCurrentComboboxOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={currentComboboxOpen}
                  className="w-20 justify-between"
                >
                  {currencyValue}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-20 p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {currencyTypeValues.map(curr => (
                        <CommandItem
                          key={curr}
                          value={curr}
                          onSelect={() => {
                            setCurrencyValue(curr);
                            setCurrentComboboxOpen(false);
                          }}
                        >
                          <span>{curr}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Input
              id="note-input"
              className="col-span-2"
              type="text"
              placeholder="Note"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full flex flex-row justify-between">
          <ButtonGroup className="*:px-3">
            <Button
              variant={transactionType === recordTypeValues[0] ? "default" : "secondary"}
              size="sm"
              onClick={() => setTransactionType(recordTypeValues[0])}
              className="shadow-sm"
            >
              Daily
            </Button>
            <Button
              variant={transactionType === recordTypeValues[1] ? "default" : "secondary"}
              size="sm"
              onClick={() => setTransactionType(recordTypeValues[1])}
              className="shadow-sm"
            >
              Special
            </Button>
          </ButtonGroup>
          <Button
            size="sm"
            className="w-fit px-4 shadow-sm"
            disabled={!authSession?.userId || mutation.isPending}
            onClick={formSubmit}
          >Submit Record
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
