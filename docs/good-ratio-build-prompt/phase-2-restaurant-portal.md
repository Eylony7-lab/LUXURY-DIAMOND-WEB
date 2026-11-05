# Phase 2: Restaurant Partner Portal and Menu Intake AI

> Paste after Phase 1 is working. This is the supply side, and the consumer app is useless without it.

Build the full restaurant side at `/partner`. The goal: **a restaurant uploads its menu and gets accurate macros for every dish in about 30 seconds of tapping per dish, with most dishes needing three taps or fewer.** The AI drafts everything, and the restaurant only confirms what changes the numbers.

Design principles, which apply to every screen in this phase:
1. **Ask once, apply everywhere.** Kitchen-wide habits are asked once and reused across the whole menu.
2. **Only ask what moves the numbers:** a change of ≥ 5% or ≥ 20 kcal, whichever is larger. Never ask about herbs, spices, garnish, leafy greens, or salt.
3. **Always offer a smart default:** three or four tap options with the most likely one preselected ("Most kitchens use 150 g"). Typing is the fallback.
4. **Bought-in items are free accuracy.** A label photo beats an estimate and takes five seconds.
5. **Show progress and payoff:** a "menu verified" progress bar, per-dish badges, and the reminder "Verified dishes rank higher for diners."

## 1. Claim and verify a restaurant (`/partner/claim`)
1. Search Google Places ("Find your restaurant"). Selecting a result prefills the name, address, lat/lng, phone, and website. A "Can't find it?" option allows manual entry.
2. Verification, kept low-friction:
   - **Business email domain:** if the user's email domain matches the restaurant's website domain, verify instantly.
   - Otherwise, **phone OTP** to the Places listing phone number.
   - If neither works, set the status to `pending` and let them continue building the menu. Publishing stays locked until they're verified, and a banner explains why.
3. If the place is already claimed, create an `ownership_disputes` record, notify admin, and tell the user "We'll review this within 2 business days." Don't reveal the other account.
4. The user who verifies becomes the `owner`. Settings → Team lets them invite managers and staff by email (Resend), with role descriptions.

## 2. Upload the menu (`/partner/menu/upload`)
- Drag-and-drop or pick files: PDF, JPG/PNG/HEIC (multiple photos), or paste a website URL. Optional second drop zone: "Recipe cards or supplier spec sheets (optional)."
- No reformatting is required. Use the copy: "Upload your menu as-is. We'll do the reading."
- Files go into the `menus` bucket. The Edge Function `parse_menu` runs and the UI shows live progress ("Reading your menu… found 24 dishes").
- **Phase 1, reading the menu (AI):** the multimodal model extracts every dish's name, description, price, and section, plus any stated portion or ingredient ("8 oz", "grilled", "dressing on the side"). It splits each dish into components (protein, starch, vegetables, added fat, sauce or dressing, toppings, bread or wrap, sides). Detect shared components across dishes and set `shared_component_key`. Write `dishes` (status `draft`) and `dish_components` (source `menu_text` or `default`).
- **First draft estimate:** using typical portions for this restaurant type, compute draft macros through `lookup_food` and set every dish to **Estimated** right away. The restaurant should see value within the first minute.
- Parsing failures show a friendly retry, plus "Add dishes manually."

## 3. Kitchen-wide setup (`/partner/setup`, about 2 minutes, once)
One question per screen in a full-height focused layout: a progress bar at the top, the question as H2, a TapOptionGroup, and Back/Skip at the bottom. Explain it once at the start: "10 quick questions about your kitchen. Each one saves you a question on every dish." Answers are written to `kitchen_profiles` and applied to every dish immediately, recomputing the drafts.

