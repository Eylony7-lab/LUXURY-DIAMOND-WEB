import Papa from "papaparse";
import { REQUIRED_DIAMOND_COLUMNS, type DiamondCsvRow, type Diamond } from "./types";

type ParseResult = {
  diamonds: Omit<Diamond, "images">[];
  warnings: string[];
};

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim() === "";
}

/**
 * Parses raw diamond CSV text into typed, validated records.
 * Malformed rows (missing required fields, non-numeric carat/price) are
 * skipped and reported in `warnings` rather than throwing, so a handful of
 * bad rows in a large real-world export never take the whole catalog down.
 */
export function parseDiamondsCsv(csvText: string): ParseResult {
  const { data, errors } = Papa.parse<DiamondCsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const warnings: string[] = errors.map(
    (e) => `CSV parse error at row ${e.row ?? "?"}: ${e.message}`
  );

  const missingColumns = REQUIRED_DIAMOND_COLUMNS.filter(
    (col) => data.length > 0 && !(col in data[0])
  );
  if (missingColumns.length > 0) {
    warnings.push(
      `CSV is missing required column(s): ${missingColumns.join(", ")}. ` +
        `Rows may be skipped or incomplete.`
    );
  }

  const diamonds: Omit<Diamond, "images">[] = [];
  const seenSkus = new Set<string>();

  data.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for header row, +1 for 1-based indexing
    const missing = REQUIRED_DIAMOND_COLUMNS.filter((col) => isBlank(row[col]));

    if (missing.length > 0) {
      warnings.push(
        `Row ${rowNumber} (sku="${row.sku ?? "?"}") skipped: missing value(s) for ${missing.join(", ")}.`
      );
      return;
    }

    const sku = row.sku.trim();
    if (seenSkus.has(sku)) {
      warnings.push(`Row ${rowNumber} skipped: duplicate sku "${sku}".`);
      return;
    }

    const carat = Number(row.carat);
    const price_usd = Number(row.price_usd);

    if (!Number.isFinite(carat) || carat <= 0) {
      warnings.push(`Row ${rowNumber} (sku="${sku}") skipped: invalid carat "${row.carat}".`);
      return;
    }
    if (!Number.isFinite(price_usd) || price_usd <= 0) {
      warnings.push(
        `Row ${rowNumber} (sku="${sku}") skipped: invalid price_usd "${row.price_usd}".`
      );
      return;
    }

    seenSkus.add(sku);
    diamonds.push({
      sku,
      shape: row.shape.trim(),
      carat,
      color: row.color.trim(),
      clarity: row.clarity.trim(),
      cut: row.cut.trim(),
      price_usd,
      title: row.title.trim(),
      certificate: row.certificate.trim(),
      description: row.description.trim(),
    });
  });

  if (warnings.length > 0) {
    console.warn(
      `[diamonds.csv] ${warnings.length} issue(s) found while parsing:\n` +
        warnings.map((w) => `  - ${w}`).join("\n")
    );
  }

  return { diamonds, warnings };
}
