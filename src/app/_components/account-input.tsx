"use client";

import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const currency = ["GBP", "USD", "EUR", "CNY"];

export default function AccountInput() {
  const [currentComboboxOpen, setCurrentComboboxOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState(currency[0]);

  return (
    <form>
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
        <PopoverContent className="w-20">
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
    </form>
  );
}
