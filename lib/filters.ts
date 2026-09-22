import type { Diamond, SortOption } from "./types";

export type CatalogFilters = {
  shapes: string[];
  colors: string[];
  caratRange: [number, number];
};

export function applyFilters(diamonds: Diamond[], filters: CatalogFilters): Diamond[] {
  return diamonds.filter((d) => {
    if (filters.shapes.length > 0 && !filters.shapes.includes(d.shape)) return false;
    if (filters.colors.length > 0 && !filters.colors.includes(d.color)) return false;
    if (d.carat < filters.caratRange[0] || d.carat > filters.caratRange[1]) return false;
    return true;
  });
}

export function sortDiamonds(diamonds: Diamond[], sort: SortOption): Diamond[] {
  const sorted = [...diamonds];
  switch (sort) {
    case "carat-asc":
      return sorted.sort((a, b) => a.carat - b.carat);
    case "carat-desc":
      return sorted.sort((a, b) => b.carat - a.carat);
    case "relevance":
    default:
      return sorted;
  }
}

export const SORT_LABELS: Record<SortOption, string> = {
  relevance: "Most Relevant",
  "carat-asc": "Carat: Low to High",
  "carat-desc": "Carat: High to Low",
};
