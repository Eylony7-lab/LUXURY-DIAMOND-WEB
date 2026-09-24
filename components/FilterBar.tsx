"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import RangeSlider from "./RangeSlider";
import SortDropdown from "./SortDropdown";
import type { CatalogFilters } from "@/lib/filters";
import type { FilterOptions, SortOption } from "@/lib/types";

function Dropdown({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
          count > 0
            ? "border-gold text-charcoal"
            : "border-line text-charcoal-soft hover:border-gold/60"
        }`}
      >
        {label}
        {count > 0 && (
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[9px] text-white">
            {count}
          </span>
        )}
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-30 mt-2 w-64 max-w-[85vw] rounded-lg border border-line bg-ivory p-4 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

type FilterBarProps = {
  options: FilterOptions;
  filters: CatalogFilters;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onToggleShape: (shape: string) => void;
  onToggleColor: (color: string) => void;
  onCaratChange: (range: [number, number]) => void;
  onClear: () => void;
  activeCount: number;
  resultCount: number;
};

export default function FilterBar({
  options,
  filters,
  sort,
  onSortChange,
  onToggleShape,
  onToggleColor,
  onCaratChange,
  onClear,
  activeCount,
  resultCount,
}: FilterBarProps) {
  const caratActive =
    filters.caratRange[0] !== options.caratRange[0] || filters.caratRange[1] !== options.caratRange[1]
      ? 1
      : 0;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
      <Dropdown label="Shape" count={filters.shapes.length}>
        <div className="grid grid-cols-2 gap-2">
          {options.shapes.map((shape) => {
            const checked = filters.shapes.includes(shape);
            return (
              <label
                key={shape}
                className={`flex cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-xs transition-colors ${
                  checked
                    ? "border-gold bg-gold/10 text-charcoal"
                    : "border-line text-charcoal-soft hover:border-gold/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleShape(shape)}
                  className="sr-only"
                />
                {shape}
              </label>
            );
          })}
        </div>
      </Dropdown>

      <Dropdown label="Carat" count={caratActive}>
        <RangeSlider
          min={options.caratRange[0]}
          max={options.caratRange[1]}
          step={0.01}
          value={filters.caratRange}
          onChange={onCaratChange}
          formatValue={(v) => `${v.toFixed(2)} ct`}
        />
      </Dropdown>

      <Dropdown label="Color" count={filters.colors.length}>
        <div className="flex flex-wrap gap-2">
          {options.colors.map((color) => {
            const checked = filters.colors.includes(color);
            return (
              <label
                key={color}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border text-xs transition-colors ${
                  checked
                    ? "border-gold bg-gold text-white"
                    : "border-line text-charcoal-soft hover:border-gold/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleColor(color)}
                  className="sr-only"
                />
                {color}
              </label>
            );
          })}
        </div>
      </Dropdown>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs uppercase tracking-wide text-gold-dark underline-offset-4 hover:underline"
        >
          Clear all ({activeCount})
        </button>
      )}

      <div className="ml-auto flex items-center gap-3">
        <p className="text-xs text-charcoal-soft">
          {resultCount} {resultCount === 1 ? "diamond" : "diamonds"}
        </p>
        <SortDropdown value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
