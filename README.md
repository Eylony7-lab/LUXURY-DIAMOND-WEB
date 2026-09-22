# X GEM

A luxury diamond catalog web app built with Next.js (App Router), TypeScript, and Tailwind CSS.

Designed as an **in-store presentation tool**: it's meant to run on an iPad kept at a retail
counter, letting a store owner show customers stones from this catalog that they wouldn't
otherwise have access to. Accordingly, **the site never displays our `price_usd` from the CSV** —
each store rep can tap "Set Your Price" on a diamond's detail page and type in whatever price
they want to quote, saved locally on that device (see "Pricing model" below).

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
| `price_usd`   | number                  | e.g. `28450` (no `$` or commas). Internal record only — **never shown on the site**; see "Pricing model" below. |
| `title`       | string                  | Display name, e.g. `The Aurelia Round Brilliant` (the seed sample's naming style — pick your own). |
| `certificate` | string                  | e.g. `GIA`.                                  |
| `description` | string                  | Longer copy shown on the detail page. Wrap in quotes if it contains commas. |

Malformed rows (missing required fields, non-numeric `carat`/`price_usd`, duplicate `sku`) are
**skipped, not crashed on** — a warning listing every skipped row and the reason is logged to the
server console when the catalog is loaded.

### 2. Add photos and/or a video (optional but recommended)

Create a folder named exactly after the SKU under `public/images/diamonds/`, containing up to six
JPEGs numbered `1.jpg` through `6.jpg`, and optionally one `video.mp4` (a turntable/fire clip):

```
public/images/diamonds/RD-10234/1.jpg
public/images/diamonds/RD-10234/2.jpg
public/images/diamonds/RD-10234/3.jpg
public/images/diamonds/RD-10234/video.mp4
```

The site only renders the numbered slots (and the video) that actually exist — a diamond with 3
photos and no video works exactly like one with 6 photos and a video, and a diamond with no media
at all falls back to a "no image available" placeholder instead of a broken image. When present,
the video appears as an extra, playable thumbnail at the end of the gallery strip.

## Pricing model

The catalog and detail pages never render `price_usd` — no price filter, no price sort, no price
anywhere in the customer-facing UI. Instead, the diamond detail page has a **"Your Price"**
control (`components/StorePriceTag.tsx`) that lets whoever is holding the iPad type in a price on
the spot. It's saved to that browser's `localStorage`, keyed by SKU — so:

- It persists across reloads on that same iPad (the store rep sets it once per stone).
- It is **not** synced anywhere — a different device (or a different store) starts blank and can
  set its own price for the same diamond.
- There is no backend and no admin view for it by design; it's a lightweight per-device quoting
  aid, not a pricing database. If you later want prices set centrally, shared across devices, or
  tied to real accounts, that needs a real backend (see the Inquire CTA note below for the same
  caveat).

## Pending stones awaiting specs

`public/images/diamonds/STONE-01` through `STONE-05` already contain real photo+video pairs
(uploaded, not placeholders) for five diamonds whose specs haven't been entered yet. Once you
send the shape/carat/color/clarity/cut/certificate/description for each, add a matching row to
`data/diamonds.csv` — reusing the `STONE-0N` SKUs (or renaming both the CSV `sku` and the image
folder to a real SKU/stock number, if you have one) — and they'll appear on the site immediately.

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
  DiamondCard.tsx          Catalog grid item (shape/carat/color/clarity — no price)
  CatalogClient.tsx        Client-side filtering/sorting/infinite scroll + URL sync
  FilterPanel.tsx          Shape/carat/color filter controls
  FilterDrawer.tsx         Mobile slide-over wrapper around FilterPanel
  RangeSlider.tsx          Dual-thumb range slider (carat)
  SortDropdown.tsx
  ImageGallery.tsx         Detail-page carousel, thumbnails, click-to-zoom
  SpecTable.tsx
  StorePriceTag.tsx        "Your Price" control — store rep enters a price, saved per-SKU in localStorage
  InquireButton.tsx        "Inquire" CTA + contact form modal
  EmptyState.tsx           "No diamonds match" state

lib/
  types.ts                 Diamond type + shared types
  csv.ts                   CSV parsing + row validation (skips/warns on bad rows)
  images.ts                Detects which of the 6 image slots (+ video.mp4) exist per SKU
  diamonds.ts              Cached loader combining csv.ts + images.ts; filter option helpers
  filters.ts                Filtering/sorting logic shared by the catalog page
  urlFilters.ts             Filters <-> URL query string (de)serialization
  site.ts                   Business details (name, phone, WhatsApp, email, hours) — edit here
  format.ts, blur.ts        Small display helpers

data/
  diamonds.csv              Source of truth for the catalog

public/images/diamonds/{sku}/1.jpg..6.jpg, video.mp4   Product photography + video

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
- **Business details**: name, phone, WhatsApp, email and hours all live in one place —
  `lib/site.ts` — and are used by the header, footer and page metadata. Edit that file to change
  any of them site-wide.
