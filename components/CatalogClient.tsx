"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import DiamondCard from "./DiamondCard";
import FilterBar from "./FilterBar";
import EmptyState from "./EmptyState";
import { applyFilters, sortDiamonds, type CatalogFilters } from "@/lib/filters";
import { buildSearchParams, parseFiltersFromParams } from "@/lib/urlFilters";
import type { Diamond, FilterOptions, SortOption } from "@/lib/types";

const BATCH_SIZE = 24;

export default function CatalogClient({
  diamonds,
  options,
  initialSearchParams,
}: {
  diamonds: Diamond[];
  options: FilterOptions;
  initialSearchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const initial = useMemo(
    () => parseFiltersFromParams(initialSearchParams, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [filters, setFilters] = useState<CatalogFilters>(initial.filters);
  const [sort, setSort] = useState<SortOption>(initial.sort);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => applyFilters(diamonds, filters), [diamonds, filters]);
  const sorted = useMemo(() => sortDiamonds(filtered, sort), [filtered, sort]);

  // Reset pagination whenever the result set changes shape. Adjusting state
  // during render (rather than in an effect) avoids an extra render pass —
  // see https://react.dev/learn/you-might-not-need-an-effect
  const resultsKey = `${filters.shapes.join(",")}|${filters.colors.join(",")}|${filters.caratRange.join("-")}|${sort}`;
  const [lastResultsKey, setLastResultsKey] = useState(resultsKey);
  if (resultsKey !== lastResultsKey) {
    setLastResultsKey(resultsKey);
    setVisibleCount(BATCH_SIZE);
  }

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const activeCount =
    filters.shapes.length +
    filters.colors.length +
    (filters.caratRange[0] !== options.caratRange[0] || filters.caratRange[1] !== options.caratRange[1] ? 1 : 0);

  // Keep the URL in sync (debounced) so views stay shareable/bookmarkable.
  useEffect(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const params = buildSearchParams(filters, sort, options);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  // Infinite scroll: reveal more diamonds as the sentinel enters view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + BATCH_SIZE, sorted.length));
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, sorted.length]);

  function toggleShape(shape: string) {
    setFilters((f) => ({
      ...f,
      shapes: f.shapes.includes(shape) ? f.shapes.filter((s) => s !== shape) : [...f.shapes, shape],
    }));
  }

  function toggleColor(color: string) {
    setFilters((f) => ({
      ...f,
      colors: f.colors.includes(color) ? f.colors.filter((c) => c !== color) : [...f.colors, color],
    }));
  }

  function clearFilters() {
    setFilters({
      shapes: [],
      colors: [],
      caratRange: options.caratRange,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <FilterBar
        options={options}
        filters={filters}
        sort={sort}
        onSortChange={setSort}
        onToggleShape={toggleShape}
        onToggleColor={toggleColor}
        onCaratChange={(range) => setFilters((f) => ({ ...f, caratRange: range }))}
        onClear={clearFilters}
        activeCount={activeCount}
        resultCount={sorted.length}
      />

      {visible.length === 0 ? (
        <EmptyState onClear={clearFilters} />
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((diamond) => (
              <DiamondCard key={diamond.sku} diamond={diamond} />
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-12">
              <span className="text-xs uppercase tracking-widest text-charcoal-soft">
                Loading more…
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
