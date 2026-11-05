# Good Ratio: Project Knowledge (applies to every phase)

> Paste this into Lovable → Project Settings → Knowledge. Every build phase assumes it. If anything in a phase prompt conflicts with it, this file wins.

## 1. What we are building

Good Ratio ("the nutrition OS") is a two-sided product on one shared data layer:

- **Consumer app (diners):** people who want to hit a daily calorie and macro target, including when they eat out. They set a personal target at onboarding, log food, find dishes at nearby restaurants that fit what's left of their day, and ask an AI coach questions about their own data.
- **Restaurant Partner Portal (restaurants):** owners and managers upload their existing menu (PDF, photos, or a website link). AI turns it into structured, verified nutrition data with as little effort from them as possible. They confirm only what changes the numbers, then publish.
- **Shared data layer:** one source of truth. When a restaurant publishes or edits a dish, consumers see it live, with no republish step and no copies. Anonymized consumer usage (views, recommendations, logs) flows back to restaurant analytics.

Launch market: Miami. Default units are US (oz, lb, cups, tbsp), with a metric toggle. Default locale is en-US.

### User roles
| Role | Who | Access |
|---|---|---|
| `consumer` | Diner | Consumer app at `/app/*` |
| `restaurant_owner` | Verified owner | Full Partner Portal for their restaurant(s). Can confirm and publish. |
| `restaurant_manager` | Invited by an owner | Same as owner, except billing, team, and deleting the restaurant. Can confirm and publish. |
| `restaurant_staff` | Invited by an owner | Can answer intake questions. **Cannot** confirm or publish (accountability rule). |
| `admin` | Good Ratio team | `/admin`: ownership disputes, user-flag escalations, AI audit log. |

A person can be a consumer and a restaurant member on the same account.

## 2. Tech stack and architecture

- React + TypeScript + Tailwind + shadcn/ui, all on Lovable Cloud (Supabase): Auth, Postgres with Row Level Security on **every** table, Storage, Realtime, and Edge Functions.
- **One project, three surfaces:** `/app` (consumer, mobile-first, installable PWA), `/partner` (restaurant portal, desktop-first and responsive down to tablet), `/admin`. The marketing landing page is at `/`.
- All third-party calls (AI, nutrition DB, places, email, push) go through **Edge Functions**. API keys never reach the client.
- Nutrition values for final numbers come **only** from the nutrition database through the `lookup_food` adapter, never from model memory.
- Every write that changes a dish's nutrition creates an **audit record**: who, when, what changed, and the source.

## 3. Shared data model (Postgres)

Use UUID primary keys, `created_at`/`updated_at` timestamps, and soft delete (`deleted_at`) on user content. Enums are listed inline.

**Identity**
- `profiles`: id (= auth.users.id), display_name, avatar_url, units (`us`|`metric`), timezone, created_at
- `user_roles`: user_id, role (`consumer`|`admin`). Restaurant roles live in `restaurant_members`.

**Consumer**
- `consumer_profiles`: user_id, sex (`male`|`female`|`other`), birth_date, height_cm, weight_kg, activity_level (`sedentary`|`light`|`moderate`|`active`|`very_active`), goal (`lose`|`maintain`|`gain`), goal_weight_kg, target_pace_kg_per_week, target_date, dietary_prefs text[], allergens_to_avoid text[], meal_times jsonb ({breakfast:"08:00", lunch:"13:00", dinner:"19:30", snacks:[]}), eat_out_days_per_week int, eating_out_pain_points text[], acquisition_source, onboarding_completed_at
- `daily_targets`: user_id, effective_from date, kcal, protein_g, carbs_g, fat_g, bmr, tdee, formula_version. A new row is written whenever an input changes. History is kept.
- `weight_logs`: user_id, logged_on, weight_kg
- `food_log_entries`: user_id, logged_at, meal (`breakfast`|`lunch`|`dinner`|`snack`), source (`search`|`barcode`|`manual`|`restaurant_dish`|`coach`), food_id (nullable), dish_id (nullable), dish_version_id (nullable, freezes the numbers at log time), name, servings numeric, kcal, protein_g, carbs_g, fat_g
- `foods`: a cache of nutrition DB results. provider (`fatsecret`|`nutritionix`|`usda`|`off`|`custom`), provider_food_id, barcode, name, brand, serving_desc, serving_g, kcal, protein_g, carbs_g, fat_g, raw_payload jsonb, fetched_at
- `saved_dishes`: user_id, dish_id
- `user_dish_flags`: user_id, dish_id, field (`kcal`|`protein`|`carbs`|`fat`|`portion`|`allergen`|`other`), note, status (`open`|`sent_to_restaurant`|`resolved`|`rejected`)