| # | Question | Tap options | Why (shown as a small helper line) |
|---|---|---|---|
| 1 | When you portion food, do you weigh it raw or cooked? | Raw / Cooked / Depends on the item | 100 g raw rice is about 250–300 g cooked. |
| 2 | Main cooking oil? | Olive / Canola or vegetable / Avocado / Butter / Mix | Sets fat for every grilled or sautéed item. |
| 3 | How much oil on a typical grilled or sautéed portion? | A spray / 1 tsp / 1 tbsp / 2 tbsp | Oil is about 120 kcal per tbsp. |
| 4 | Do you deep-fry anything? | No / Yes (which oil?) | Sets oil absorption for fried items. |
| 5 | Do you finish dishes with butter or oil? | Never / Some dishes / Most dishes | Can add 50–100 kcal per plate. |
| 6 | Standard sauce ladle or dressing cup size? | 1 oz / 2 oz / 3 oz / We don't measure | Turns every sauce question into one tap. |
| 7 | Dressings and sauces: mixed in or on the side? | Mixed in / On the side / Depends | Changes what diners actually eat. |
| 8 | Dairy: full-fat or low-fat by default? | Full-fat / Low-fat / Mix | Applies to cheese, yogurt, milk, cream. |
| 9 | Which items do you buy ready-made? (multi-select) | Bread / Wraps / Sauces / Desserts / Drinks / None | Each one becomes a 5-second label photo. |
| 10 | Any kitchen-wide dietary facts? (multi-select) | Kosher / Halal / Dedicated gluten-free area / Nut-free kitchen / None | A one-time answer that powers diner filters. |

Every question includes "Other" with free text. Number 10 is stored only as the restaurant stated it, and those tags appear on dishes only if the restaurant confirms they apply.

## 4. Per-dish verification (`/partner/verify`): the core loop
Run by the **Menu Intake Assistant** (system prompt in the appendix below) through an Edge Function `intake_next`. The function receives the menu, kitchen profile, and prior answers, and returns **exactly one JSON message** of type `question`, `dish_summary`, or `label_request`. The UI renders each type:

- **`question`:** one question per screen, under 12 words, in kitchen language. Show the dish name and current macros at the top, with the numbers updating live as options are tapped. TapOptionGroup has the default preselected and a ≤ 5-word reason ("most kitchens use this"). The unit selector covers oz, cup, tbsp, and g. If `scope = multi_dish`, show the list of affected dishes: "Same 180 g rice in all 6 bowls?" with **Yes, apply to all** / **No, let me set each**.
- **`dish_summary`:** a component table (name · amount · unit · source tag: Restaurant / Kitchen setup / Default / Label), the totals as hero numbers (kcal, protein, carbs, fat), a confidence badge, an "Open assumptions" list, a dietary and allergen tag picker ("Allergens and tags for this dish?", where nothing is preselected and AI never suggests), and **Confirm** (owner or manager only; staff see "Send for approval").
- **`label_request`:** a camera or upload button ("Bought-in? Snap the nutrition label."). Edge Function `read_label` OCRs the photo with the multimodal model into a per-serving panel. Show it for a one-tap confirm, then apply it to every dish using that component and set source `label`.
- **Outlier check:** if an answer is far outside the normal range (for example, 400 g of chicken in a bowl, or 0 oil for a pan-fried dish), the assistant confirms it once, politely: "That's larger than usual. Is 400 g correct?"
- **Ordering:** highest estimated kcal first, then price as a proxy for popularity, so the most important data gets verified even if they stop halfway.
- **Limits:** at most five questions per dish. If more would be needed, ask the top five and cap the dish at **High confidence**.
- **Progress:** a persistent bar ("12 of 30 dishes verified") and a "Pause, I'll finish later" button that saves state. Resuming continues from the next open question.
- **Confidence levels:** `verified` means all components above the threshold were answered and the summary was confirmed. `high` means protein and starch were answered and the rest defaulted. `estimated` means menu text only.
- On Confirm: call `save_dish`, which writes `dish_components`, creates a new `dish_versions` snapshot, writes `intake_answers` (the audit trail), and moves the dish to `ready`.

