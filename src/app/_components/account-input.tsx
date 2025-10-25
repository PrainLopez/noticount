'use client';

import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const currency = ["GBP", "USD", "EUR", "CNY", "JPY"];

export default function AccountInput() {
  const [currentComboboxOpen, setCurrentComboboxOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState(currency[0]);
  const [transactionType, setTransactionType] = useState("daily");

  return (
    <Card className="rounded-lg w-full">
      <CardContent>
        <form>
          <div className="grid grid-cols-[3fr_5rem] sm:grid-cols-[3fr_5rem_3fr_1fr] gap-2">
            <Input type="number" placeholder="Amount" />
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
          <Button size="sm" className="w-fit px-4 shadow-sm">Submit Record</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