**Restaurant**
- `restaurants`: name, slug, cuisine, address, lat, lng, google_place_id, phone, website, hours jsonb, logo_url, cover_url, verification_status (`pending`|`verified`|`disputed`), verification_method (`email_domain`|`phone_otp`|`manual`), kitchen_dietary_facts text[] (kosher, halal, dedicated GF area, nut-free kitchen), last_reverified_at
- `restaurant_members`: restaurant_id, user_id, role (`owner`|`manager`|`staff`), invited_by, accepted_at
- `kitchen_profiles`: restaurant_id, weighing_standard (`raw`|`cooked`|`depends`), main_oil, oil_per_portion_tbsp, deep_fry bool, deep_fry_oil, finishing_fat (`never`|`some`|`most`), ladle_oz, sauce_default (`mixed_in`|`on_side`|`depends`), dairy_default (`full_fat`|`low_fat`|`mix`), bought_in text[], completed_at
- `menu_uploads`: restaurant_id, kind (`pdf`|`image`|`url`), storage_paths text[], source_url, status (`uploaded`|`parsing`|`drafted`|`failed`), parse_error, uploaded_by
- `menu_sections`: restaurant_id, name, sort_order
- `dishes`: restaurant_id, section_id, name, description, price_cents, status (`draft`|`needs_action`|`ready`|`published`|`archived`), confidence (`estimated`|`high`|`verified`), scale_checked bool, current_version_id, est_kcal (used for ordering), priority_rank, sizes jsonb, substitutions jsonb, dietary_tags text[] (**only ever set by a restaurant member**), allergen_tags text[] (**same rule**), image_url, published_at
- `dish_versions`: an immutable snapshot of each confirmed or published dish. dish_id, version int, kcal, protein_g, carbs_g, fat_g, confidence, components jsonb, confirmed_by, confirmed_at
- `dish_components`: dish_id, name, role (`protein`|`starch`|`vegetable`|`fat`|`sauce`|`topping`|`bread`|`side`|`drink`), amount, unit, state (`raw`|`cooked`), food_id, source (`restaurant`|`kitchen_profile`|`default`|`label`|`menu_text`), kcal, protein_g, carbs_g, fat_g, shared_component_key (links the "same rice in 6 bowls" case)
- `intake_questions`: restaurant_id, scope (`kitchen`|`dish`|`multi_dish`), dish_ids uuid[], component, text, options jsonb, allow_other, unit, impact_kcal, status (`open`|`answered`|`skipped`), created_by (`ai`|`user_flag`)
- `intake_answers`: the **audit trail**. question_id, answered_by, answered_at, value jsonb, free_text
- `nutrition_labels`: restaurant_id, component_name, image_path, extracted jsonb, applied_to_dish_ids uuid[]
- `spot_checks`: dish_id, image_path, measured_weight_g, result (`pass`|`drift`), reviewed_at
- `action_items`: the unified "Action Needed" queue. restaurant_id, dish_id, kind (`ai_question`|`user_flag`|`outlier`|`reverify`|`label_needed`), ref_id, status (`open`|`done`), priority

