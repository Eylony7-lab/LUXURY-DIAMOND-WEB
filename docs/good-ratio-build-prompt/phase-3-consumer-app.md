# Phase 3: Consumer app (onboarding, Today, logging, Discover)

> Paste after Phase 2 works end-to-end. Mobile-first PWA at `/app`, max width 480, with a bottom tab bar: Today · Discover · **+ Log** · Coach · Me.

Build the diner experience. A new user goes from sign-up to a personal calorie and macro target, then uses Today, Log, Discover, and Coach in any order. All restaurant data comes from `published_dishes` and updates live through Realtime.

## 1. Onboarding (`/app/onboarding`)
Full-screen steps: a progress bar ("3/9") at the top, one question per screen as H1, a TapOptionGroup or a large numeric input, and a primary **Continue** button pinned at the bottom (pine, 48px). Use the brand pattern only on the welcome and finish screens. The account is created first (step 0: email magic link, Google, or Apple).

**Core questions (required).** Keep them to nine. Each extra field costs completion rate.
| Step | Question | Input | Feeds |
|---|---|---|---|
| 1 | What's your goal? | Lose weight / Maintain / Gain weight | Target, recommendations |
| 2 | Sex used for your calorie formula | Male / Female / Other (uses the average of both formulas), with a "Why we ask" link | Target |
| 3 | Birthday | Date picker (shown as age) | Target |
| 4 | Height and current weight | ft/in + lb (or cm + kg) | Target |
| 5 | How active are you most weeks? | Sedentary / Lightly active / Moderately active / Active / Very active, each with a one-line example | Target |
| 6 | Goal weight and pace *(skip if Maintain)* | Goal weight, plus pace chips: 0.5 / 1 / 1.5 lb per week, with a live projected date ("You'll reach 165 lb around Mar 14") | Target |
| 7 | Any dietary preferences or restrictions? (multi-select) | Vegetarian / Vegan / Pescatarian / Gluten-free / Dairy-free / Halal / Kosher / Nut allergy / Shellfish allergy / None | Recommendations, search filters |
| 8 | When do you usually eat? | Time chips for breakfast, lunch, and dinner with sensible defaults (8:00, 13:00, 19:30), plus "I skip breakfast" | Notifications |
| 9 | How many days a week do you eat out? | 0–1 / 2–3 / 4–5 / 6–7 | Recommendations, notifications |

