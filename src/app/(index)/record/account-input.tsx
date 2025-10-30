"use client";

import { ChevronsUpDown } from "lucide-react";
import { use, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UidContext } from "@/src/app/_context/uid-context";

import { insertAccountRecord } from "../../api/account-records";

export default function AccountInput() {
  const currency = ["GBP", "USD", "EUR", "CNY", "JPY"];
  const recordType = ["daily", "special"];

  const recordSchema = z.object({
    amount: z
      .number()
      .min(0.01, "金额必须大于0")
      .max(9999999999.99, "金额不能超过numeric(10, 2)"),
    currency_type: z.enum(currency, "货币类型无效"),
    note: z.string().max(80, "备注不能超过80字"),
    record_type: z.enum(recordType, "记录类型无效"),
    user_id: z.uuid("用户ID无效"),
  });

  const [currentComboboxOpen, setCurrentComboboxOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState(currency[0]);
  const [transactionType, setTransactionType] = useState("daily");

  const uid = use(UidContext);

  const formSubmit = (e?: React.FormEvent) => {
    if (e)
      e.preventDefault();

    const amount = Number((document.getElementById("amount-input") as HTMLInputElement)?.value || "");
    const note = (document.getElementById("note-input") as HTMLInputElement)?.value || "";

    const { data, error } = recordSchema.safeParse({
      amount,
      currency_type: currencyValue,
      note,
      record_type: transactionType,
      user_id: uid,
    });

    if (error) {
      console.error(`表单错误:\n${error}`);
    }
    if (data) {
      insertAccountRecord(data);
      (document.getElementById("amount-input") as HTMLInputElement).value = "";
      (document.getElementById("note-input") as HTMLInputElement).value = "";
    }
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
              <PopoverContent className="w-20 p-0 bg-popover">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {currency.map(curr => (
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
              variant={transactionType === "daily" ? "default" : "secondary"}
              size="sm"
              onClick={() => setTransactionType("daily")}
              className="shadow-sm"
            >
              Daily
            </Button>
            <Button
              variant={transactionType === "special" ? "default" : "secondary"}
              size="sm"
              onClick={() => setTransactionType("special")}
              className="shadow-sm"
            >
              Special
            </Button>
          </ButtonGroup>
          <Button
            size="sm"
            className="w-fit px-4 shadow-sm"
            disabled={!uid}
            onClick={formSubmit}
          >Submit Record
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
