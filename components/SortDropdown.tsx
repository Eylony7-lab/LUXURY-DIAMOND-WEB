"use client";

import { ChevronDown } from "lucide-react";
import { SORT_LABELS } from "@/lib/filters";
import type { SortOption } from "@/lib/types";

const OPTIONS: SortOption[] = ["relevance", "carat-asc", "carat-desc"];

export default function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        aria-label="Sort diamonds"
        className="appearance-none rounded-full border border-line bg-ivory py-2 pl-4 pr-9 text-sm text-charcoal transition-colors hover:border-gold focus:border-gold focus:outline-none"
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {SORT_LABELS[opt]}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-soft"
      />
    </div>
  );
}