**Signals and engagement**
- `dish_events`: dish_id, restaurant_id, event (`impression`|`view`|`recommended`|`logged`|`saved`), user_hash (a salted hash, never the raw user id), occurred_at. Restaurants can read only daily aggregates through a view (`dish_event_daily`), never rows.
- `coach_threads`, `coach_messages`: user_id, role (`user`|`assistant`|`tool`), content, tool_calls jsonb, cited_dish_ids uuid[]
- `notification_prefs`: user_id, frequency (`minimal`|`balanced`|`frequent`), tone (`gentle`|`direct`), quiet_start "21:00", quiet_end "08:00", channels {push, email}, enabled_types text[]
- `notifications`: user_id, type, title, body, deep_link, scheduled_for, sent_at, opened_at, suppressed_reason
- `push_subscriptions`: user_id, endpoint, keys jsonb
- `ownership_disputes`: restaurant_id, claimant_user_id, evidence, status

**Publishing rule (enforced in the database, not just the UI):** consumers can read a dish only when `status = 'published'` and it has no open `action_items` of kind `ai_question` or `outlier`. Use an RLS policy plus a `published_dishes` view. Turn on Realtime for `dishes` and `dish_versions` so the consumer app updates live.

## 4. Integrations
| Need | Integration | Notes |
|---|---|---|
| Auth | Lovable Cloud Auth | Email magic link + Google + Apple sign-in. Phone OTP for restaurant verification. |
| AI (menu parsing, intake assistant, label OCR, coach) | Lovable AI gateway, multimodal model | Reads PDF and image menus. Uses structured JSON output and tool calling. Each use gets its own system prompt. |
| Nutrition data | **FatSecret Platform API**, **Nutritionix API v2** (free trial), **USDA FoodData Central** | All behind one adapter (`lookup_food`, `lookup_barcode`, `parse_food_text`) with **per-use provider order** (below), so any provider can be swapped or dropped. Cache results in `foods` with their `provider`. Check each provider's license for storing and displaying values in-app. |
| Barcode scan | `@zxing/browser` (camera in browser) | Lookup order: Nutritionix UPC, then FatSecret barcode, then Open Food Facts. |

**Provider order by use**
| Use | Order | Why |
|---|---|---|
| Consumer search and logging | Nutritionix instant search, then FatSecret, then USDA | Nutritionix has the strongest branded and chain-restaurant coverage. |
| Consumer plain-language logging ("2 eggs and toast") | Nutritionix `natural/nutrients`. Fallback: the AI splits the text into items, then `lookup_food` | This is Nutritionix's core strength. |
| Barcode | Nutritionix UPC, then FatSecret, then Open Food Facts | |
| Restaurant menu intake (the `lookup_food` tool) | FatSecret, then USDA, then Nutritionix | Needs precise raw, cooked, and fried entries. |

**Nutritionix details.** Base URL `https://trackapi.nutritionix.com/v2`. Headers `x-app-id`, `x-app-key`, and `x-remote-user-id` (send the hashed user id, or `0` in dev). Endpoints: `POST /natural/nutrients`, `GET /search/instant`, `GET /search/item?nix_item_id=|upc=`. Verify these against the current docs before building. Secrets: `NUTRITIONIX_APP_ID`, `NUTRITIONIX_APP_KEY`. Show "Powered by Nutritionix" wherever its data appears, and follow its caching terms. **It runs on a free trial, so build a circuit breaker:** on a 401, 403, or 429 response, or a missing key, skip Nutritionix for 1 hour, fall back to the next provider, and log the event. A per-provider daily usage counter appears in `/admin`. The app must work fully with Nutritionix turned off.
| Places | Google Places API | Restaurant claim and verification, address autocomplete, lat/lng. |
| Location | Browser Geolocation | With a manual city or ZIP fallback. |
| Email | Resend | Verification, team invites, weekly check-in, "menu ready" emails. |
| Push | Web Push (VAPID) from the PWA | Edge Function scheduler on a cron. |
| Analytics | `dish_events` table | No third-party trackers in v1. |

