import { SORT_LABELS, type CatalogFilters } from "./filters";
import type { FilterOptions, SortOption } from "./types";

type RawSearchParams = { [key: string]: string | string[] | undefined };

function getParam(params: RawSearchParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseRange(param: string | undefined, bounds: [number, number]): [number, number] {
  if (!param) return bounds;
  const [minStr, maxStr] = param.split("-");
  const min = Number(minStr);
  const max = Number(maxStr);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return bounds;
  // Clamp to the catalog's actual bounds so a hand-edited URL can never put
  // the slider (or the filter) outside a range it can visually represent.
  const clampedMin = Math.max(bounds[0], Math.min(min, bounds[1]));
  const clampedMax = Math.min(bounds[1], Math.max(max, bounds[0]));
  return clampedMin <= clampedMax ? [clampedMin, clampedMax] : bounds;
}

function isSortOption(value: string | undefined): value is SortOption {
  return !!value && value in SORT_LABELS;
}

/** Reads filters/sort out of the page's (server-parsed) search params,
 * falling back to the full catalog range for anything unset or invalid. */
export function parseFiltersFromParams(
  params: RawSearchParams,
  options: FilterOptions
): { filters: CatalogFilters; sort: SortOption } {
  const shapesParam = getParam(params, "shape");
  const colorsParam = getParam(params, "color");

  return {
    filters: {
      shapes: shapesParam ? shapesParam.split(",").filter(Boolean) : [],
      colors: colorsParam ? colorsParam.split(",").filter(Boolean) : [],
      caratRange: parseRange(getParam(params, "carat"), options.caratRange),
    },
    sort: isSortOption(getParam(params, "sort")) ? (getParam(params, "sort") as SortOption) : "relevance",
  };
}

/** Serializes filters/sort back to query params, omitting anything at its
 * default value so shareable URLs stay short and clean. */
export function buildSearchParams(
  filters: CatalogFilters,
  sort: SortOption,
  options: FilterOptions
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.shapes.length > 0) params.set("shape", filters.shapes.join(","));
  if (filters.colors.length > 0) params.set("color", filters.colors.join(","));

  if (
    filters.caratRange[0] !== options.caratRange[0] ||
    filters.caratRange[1] !== options.caratRange[1]
  ) {
    params.set("carat", `${filters.caratRange[0]}-${filters.caratRange[1]}`);
  }

  if (sort !== "relevance") params.set("sort", sort);

  return params;
}