**Quick optional screens** (one screen, all skippable, after the target reveal): Hardest part about eating out (multi-select: Hitting protein / Staying under calories / Not knowing what's in it / Too few options), Notification style (frequency Minimal / Balanced / Frequent; tone Gentle / Direct), and How did you hear about us. Ask for push permission only after showing the value: "Want a nudge at lunch?"

**Target reveal screen:** a pine hero card with the daily kcal in Display size, three macro chips, a one-line explanation ("Based on your height, weight, age, and activity, with a 500 cal/day deficit for 1 lb/week"), an **Adjust** link, and **Start my day**.

### Target calculation (pure function `calculateTargets`, unit-tested)
- **BMR (Mifflin–St Jeor):** male `10·kg + 6.25·cm − 5·age + 5`. Female `10·kg + 6.25·cm − 5·age − 161`. Other: the mean of the two (constant −78).
- **TDEE** = BMR × activity factor (1.2 / 1.375 / 1.55 / 1.725 / 1.9).
- **Goal adjustment:** 1 lb/week ≈ 500 kcal/day (0.5 → 250, 1.5 → 750). Lose subtracts it, gain adds it, maintain adds zero.
- **Safety guardrails:** never go below max(BMR, 1,200 kcal) for female or 1,500 kcal for male/other. Cap loss pace at 1% of body weight per week. Cap gain at 0.5 lb/week. When a guardrail applies, tell the user plainly: "We capped your pace at 1 lb/week to keep it sustainable."
- **Macros:** protein 1.6 g/kg of goal weight (2.0 g/kg when losing), fat 27.5% of kcal, carbs the remainder. Round kcal to 10 and grams to 1.
- **Recalculate automatically** whenever weight, activity level, goal, goal weight, or pace changes: insert a new `daily_targets` row and show a toast, "Your target is now 2,180 cal."
- The "Under 18" path shows a "Good Ratio is for adults 18+" screen and goes no further.

## 2. Today (home, `/app`)
- Header: greeting plus the date, with arrows or swipe to move between days.
- A **CalorieRing** hero: kcal eaten over the target, with "910 cal left" below it. Tapping it shows the breakdown (eaten · remaining).
- **MacroBars:** protein (pine), carbs (sage), fat (charcoal), each with "62g left".
- **Meals list** (Breakfast, Lunch, Dinner, Snacks): logged items with kcal, swipe to delete or edit, and "+ Add" per meal.
- **"Fits your day" carousel:** three DishCards from nearby verified restaurants that fit the remaining kcal and macros, with "See more" opening Discover. Hide it if location is off and show a "Turn on location for picks near you" card instead.
- A weekly mini-chart (seven bars, the target as a line) and a "Log weight" chip.
- Empty state for the first day: "Log your first meal. Numbers first, guesswork never."

## 3. Log food (`+` tab, a bottom sheet with three modes)
The **same logging component** is reused everywhere: Search, a recommended dish, Coach, or restaurant detail.
1. **Search:** a debounced search across (a) published restaurant dishes (marked with a confidence badge and the restaurant name, ranked first when nearby), (b) recent and frequent foods, and (c) `lookup_food` results. Each result shows the name, serving, kcal, and P/C/F.
2. **Scan barcode:** full-screen camera with `@zxing/browser`, then `lookup_barcode`, then the confirm screen. If the barcode isn't found: "We couldn't find that one. Enter it manually?"
3. **Manual:** name, kcal (required), and protein, carbs, and fat (optional). "Save as my food" lets them reuse it.
- **Confirm screen:** a servings stepper (0.25 steps) plus a unit selector, a meal picker (defaulting from the time of day and onboarding meal times), live macro totals, and **Log it**. Restaurant dishes include size and substitution options when the restaurant defined them, and the entry stores `dish_version_id` so later menu edits never rewrite history.
- After logging: the ring animates, a toast confirms with an **Undo**, and a `dish_events.logged` event is sent for restaurant dishes.

## 4. Discover (`/app/discover`)
- A search bar ("Search dishes or restaurants") and filter chips: **Fits my day** (default on), **High protein**, **Under 500 cal**, **Near me**, **Verified only**, plus the user's dietary filters, which are always on and shown as removable chips.
- List or map toggle (a map with pine pins for restaurants). Default to the list.
- **Ranking:** each dish gets a **fit score**, shown as "93% fit":
  - Dietary or allergen conflicts (using only restaurant-set tags) are **hard filters**, not scores. If the user has an allergy and the dish has no tag set, show it with "Allergens not confirmed. Ask staff."
  - Calorie fit is 40% (how close the dish's kcal is to the remaining kcal for the next meal, using the meal-time split of 25% breakfast, 35% lunch, 30% dinner, and 10% snacks, adjusted by what's already logged).
  - Macro fit is 30% (the goal-weighted fit to remaining protein, carbs, and fat, with protein weighted higher when the goal is lose or gain).
  - Confidence is 20% (verified 1.0, high 0.8, estimated 0.5). Verified dishes rank higher, as we promise restaurants.
  - Distance is 10% (the full score within 0.5 mi, decaying to zero at 5 mi).
  - Show only dishes with a fit of 60% or more under "Fits my day".
- Each DishCard logs `impression` events, and viewing logs `view`. Appearing in "Fits your day" or a coach answer logs `recommended`.

## 5. Restaurant and dish detail
- **Restaurant page:** a cover photo (following the brand photography rules), name, cuisine, distance, hours, kitchen-wide dietary facts (as stated by the restaurant), and a "Verified partner" badge. The menu is grouped by section, with each dish showing kcal, P/C/F chips, and a confidence badge. Toggle **Sort by fit**.
- **Dish page:** photo, name, the hero macros, a confidence badge with an explanation sheet (what "Verified by restaurant", "High confidence", and "Estimated" mean), sizes and substitutions with live macro changes, allergen and dietary tags with "Confirm allergens with staff", **Log it** (primary), **Save** (bookmark), and **"Numbers look off?"**.
- **Numbers look off?** Pick what looks wrong (calories / protein / carbs / fat / portion / allergen / other) and add an optional note. This creates `user_dish_flags` and an `action_items` row for the restaurant. Show the user: "Thanks. We've asked the restaurant to double-check. We'll let you know." **Their flag never changes the number.**
- If a dish is edited and republished while open, update it in place through Realtime and show a subtle "Updated by the restaurant just now."

## 6. Me (`/app/me`)
- Profile and goal (editing triggers target recalculation), weight history (a line chart plus a log entry), dietary preferences, saved dishes, units (US/metric), appearance (light, dark, system), notification preferences (frequency, tone, quiet hours with a 9 pm–8 am default, per-type toggles), connected sign-in methods, data export (CSV), and account deletion (a hard delete after 30 days, with a confirmation step).
- A history calendar: days colored by adherence (mint = within ±10% of the target). Never use red, and never shame.

**Done when:** onboarding produces a correct target (unit tests for all three sex options, the guardrails, and a recalculation), all three logging modes work and write correct totals, Discover ranks dishes by fit and respects allergy hard filters, a restaurant's publish or edit appears live on the dish page, and a flag lands in that restaurant's Action Needed queue.