Out of scope for v1 (don't build): payments or billing, POS or ordering integrations, "orders attributed" metrics (we have no order data, so use "times logged" instead), and a native iOS or Android app.

## 5. Design system (source: Good Ratio Brand Guidelines v1.0, mandatory)

Implement these values as Tailwind theme tokens and CSS variables. Don't use raw hex values in components. **Ignore the bright green (#16A34A-style) and the Inter font in the old workflow mockups. The brand guide replaces them.**

### Color
| Token | Hex | Role |
|---|---|---|
| `pine` | #0E3A23 | Primary: brand surfaces, primary buttons, headings, icons on light |
| `sage` | #7DA67D | Secondary: accents, charts, decorative shapes, icons on dark |
| `mint` | #D6E7D6 | Soft background, chips, selected states, chart tracks |
| `cream` | #F8F6EF | Main background |
| `charcoal` | #0F1412 | Body text, dark-mode background |
| `stone` | #C9C7BC | Neutral: borders, dividers, disabled states |
| `white` | #FFFFFF | Card surface on cream (as in the brand guide) |

- **Proportion:** about 60% cream/mint, 30% pine, 10% sage, charcoal, and stone. Screens should feel light and warm, with pine as the confident anchor.
- **Contrast rules (enforce them):** pine on cream (11.8), cream on pine (11.8), and charcoal on cream (17.2) are fine. Pine on sage (4.6) is for **large text only** (≥ 24px, or ≥ 19px bold). **Never** put sage or stone text on cream, and never put charcoal text on pine. Secondary text uses charcoal at 70% opacity, never stone or sage.
- **Functional colors (my addition, because the brand has none; use them only for system states, never for decoration):** `warning` #9A5B00 text on #FBEFD9 (Action Needed), `danger` #A12A1E text on #FBE4E1 (errors, destructive actions). Success uses pine on mint.
- **Dark mode (consumer app):** charcoal background, white/8% surfaces, cream text, sage accents. Cream on charcoal is an approved pairing.

### Typography
- **Satoshi** (Fontshare, self-host the woff2 files) with **Manrope** (Google Fonts) as the fallback. Weights are 400, 500, and 700 only. **Use at most two weights per screen.**
- Scale (desktop / portal): Display 64, Heading 40, Heading 28, Subhead 20 Medium, Body 16 with 25 line height, Eyebrow 12 uppercase with +14% letter-spacing.
- Scale (mobile consumer app, proportional): Display 40, H1 28, H2 22, Subhead 18 Medium, Body 16/25, Small 14/20, Eyebrow 12 +14%.
- **Numbers are heroes.** Calories and macros use Bold and tabular numerals, and appear larger than their labels ("**45g protein · 520 cal**").
- No italics, serifs, scripts, or all-caps headlines. Only eyebrows are uppercase. Use sentence case everywhere.

### Spacing, radius, elevation (the brand guide doesn't specify these, so they're derived from its layouts)
- 4px base on an 8-point scale: 4, 8, 12, 16, 24, 32, 48, 64. Mobile side gutter 16px. Portal content max width 1280, gutter 24 to 32.
- Radius: cards and sheets 16px, inputs and buttons 12px, chips and badges fully rounded (pill), app-icon tiles 22%.
- Elevation: flat by default. Cards are white on cream with a 1px stone/60 border. Use one soft shadow (0 8px 24px rgba(15,20,18,0.08)) only for floating sheets and modals.
- Touch targets ≥ 44px. Visible focus ring: 2px pine with a 2px cream offset.

### Iconography and pattern
- **Lucide** icons at 24px with 2px stroke, round caps and joins. Pine on light, sage or cream on dark. Core set: home, utensils (dining), bar-chart (macros), search, heart, calendar, map-pin, settings, plus, user, bookmark, leaf.
- **Brand pattern:** quarter-circles, half-circles, and leaf shapes in pine, sage, mint, and charcoal. Use it for empty states, onboarding hero areas, splash, end cards, and the portal login. **Never put it behind body text.** The hero corner motif is a large quarter-circle in sage with a mint inner quarter-circle in the top-right corner, as on the cover and templates.

### Logo
- Use the official SVG files I upload (`/public/brand/`): **stacked** (primary, for splash and onboarding), **horizontal** (nav bars, headers, footers), and the **"g" icon** (app icon, favicon, avatar, PWA icon).
- **Never retype the logo in a font. Never stretch, recolor it sage or mint, add effects, or rotate it.** Approved pairings: pine on cream, cream on pine, pine on mint, cream on charcoal.
- Clear space equals the height of the "o" in "good". Minimum sizes: stacked 64px, horizontal 96px, icon 16px.
- Until the files are uploaded, use an empty pine rounded-square placeholder. Don't use a text placeholder.

### Photography
Natural daylight, warm limestone, travertine, and linen, a green foliage backdrop, real abundant food, shallow depth of field, a muted warm grade, and space for copy. Never use flash or neon, diet clichés (scales, tape measures, before/after), fast-food styling, glossy 3D, or AI-generated text or logos.

### Core components (build once, reuse everywhere)
- **Button:** primary is pine filled with cream text. Secondary is a white fill with a 1px pine border and pine text. Ghost is pine text only. The destructive style uses the danger color. Height 48 on mobile, 40 in the portal.
- **Chip/Tag:** pill shape. Mint fill with pine text by default. Selected is pine fill with cream text. Macro chips read like "520 cal" (pine fill) and "45g protein" (mint).
- **Tap-option group:** the answer control for all onboarding and intake questions. Three or four large pill or row options, the recommended one preselected with a "Most likely" micro-label, plus "Other", which reveals a text or number input with a unit selector.
- **Confidence badge:** **Verified by restaurant** (pine fill, cream text, check icon), **High confidence** (mint fill, pine text), **Estimated** (white fill, stone border, charcoal text, info icon). An optional **Scale-checked** dot appears alongside Verified.
- **Calorie ring:** pine progress on a mint track, with the hero number in the center ("1,490" over "of 2,400").
- **Macro bars:** protein in pine, carbs in sage, fat in charcoal, each on a mint track with "62g left" labels.
- **Dish card:** photo (or a pattern fallback), name, restaurant · distance, a macro chip row, confidence badge, and a fit score ("93% fit").
- **Progress bar** (menu verified, onboarding): pine on mint, with the text label "12 of 30 dishes verified".
- **Bottom sheet** (mobile), **Dialog** (portal), **Toast** (pine), **Empty state** (pattern + one sentence + one action), **Skeleton loaders** (mint shimmer).

### Voice and copy
Short, confident, warm, a little witty. Numbers first. Never shame, use fear, or say "cheat meal". At most one emoji, and none in the product UI. Examples: "Exact macros. Zero guessing." · "Order the bowl. Skip the guesswork." Never: "Guilt-free!!!", "Burn it off", "clean vs. dirty food". Use "dish", "meal", and "target". Avoid "diet".

## 6. Non-negotiable product rules
1. **Allergen and dietary tags come only from a restaurant member's explicit answer.** AI never infers or assigns them. Consumers always see "Confirm allergens with staff" next to any tag.
2. **No health or medical claims**, anywhere: dishes, the coach, or notifications.
3. **A consumer's flag never changes a published value.** It creates an `action_items` entry for the restaurant.
4. **Nothing publishes while it has open AI questions or outliers.**
5. **Every nutrition value is traceable** to its answer, the kitchen profile, a default, a label, or the menu text.
6. Accessibility: WCAG 2.2 AA, full keyboard support in the portal, screen-reader labels on rings and charts ("1,490 of 2,400 calories eaten").
