"use client";

import * as React from "react";

import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, parseDateValue } from "@/lib/utils";

type DatePickerProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  value?: string;
  onChange: (value: string) => void;
};

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatInputValue(value?: string) {
  const date = parseDateValue(value);
  if (!date) return value ?? "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function addDateSeparators(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function normalizeManualDate(value: string) {
  const match = /^(\d{2})[/.\-](\d{2})[/.\-](\d{4})$/.exec(value);
  if (!match) return value;
  const normalized = `${match[3]}-${match[2]}-${match[1]}`;
  return parseDateValue(normalized) ? normalized : addDateSeparators(value);
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(
    { value, onChange, disabled, className, ...props },
    ref,
  ) {
    const [open, setOpen] = React.useState(false);
    const selectedDate = parseDateValue(value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <span
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-base"
          >
            <span className="text-foreground">{formatInputValue(value)}</span>
            {"dd/mm/yyyy".slice(formatInputValue(value).length)}
          </span>
          <Input
            {...props}
            ref={ref}
            type="text"
            inputMode="numeric"
            value={formatInputValue(value)}
            onChange={(event) =>
              onChange(normalizeManualDate(addDateSeparators(event.target.value)))
            }
            disabled={disabled}
            placeholder=""
            className={cn(
              "bg-background h-11 pr-12 text-transparent caret-foreground placeholder:text-transparent",
              className,
            )}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              aria-label="Buka kalender"
              aria-expanded={open}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 size-9 -translate-y-1/2 p-0"
            >
              <CalendarIcon className="size-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate ?? new Date()}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateValue(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  },
);

export { DatePicker };
