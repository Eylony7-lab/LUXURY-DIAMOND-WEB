/** A single diamond record, parsed from /data/diamonds.csv and enriched
 * with the list of product image paths that actually exist on disk. */
export type Diamond = {
  sku: string;
  shape: string;
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  price_usd: number;
  title: string;
  certificate: string;
  description: string;
  /** Public paths of the images that exist for this SKU, in order (1.jpg..6.jpg). */
  images: string[];
  /** Public path to this SKU's video.mp4, if one exists. */
  video: string | null;
};

/** Raw shape of a CSV row before validation/coercion. */
export type DiamondCsvRow = Record<string, string>;

export const REQUIRED_DIAMOND_COLUMNS = [
  "sku",
  "shape",
  "carat",
  "color",
  "clarity",
  "cut",
  "price_usd",
  "title",
  "certificate",
  "description",
] as const;

export type SortOption = "relevance" | "carat-asc" | "carat-desc";

export type FilterOptions = {
  shapes: string[];
  colors: string[];
  caratRange: [number, number];
};
