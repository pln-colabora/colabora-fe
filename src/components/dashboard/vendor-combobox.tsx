"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type VendorOption = { id: string; name: string };

export function VendorCombobox({
  vendors,
  value,
  onChange,
  disabled = false,
  loading = false,
  placeholder = "Pilih vendor",
  id,
}: {
  vendors: VendorOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = vendors.find((vendor) => vendor.id === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID");
    if (!term) return vendors;
    return vendors.filter((vendor) =>
      vendor.name.toLocaleLowerCase("id-ID").includes(term),
    );
  }, [vendors, query]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    const focus = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.clearTimeout(focus);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <Button
        id={id}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled || loading}
        className="bg-background h-11 w-full justify-between font-normal"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {loading
            ? "Memuat vendor..."
            : (selected?.name ?? placeholder)}
        </span>
        <ChevronsUpDown
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden="true"
        />
      </Button>

      {open && !loading ? (
        <div className="bg-popover absolute z-30 mt-2 w-full rounded-lg border p-1 shadow-md">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari vendor"
              aria-label="Cari vendor"
              className="h-10 pl-8"
            />
          </div>
          <ul className="mt-1 max-h-56 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <li className="text-muted-foreground px-2 py-6 text-center text-sm">
                {vendors.length === 0
                  ? "Belum ada akun vendor untuk peran ini."
                  : "Vendor tidak ditemukan."}
              </li>
            ) : (
              filtered.map((vendor) => (
                <li key={vendor.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={vendor.id === value}
                    className="hover:bg-accent flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm"
                    onClick={() => {
                      onChange(vendor.id);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        vendor.id === value ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{vendor.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
