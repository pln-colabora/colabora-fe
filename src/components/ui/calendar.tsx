"use client";

import * as React from "react";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({ className, classNames, ...props }: DayPickerProps) {
  return (
    <DayPicker
      showOutsideDays
      captionLayout="dropdown"
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex h-8 items-center justify-center",
        caption_label: "inline-flex items-center gap-1 text-base font-medium",
        dropdowns: "flex items-center gap-3",
        dropdown_root: "relative inline-flex items-center",
        dropdown:
          "absolute inset-0 z-10 w-full cursor-pointer opacity-0",
        months_dropdown: "w-[4.5rem]",
        years_dropdown: "w-[4.5rem]",
        chevron: "text-muted-foreground size-3.5",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",
        button_previous:
          "absolute left-1 size-8 rounded-md border-0 bg-transparent p-0 opacity-70 hover:bg-accent hover:opacity-100",
        button_next:
          "absolute right-1 size-8 rounded-md border-0 bg-transparent p-0 opacity-70 hover:bg-accent hover:opacity-100",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-8 rounded-md text-[0.8rem] font-normal",
        week: "mt-2 flex w-full",
        day: "relative size-8 p-0 text-center text-sm [&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-accent",
        day_button:
          "inline-flex size-8 items-center justify-center rounded-md p-0 font-normal hover:bg-accent hover:text-accent-foreground aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected: "bg-primary text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, size }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown;
          return (
            <Icon
              className={iconClassName}
              size={size}
              aria-hidden="true"
            />
          );
        },
      }}
      {...props}
    />
  );
}

export { Calendar };
