# Phase 4: Ratio Coach (AI) and notifications

> Paste last. It depends on real logs and published dishes.

## 1. Ratio Coach (`/app/coach`)
A chat screen. Assistant bubbles are white cards on cream, user bubbles are pine with cream text, and the coach avatar is the "g" icon on mint. Suggested prompt chips appear above the input when the thread is empty: "What should I order for lunch?", "Salad or wrap: which fits better right now?", "How did I do on protein this week?", "What's left for today?"

**Scope at launch: reactive Q&A only.** The coach answers questions the user asks about their own data and verified restaurant data. It never gives proactive "you should eat less of X" advice in v1.

Edge Function `coach_reply` streams responses from the Lovable AI gateway and gives the model these tools (scoped server-side to the signed-in user):
- `get_today_summary()`: target, eaten, remaining kcal and macros, and logged items
- `get_history(days)`: daily totals and adherence
- `search_dishes(query?, near?: {lat,lng}, max_kcal?, min_protein_g?, verified_only?)`: reads `published_dishes`, applies the user's dietary hard filters, and returns fit scores
- `get_dish(dish_id)`: full macros, confidence, and allergen tags
- `compare_dishes(dish_ids[])`
- `log_dish(dish_id, servings, meal)`: **only after the user taps the Log button** on a dish card the coach rendered, never on its own

Coach system prompt:
```
You are Ratio Coach inside the Good Ratio app. You answer the user's questions about their own food log, targets and nearby restaurant dishes, using only data from your tools.

Rules:
- Numbers first. Lead with the answer in one sentence ("The Grilled Salmon at Pura Vida fits best: 420 cal, 42g protein."), then at most two short supporting lines.
- Use only tool data for every number. If data is missing, say so and offer to search or log.
- Always mention a dish's confidence when recommending it, and prefer Verified dishes when the fit is similar.
- Never state or imply a dish is free of an allergen unless the restaurant tagged it; always add "Confirm allergens with staff" when the user has allergies.
- No medical, clinical or weight-loss-promise claims. No diagnoses, supplements, or eating-disorder-adjacent advice. If the user mentions a medical condition, pregnancy, disordered eating or very low intake, respond kindly, avoid numeric restriction advice, and suggest a doctor or registered dietitian.
- Reactive only: answer what was asked. Don't lecture or add unrequested "you should" advice. If suggesting, frame it as "you could try…".
- Voice: short, confident, warm, a little witty. Never shame, fear, "cheat meal", "guilt-free", "burn it off", "clean vs dirty". No emojis.
- When you recommend dishes, return them as dish cards (dish_ids) so the app can render them with a Log button.
```
- The UI renders cited dishes as compact DishCards inside the answer, each with **Log it** (reusing the Phase 3 confirm sheet). Logging from the coach sets `source = 'coach'` and emits `recommended` and `logged` events.
- Store threads in `coach_threads` and `coach_messages`. Limit usage to 50 messages per user per day, with a friendly limit message.
- A thumbs up/down on each answer is stored for quality review in `/admin`.

## 2. Notifications
Notifications should feel personal, not generic. Each trigger combines what the user told us at onboarding with what they've actually done that day.

Edge Function `notification_scheduler` runs every 15 minutes (cron). It evaluates triggers per user in their **local timezone** and sends **Web Push**, with email only for the weekly check-in if the user opted in.

| Trigger | Condition | Example message (title / body) | Deep link | Driven by |
|---|---|---|---|---|
| Meal-time reminder | 30 min after an onboarding meal time with nothing logged for that meal | "Lunch?" / "Don't forget to log lunch." | `/app/log?meal=lunch` | Onboarding meal times |
| Behind on progress | At the dinner time minus 60 min, eaten < 50% of target and dinner not logged *(only for lose/maintain goals and only "Direct" tone, or "Balanced" or higher frequency)* | "Room for a real dinner" / "You're at 40% of today's calories with dinner still ahead." | `/app/discover?fits=1` | Live progress vs. target |
| Macro gap | After lunch time + 2 h, protein remaining > 50% of target | "Short on protein today" / "Here are 3 nearby dishes that would help." | `/app/discover?filter=high_protein` | Live progress + restaurant data |
| New restaurant nearby | A newly published verified restaurant within 2 mi of the user's last location, with at least 3 dishes matching their dietary prefs | "New near you" / "A new option matching your goals just joined near you." | Restaurant page | Location + dietary prefs |
| Dish update on a flag | The restaurant resolved the user's flag | "Thanks for the heads-up" / "Zest Kitchen double-checked the Harissa Chicken." | Dish page | Flag workflow |
| Weekly check-in | Sunday at 6 pm local | "Here's how your week went" / "5 of 7 days on target. Protein up 12%." | `/app/me/history` | Notification cadence setting |

**Hard rules:**
- **Cap proactive (non-reply) notifications at 3 per day for "Frequent", 2 for "Balanced", and 1 for "Minimal".** The weekly check-in counts toward its day.
- **Quiet hours default to 9 pm–8 am local.** The user's notification preferences override the default. Anything scheduled during quiet hours is dropped, not queued (except the weekly check-in, which moves to the next allowed time).
- Never send the same trigger type twice in one day. Pause all nudges for 48 hours after a user dismisses three in a row, and record `suppressed_reason`.
- Tone variants: "Gentle" and "Direct" copy for each trigger, both following the brand voice. No shaming, no fear, no emojis.
- Every notification is written to `notifications` (sent, opened, suppressed) for tuning, and opening it deep-links to the screen in the table.
- An in-app notification center lives under Me, showing the last 30 days.

## 3. Restaurant-side emails (Resend)
"Your menu is ready to verify" (after parsing), a weekly "3 dishes need your answer" digest when there are open action items, "A diner flagged a dish", and the re-verification reminder at 6 months. Each email uses a pine header with the horizontal logo in cream, white body text on cream, and one pine CTA button.

## 4. Admin (`/admin`, minimal)
Ownership disputes (approve or reject, with notes), escalated user flags that a restaurant has ignored for more than 14 days, the AI audit log viewer (intake and coach), coach answer ratings, and a restaurant list with verification status.

**Done when:** the coach answers "What should I order right now to hit my protein goal?" with real nearby verified dishes and a working Log button, refuses an allergen-safety guarantee, and redirects a medical question. The scheduler respects caps, quiet hours, and timezone in tests, and each trigger fires once in a seeded scenario.
