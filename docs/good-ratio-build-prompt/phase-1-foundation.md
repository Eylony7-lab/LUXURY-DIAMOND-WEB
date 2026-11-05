# Phase 1: Foundation (design system, auth, shared data layer, nutrition adapter)

> Paste as the first message. It assumes the Project Knowledge file is loaded. Don't build any product screens beyond what's listed here.

Build the foundation for **Good Ratio**, a two-sided nutrition product: a consumer app at `/app` and a restaurant Partner Portal at `/partner`, both on one shared Lovable Cloud (Supabase) backend. Follow the Project Knowledge exactly, especially the design system and the data model.

## 1. Design system first
1. Add the brand tokens to the Tailwind config and CSS variables: pine #0E3A23, sage #7DA67D, mint #D6E7D6, cream #F8F6EF, charcoal #0F1412, stone #C9C7BC, white, plus the functional warning and danger colors. Set `body` to the cream background with charcoal text. Add a dark theme (charcoal background, cream text) for `/app` only.
2. Load Satoshi from Fontshare (weights 400/500/700) with Manrope as the fallback. Build the two type scales (portal and mobile) as utility classes: `text-display`, `text-h1`, `text-h2`, `text-subhead`, `text-body`, `text-small`, `text-eyebrow`. Turn on `font-variant-numeric: tabular-nums` for all numeric UI.
3. Restyle the shadcn primitives to match the brand: Button (primary, secondary, ghost, destructive), Input, Select, Checkbox, Switch, Tabs, Dialog, Sheet, Toast, Tooltip, Card, Badge, Skeleton. Use the radii from the knowledge file (cards 16, controls 12, chips pill) and the 2px pine focus ring.
4. Build these custom components with Storybook-style demo routes at `/dev/components`: TapOptionGroup, ConfidenceBadge (verified, high, estimated, plus the optional scale-checked dot), MacroChip, CalorieRing, MacroBars, DishCard, ProgressBar, EmptyState, and BrandPattern. BrandPattern is an SVG of quarter-circles, half-circles, and leaves, with a corner-motif variant. Use Lucide icons with stroke 2.
5. Add a Logo component with three variants: stacked, horizontal, and icon. It renders the SVGs from `/public/brand/` and shows a pine rounded-square placeholder until they exist. It must never render text as the logo.

## 2. Auth and roles
- Lovable Cloud Auth with email magic link, Google, and Apple. After sign-in, route by intent: links in the consumer flow go to `/app`, and "For restaurants" sign-ups go to `/partner`.
- Create the `profiles` and `user_roles` tables, plus a trigger that creates a profile on sign-up.
- Add route guards for `/app` (any signed-in user), `/partner` (a member of at least one restaurant, otherwise send them to `/partner/claim`), and `/admin` (the admin role).

## 3. Database
Create **every table, enum, index, and view in Project Knowledge §3**, including `published_dishes` and `dish_event_daily`, now, even if later phases use them. Requirements:
- RLS on every table. Consumers read and write only their own rows. Restaurant members read and write only rows for restaurants they belong to. Only `owner` and `manager` can set a dish to `published` or write `dish_versions` (enforce this with a policy or a security-definer function `publish_dish(dish_id)`). Consumers read dishes only through `published_dishes`.
- `dish_events` can be inserted by any signed-in user through an Edge Function that hashes the user id with a server-side salt. Restaurants can read only `dish_event_daily`.
- Turn on Realtime for `dishes`, `dish_versions`, and `action_items`.
- Add Storage buckets: `menus` (private, restaurant-scoped), `labels` (private), `spot-checks` (private), `dish-images` (public read), and `avatars`.
- Seed data: one demo restaurant in Miami ("Zest Kitchen") with eight published dishes across three confidence levels, and one demo consumer. Use these only in development.

## 4. Nutrition adapter (Edge Functions)
- `lookup_food`: input `{ query, state?: 'raw'|'cooked', method?: 'grilled'|'fried'|..., lean_ratio?, skin?: boolean }`. Queries FatSecret first and USDA FoodData Central as a fallback, normalizes everything to per-100 g plus serving options, caches the result in `foods`, and returns the top five candidates with the provider and id.
- `lookup_barcode`: input `{ code }`. Checks FatSecret first, then Open Food Facts, and caches the result.
- `convert_portion`: converts between oz, cup, tbsp, tsp, and g using the database's serving data for that food. Raw-to-cooked conversion only uses the database's raw and cooked entries, never a fixed ratio.
- Put the secrets in Lovable Cloud secrets: `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET`, `USDA_FDC_API_KEY`. Ask me for them when you need them.
- Write a small test page at `/dev/nutrition` that searches, shows raw vs. cooked entries side by side, and scans a barcode with `@zxing/browser`.

## 5. Shell layouts (no feature content yet)
- `/app`: mobile layout (max width 480 centered on desktop) with a bottom tab bar: **Today** (home), **Discover** (utensils), **Log** (center plus button), **Coach** (message-circle), **Me** (user). Logo-horizontal top bar on Today only. PWA manifest using the "g" icon, theme color pine, background cream.
- `/partner`: desktop layout with a pine top bar showing the horizontal logo in cream, a restaurant switcher, a "+ Dish" primary action, and tabs for **Dashboard**, **Menu**, **Action Needed** (with a count badge in the warning color), **Analytics**, and **Settings**. Collapse to a drawer below 1024px.
- `/`: a simple brand landing page, following the brand templates. It has a pine hero with "Better food choices. A healthier you." and the corner quarter-circle motif, plus two CTAs: "Get the app" (to `/app`) and "For restaurants" (to `/partner`).

**Done when:** tokens and components render correctly at `/dev/components` in light and dark, auth works for all three surfaces, every table exists with RLS, the nutrition test page returns real FatSecret data, and nothing in the UI uses a color or font outside the brand system.