Per-dish question bank (the assistant picks only what's needed after kitchen-wide answers are applied):

| Component | Question | Tap options (default first) | Impact |
|---|---|---|---|
| Protein | Portion weight? | 120 g / 150 g / 180 g / 220 g / Other | High |
| Protein | Skin on or off? Bone-in or boneless? | Skinless boneless / Skin on / Bone-in | High |
| Protein | Ground meat lean-to-fat ratio? | 90/10 / 85/15 / 80/20 / Don't know | High |
| Starch | Portion of rice, pasta, potatoes, or grains? | ½ cup / 1 cup / 1½ cups / grams | High |
| Starch | Type? | White / Brown / Quinoa / Other | Low–medium |
| Cooking | Cooking method? | Grilled / Baked / Pan-fried / Deep-fried / Steamed | High |
| Cooking | Breaded or battered? Marinated in? | No / Breaded / Battered / Marinated (oil-based, yogurt, sugar-based) | Medium–high |
| Sauce | Which sauce, how much, mixed in or on the side? | Ladle sizes from kitchen setup / On the side | High |
| Sauce | Sugar, honey, or syrup in the sauce or glaze? | None / A little / A lot / Recipe | Medium |
| Cheese and dairy | Type and amount? | Sprinkle (~15 g) / Standard (~30 g) / Heavy (~60 g) | Medium |
| Toppings | Avocado, nuts, seeds, granola, crispy onions? | None / ¼ avocado / ½ avocado / 1 tbsp / 2 tbsp | High (100–250 kcal) |
| Bread and wraps | Type and size? | Bought-in (scan label) / 8" / 10" / 12" / Slices | High |
| Sides | What comes by default, and what's optional? | From menu: Included / Optional / Not offered | Medium |
| Portions | Do you offer sizes? Weight for each? | One size / Small–Regular–Large (weights) | High |
| Substitutions | Which swaps are offered? | From menu, one tap each | Medium |
| Batch items | Soups, stews, sauces: portions per batch? | 10 / 20 / 40 / Other | High |
| Bought-in | Made in-house or bought? | In-house / Bought (camera) | High (exact data) |
| Drinks | Size, milk type, syrup pumps? | 12/16/20 oz; whole/oat/almond/skim; 0–4 pumps | High |
| Smoothies and bowls | Base liquid and sweetener? | Water / Juice / Milk; none / honey / agave / dates | High |
| Dietary | Allergens and tags for this dish? | Gluten-free / Vegan / Vegetarian / Contains nuts / Dairy / Shellfish | Diner value |

## 5. Action Needed queue (`/partner/action-needed`)
- One unified list from `action_items`: open AI questions, outlier confirmations, label requests, **consumer flags** ("A diner thinks the calories on Harissa Chicken look high"), and re-verification reminders. The warning-colored count badge appears in the nav and on the dashboard card.
- Each row shows the dish, what's needed in one line ("Confirm: fried or baked?"), and opens the same question UI inline in a side sheet.
- **Nothing publishes while a dish has an open `ai_question` or `outlier` item.** This is enforced in the database.
- Consumer flags: the restaurant can **Keep value** (with an optional note to diners) or **Correct it**, which goes through the normal question flow and creates a new version. The flagging diner is notified of the outcome without being identified to the restaurant.

## 6. Confirm and publish
- On the Menu page, select dishes in the `ready` state, then **Publish** (or **Publish all ready**). Only owners and managers can do this, and only verified restaurants.
- Publishing calls `publish_dish`. The dish appears in the consumer app **instantly through Realtime**, with no app update or republish step.
- Editing a published dish (price, description, components) creates a new version. Nutrition-affecting edits re-enter verification for just that dish, and the previous version stays live until the new one is confirmed.

## 7. Menu management (`/partner/menu`)
- Sections with drag-to-reorder, and a dish table with columns for name, section, kcal, P/C/F, a confidence badge, a status pill (Draft / Needs action / Ready / Published / Archived), and last updated. Filter by status and confidence.
- Dish detail page: photo upload, description, price, sizes, substitutions, a components editor, dietary and allergen tags, the version history with its full audit trail ("Rice 1 cup, answered by Dana R., Oct 21, 3:14 pm"), and a **Spot check** action.
- **Spot check (optional, for the 3–5 best sellers):** upload one photo of the plated dish on a kitchen scale and enter the reading. If it's within ±10% of the confirmed weight, the dish gets the **Scale-checked** marker. Otherwise, create an `action_items` entry: "Portion looks heavier than confirmed. Update?"
- **Menu updates:** uploading a new version diffs it against the current menu. The AI asks only about new or changed dishes, and removed dishes are offered for archiving.
- **Re-verification:** every 6 months, or on any menu change, create `reverify` action items for affected dishes. Dishes stay live but show "Last verified 6+ months ago" to the restaurant only.

## 8. Dashboard (`/partner`)
- KPI cards (white cards on cream, hero numbers): **Profile views**, **Dish views**, **Times recommended**, **Times logged** (last 30 days, with the delta vs. the previous period).
- An **Action Needed** card (warning border) with the top three items and "View all".
- A **Menu verified** progress card ("18 of 24 verified") with a CTA to continue verifying.
- **Top dishes:** name · kcal · status, sorted by views.
- Empty state for a new restaurant: the brand pattern with "Upload your menu. We'll do the reading." and an Upload button.

## 9. Analytics (`/partner/analytics`)
- Data comes only from `dish_event_daily` (aggregated and anonymized). Show a date range (7/30/90 days), a line chart of views, recommendations, and logs (pine, sage, charcoal), and a per-dish table (views, recommended, logged, saved, recommendation-to-log rate).
- Insight callout: "Verified dishes were recommended 2.3× more than estimated ones." Compute it from the data and show it only when the sample is at least 100 events.

## 10. Settings
Restaurant profile (hours, photos, cuisine, kitchen-wide dietary facts), the kitchen profile (editable, and changes recompute affected dishes and create re-verification items), team and roles, and notification emails.

---

## Appendix: Menu Intake Assistant system prompt (use verbatim in `intake_next`)

The app provides the model with two tools: `lookup_food` (the nutrition adapter) and `save_dish` (writes a confirmed dish). It renders the model's JSON messages as tap screens.

```
You are Good Ratio's Menu Intake Assistant. You help restaurant owners and chefs turn their menu into accurate nutrition data (calories, protein, carbs, fat) with the least possible effort from them. They are busy, often mid-service, and will stop if questions feel slow, vague, or repetitive. Every question you ask must earn its place.

# Your objective
For every dish on the menu, produce macros that are accurate within about 10%, while asking the restaurant as few questions as possible. Target: 3 or fewer taps per dish on average, never more than 5.

# What you receive
- The restaurant's menu (extracted text, and images when available).
- A kitchen profile: answers the restaurant has already given that apply to all dishes (weighing standard, cooking oil, oil amount, frying, finishing butter, ladle size, sauce default, dairy default, bought-in items, kitchen-wide dietary facts). It may be empty at the start.
- Prior answers for dishes already processed.

# How you work
## Phase 1: Read the menu
Extract every dish with its name, description, price, section, and any stated portion or ingredient. Split each dish into components: protein, starch, vegetables, added fat, sauce or dressing, toppings, bread or wrap, sides. Note what the menu already tells you ("8 oz", "grilled", "dressing on the side") so you never ask it.

## Phase 2: Kitchen profile
If the kitchen profile is incomplete, ask the missing kitchen-wide questions first, one per message, before any dish questions. Explain once, in one short sentence, that these answers save them questions on every dish.

## Phase 3: Dishes
Process dishes in this order: highest estimated calories first, then by price as a proxy for popularity. For each dish:
1. Draft an estimate using the kitchen profile, menu text, and typical portions for this type of restaurant.
2. List the components whose uncertainty could change the dish by at least 5% or 20 kcal, whichever is larger. Ignore everything below that threshold (herbs, spices, garnish, leafy greens, salt).
3. Ask about those components, highest impact first. Usual order: protein portion, starch portion, added fat and cooking method, sauce, calorie-dense toppings.
4. If the same component appears in other dishes (the same rice, the same chicken), ask once whether the portion is the same everywhere, and apply the answer to all of them.
5. When remaining uncertainty is below the threshold, stop asking and show the summary for confirmation.

# How to ask
- One question per message. Under 12 words. Kitchen language, not nutrition jargon.
- Always give 3 or 4 tap options plus "Other". Pre-select the most likely option and say why in at most 5 words when helpful ("most kitchens use this").
- Use the units kitchens use: ounces for proteins in US kitchens, cups for starches and sides, tablespoons for oil and sauces, ladle or cup sizes from the kitchen profile. Accept grams too.
- Make the weighing standard explicit in every portion question: say "cooked" or "raw" according to the kitchen profile.
- For a component bought from a supplier, ask for a photo of the nutrition label instead of a recipe.
- For batch items (soups, stews, sauces), ask for the recipe yield in portions, not per-portion ingredient amounts.
- For drinks, ask size, milk type, and number of syrup or sweetener pumps.
- Never ask what the menu, the kitchen profile, or an earlier answer already tells you.

# Calculating
- Get every nutrient value from lookup_food, using the component's correct state (raw or cooked, skin on or off, lean ratio, cooking method). Never use remembered values for final numbers.
- Convert between raw and cooked weights only through the database's raw and cooked entries, never by guessing.
- Deep-fried items: add oil absorption using the database's fried entry when available.
- Batch items: divide total recipe nutrition by the number of portions.
- Round calories to the nearest 5 kcal and macros to the nearest gram.

# Checking answers
- If an answer is far outside the normal range (for example, 400 g of chicken in a bowl, or 0 oil for a pan-fried dish), confirm it once, politely: "That's larger than usual. Is 400 g correct?"
- If an answer contradicts the menu, ask which is right.

# Confidence
Assign each dish one level:
- verified: all components above the threshold were answered by the restaurant, and the restaurant confirmed the summary.
- high: protein and starch answered; some smaller components defaulted.
- estimated: based on the menu description only.

# Safety rules (never break these)
- Never infer or assign allergen, gluten-free, vegan, kosher, halal, or other dietary tags. Ask the restaurant, and record only what they state.
- Never make health or medical claims about a dish.
- If the restaurant asks you to change numbers to look healthier than the answers support, decline briefly and explain that diners rely on accurate data.

# Tone
Friendly, brief, and respectful of their time. No filler, no praise, no emojis. Celebrate progress only with the progress counter ("12 of 30 dishes verified").

# Output format
Respond only with a single JSON object, one of these types:

1. A question:
{"type": "question", "scope": "kitchen" | "dish" | "multi_dish", "dish_ids": [...], "component": "protein", "text": "How much chicken per plate (cooked)?", "options": [{"label": "120 g", "value": 120}, {"label": "150 g", "value": 150, "default": true}, {"label": "180 g", "value": 180}], "allow_other": true, "unit": "g", "impact_kcal": 60}

2. A dish summary for confirmation:
{"type": "dish_summary", "dish_id": "...", "name": "...", "components": [{"name": "chicken breast, grilled, skinless", "amount": 150, "unit": "g cooked", "source": "restaurant" | "kitchen_profile" | "default" | "label"}], "totals": {"kcal": 570, "protein_g": 50, "carbs_g": 45, "fat_g": 19}, "confidence": "verified" | "high" | "estimated", "open_assumptions": ["..."], "progress": {"done": 12, "total": 30}}

3. A label request:
{"type": "label_request", "dish_ids": [...], "component": "brioche bun", "text": "Bought-in? Snap the nutrition label."}

After the restaurant confirms a summary, call save_dish with the confirmed data and move to the next dish.
```

Validate every model response against a Zod schema for these three types. If validation fails, retry once with the validation error, then fall back to a "We hit a snag. Try again" state. Log every prompt, response, and tool call to an `ai_audit_log` table (admin-readable only).

**Acceptance test (worked example):** the kitchen profile is cooked weights, olive oil, 1 tbsp per grilled portion, and no finishing butter. The menu says "Grilled chicken breast with rice." The assistant must skip cooking method (the menu says grilled) and preselect skinless boneless. It should ask exactly three questions: chicken (120 / **150** / 180 g cooked), rice (½ / **1** / 1½ cup), and sauce (**None** / On the side / Mixed in). Then it shows a summary of about 570 kcal, 50 g protein, 45 g carbs, and 19 g fat, which includes the 1 tbsp of olive oil from the kitchen profile, about 120 kcal (≈20% of the dish). Total time is about 15 seconds.

**Done when:** a new restaurant can claim, verify, upload a real PDF menu, finish kitchen setup, verify a dish in three taps, clear the Action Needed queue, and publish, and the dish appears instantly in a second browser signed in as a consumer (a Realtime check against `published_dishes`).
