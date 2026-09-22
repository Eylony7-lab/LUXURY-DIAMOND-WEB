# Aurelia Diamonds

A luxury diamond catalog web app built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Running it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The site is seeded with 5 sample diamonds
and elegant placeholder photography so it renders correctly out of the box.

```bash
npm run build   # production build (also type-checks)
npm run start   # serve the production build
npm run lint    # eslint
```

## Adding a new diamond

Two things make a diamond appear on the site: a row in the CSV and (optionally) a folder of
photos. No code changes are required.

### 1. Add a row to `data/diamonds.csv`

Required columns, in any order (the header row must be present):

| Column        | Type                    | Notes                                      |
|---------------|-------------------------|---------------------------------------------|
| `sku`         | string, unique          | Also used as the folder name for images and the URL slug (`/diamond/{sku}`). |
| `shape`       | string                  | e.g. `Round`, `Oval`, `Emerald`, `Cushion`, `Pear`. Feeds the Shape filter. |
| `carat`       | number                  | e.g. `1.51`.                                |
| `color`       | string                  | e.g. `D`, `E`, `F`. Feeds the Color filter.  |
| `clarity`     | string                  | e.g. `VVS1`, `VS2`.                         |
| `cut`         | string                  | e.g. `Excellent`, `Very Good`.               |
| `price_usd`   | number                  | e.g. `28450` (no `$` or commas).            |
| `title`       | string                  | Display name, e.g. `The Aurelia Round Brilliant`. |
| `certificate` | string                  | e.g. `GIA`.                                  |
| `description` | string                  | Longer copy shown on the detail page. Wrap in quotes if it contains commas. |

Malformed rows (missing required fields, non-numeric `carat`/`price_usd`, duplicate `sku`) are
**skipped, not crashed on** — a warning listing every skipped row and the reason is logged to the
server console when the catalog is loaded.

### 2. Add photos (optional but recommended)

Create a folder named exactly after the SKU under `public/images/diamonds/`, containing up to six
JPEGs numbered `1.jpg` through `6.jpg`:

```
public/images/diamonds/RD-10234/1.jpg
public/images/diamonds/RD-10234/2.jpg
public/images/diamonds/RD-10234/3.jpg
```

The site only renders the numbered slots that actually exist — a diamond with 3 photos works
exactly like one with 6, and a diamond with zero photos falls back to a "no image available"
placeholder instead of a broken image.

## Importing your real catalog

Replace `data/diamonds.csv` with your export (keep the same column names) and drop your photos
into `public/images/diamonds/{sku}/`. Restart the dev server (or rebuild) and the new catalog
loads automatically — nothing else to configure. The placeholder images generated for the seed
diamonds (`scripts/generate-placeholder-images.mjs`) can be deleted once real photography is in
place.

## Folder structure

```
app/
  page.tsx                 Catalog page (server component: loads + passes data)
  diamond/[sku]/page.tsx   Diamond detail page (SSG via generateStaticParams)
  layout.tsx               Root layout: fonts, Header, Footer, global metadata
  not-found.tsx            404 page
  globals.css              Tailwind v4 theme tokens (colors, fonts) + small custom CSS

components/
  Header.tsx, Footer.tsx
  DiamondCard.tsx          Catalog grid item
  CatalogClient.tsx        Client-side filtering/sorting/infinite scroll + URL sync
  FilterPanel.tsx          Shape/carat/color/price filter controls
  FilterDrawer.tsx         Mobile slide-over wrapper around FilterPanel
  RangeSlider.tsx          Dual-thumb range slider (carat, price)
  SortDropdown.tsx
  ImageGallery.tsx         Detail-page carousel, thumbnails, click-to-zoom
  SpecTable.tsx
  InquireButton.tsx        "Inquire" CTA + contact form modal
  EmptyState.tsx           "No diamonds match" state

lib/
  types.ts                 Diamond type + shared types
  csv.ts                   CSV parsing + row validation (skips/warns on bad rows)
  images.ts                Detects which of the 6 image slots exist per SKU
  diamonds.ts              Cached loader combining csv.ts + images.ts; filter option helpers
  filters.ts                Filtering/sorting logic shared by the catalog page
  urlFilters.ts             Filters <-> URL query string (de)serialization
  format.ts, blur.ts        Small display helpers

data/
  diamonds.csv              Source of truth for the catalog

public/images/diamonds/{sku}/1.jpg..6.jpg   Product photography

scripts/
  generate-placeholder-images.mjs   One-off script that generated the seed placeholder photos
```

## Notes on implementation choices

- **Data loading**: the CSV is parsed server-side (`lib/diamonds.ts`, via `React.cache`) rather
  than through an API route — with a static file as the source of truth this keeps things simple
  and fast, and the catalog page (`app/page.tsx`) is the single place that reads it.
- **Filtering/sorting/pagination**: implemented client-side in `CatalogClient.tsx` against the
  full (already-loaded) dataset. At the current +/-1,000 item scale this is instant and avoids a
  round trip on every filter change; filters and sort are synced to the URL (debounced) so views
  stay shareable and bookmarkable, and reloading from a shared link restores the exact state.
- **Infinite scroll**: an `IntersectionObserver` on a sentinel element reveals results in batches
  of 24 as the user scrolls.
- **Inquire CTA**: currently a client-side form that shows a confirmation but does not send
  anywhere — see the `TODO` in `components/InquireButton.tsx` for wiring it to a real backend/CRM
  (e.g. an API route that emails the concierge team or forwards to a CRM like HubSpot/Salesforce).
- **Header contact info**: the phone number and WhatsApp link in `components/Header.tsx` and
  `components/Footer.tsx` are placeholders — replace with the real business numbers.
