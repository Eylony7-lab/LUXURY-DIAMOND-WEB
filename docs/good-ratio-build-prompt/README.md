# Good Ratio: AI app builder prompt (Lovable)

Built from three source docs: the *Good Ratio Product Workflow Overview* (July 2026), the *Menu Intake AI: Spec and System Prompt* (Oct 21, 2026), and the *Good Ratio Brand Guidelines v1.0*.

## How to use
1. **Project Knowledge:** paste `00-project-knowledge.md` into Lovable → Project Settings → Knowledge. It holds the purpose, roles, stack, full data model, integrations, design system, and non-negotiable rules.
2. Upload the official logo SVGs (stacked, horizontal, "g" icon) to `/public/brand/`. The prompt forbids retyping the logo.
3. Send the phases **in order**, one message each, and check each phase's "Done when" list before sending the next:
   - `phase-1-foundation.md`: design system, auth, roles, every table with RLS, nutrition adapter, shell layouts
   - `phase-2-restaurant-portal.md`: claim and verify, menu upload, AI extraction, kitchen setup, per-dish verification, Action Needed, publishing, analytics (includes the verbatim Menu Intake system prompt)
   - `phase-3-consumer-app.md`: onboarding and target formula, Today, logging (search, barcode, manual), Discover ranking, dish pages, flags
   - `phase-4-coach-notifications.md`: Ratio Coach, notification engine, emails, admin
4. Add secrets when Lovable asks: FatSecret client ID and secret, USDA FDC key, Google Places key, Resend key, VAPID keys.

## Decisions taken where the source docs were open or conflicting
| Topic | Decision | Why |
|---|---|---|
| Nutrition DB | FatSecret first, USDA FDC as a fallback, behind one `lookup_food` adapter | The code already uses FatSecret, and the adapter keeps the provider swappable. **Check FatSecret's license for storing and displaying values.** |
| Onboarding length | 9 required questions, with the remaining 4 on one optional screen | The workflow doc lists 13 but also recommends 8–9 core questions. |
| Who confirms | Owner or manager. Staff can answer but not confirm. | Accountability, as the intake spec recommends. |
| Spot-check reward | A "Scale-checked" marker plus a ranking boost | The doc floated "Lab-checked", but there's no lab involved, so that label would mislead diners. |
| Re-verification | Every 6 months, or on any menu change | Spec recommendation. |
| "Orders attributed" KPI | Replaced with "Times logged" | There's no POS or order data in v1, so a fabricated metric would destroy trust. |
| Functional colors | Added warning and danger colors, for system states only | The brand palette has no error or warning colors. |
| Spacing and radius | 8-pt scale, card radius 16, control radius 12, pill chips | The brand guide doesn't specify these, so they're derived from its layouts. |
| Calorie floors and pace cap | Floor of max(BMR, 1,200/1,500), loss pace capped at 1% of body weight per week | Safety. The source docs don't specify any limits. |

Still open (not blocking the build): label OCR model vs. a dedicated OCR service (the prompt uses the same multimodal model), and the pilot with 2–3 Tier 1 restaurants (e.g. Vale, Naked Farmer) to measure time per dish and drop-off.
