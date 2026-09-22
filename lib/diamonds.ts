import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parseDiamondsCsv } from "./csv";
import { getDiamondImages } from "./images";
import type { Diamond, FilterOptions } from "./types";

const CSV_PATH = path.join(process.cwd(), "data", "diamonds.csv");

/**
 * Loads, validates and enriches the full diamond catalog from
 * /data/diamonds.csv. Wrapped in React's `cache()` so the CSV is only read
 * and parsed once per request/build, no matter how many server components
 * call it.
 */
export const getAllDiamonds = cache((): Diamond[] => {
  const csvText = fs.readFileSync(CSV_PATH, "utf-8");
  const { diamonds } = parseDiamondsCsv(csvText);

  return diamonds.map((diamond) => ({
    ...diamond,
    images: getDiamondImages(diamond.sku),
  }));
});

export function getDiamondBySku(sku: string): Diamond | undefined {
  return getAllDiamonds().find((d) => d.sku.toLowerCase() === sku.toLowerCase());
}

/** Derives the available filter ranges/options from the current catalog. */
export function getFilterOptions(diamonds: Diamond[]): FilterOptions {
  if (diamonds.length === 0) {
    return {
      shapes: [],
      colors: [],
      caratRange: [0, 0],
      priceRange: [0, 0],
    };
  }

  const shapes = Array.from(new Set(diamonds.map((d) => d.shape))).sort();
  const colors = Array.from(new Set(diamonds.map((d) => d.color))).sort();
  const carats = diamonds.map((d) => d.carat);
  const prices = diamonds.map((d) => d.price_usd);

  return {
    shapes,
    colors,
    caratRange: [Math.floor(Math.min(...carats) * 100) / 100, Math.ceil(Math.max(...carats) * 100) / 100],
    priceRange: [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))],
  };
}
