"use client";

import RangeSlider from "./RangeSlider";
import { formatPrice } from "@/lib/format";
import type { CatalogFilters } from "@/lib/filters";
import type { FilterOptions } from "@/lib/types";

type FilterPanelProps = {
  options: FilterOptions;
  filters: CatalogFilters;
  onToggleShape: (shape: string) => void;
  onToggleColor: (color: string) => void;
  onCaratChange: (range: [number, number]) => void;
  onPriceChange: (range: [number, number]) => void;
  onClear: () => void;
  activeCount: number;
};

export default function FilterPanel({
  options,
  filters,
  onToggleShape,
  onToggleColor,
  onCaratChange,
  onPriceChange,
  onClear,
  activeCount,
}: FilterPanelProps) {
  return (
    <div className="space-y-9">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-charcoal">Refine</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs uppercase tracking-wide text-gold-dark underline-offset-4 hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <fieldset>
        <legend className="text-xs uppercase tracking-[0.18em] text-charcoal-soft">
          Shape
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.shapes.map((shape) => {
            const checked = filters.shapes.includes(shape);
            return (
              <label
                key={shape}
                className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
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
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-[0.18em] text-charcoal-soft">
          Carat
        </legend>
        <div className="mt-4">
          <RangeSlider
            min={options.caratRange[0]}
            max={options.caratRange[1]}
            step={0.01}
            value={filters.caratRange}
            onChange={onCaratChange}
            formatValue={(v) => `${v.toFixed(2)} ct`}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-[0.18em] text-charcoal-soft">
          Color
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.colors.map((color) => {
            const checked = filters.colors.includes(color);
            return (
              <label
                key={color}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-sm transition-colors ${
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
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-[0.18em] text-charcoal-soft">
          Price
        </legend>
        <div className="mt-4">
          <RangeSlider
            min={options.priceRange[0]}
            max={options.priceRange[1]}
            step={50}
            value={filters.priceRange}
            onChange={onPriceChange}
            formatValue={(v) => formatPrice(v)}
          />
        </div>
      </fieldset>
    </div>
  );
}
