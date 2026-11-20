# UX reference — client's current app (Shift Posts)

Source: 4 screen recordings from Bobby (2026-11-17), stored locally in `mobile-app-demo/` (gitignored: they show real workers' names, ratings and phone numbers). This is the app his pharmacy uses today. He wants ShiftStarter to be **more intuitive** than this, and to add the **rewards** system (ADR-011).

Use this as input to the M3 plan. We copy no branding, wording or layout. It's a baseline to beat, not a template.

All recordings are from the **pharmacy (employer) side**. We have no worker-side reference.

## What the current app does

| Flow | Steps seen | Time in video |
|---|---|---|
| **Home** | Week strip + list of shifts grouped by day. Each card shows time, hours, worker photo and rating, total $, role, hourly rate and a status chip. Bottom tabs: Shifts · Inbox · Post (+) · Alerts · More | — |
| **Post a shift** | One long form: single/multi shift → pharmacy → position → shift manager → date (calendar) → start and end time (two wheel pickers) → hourly rate (auto total) → commute and accommodation toggles → script volume Low/Med/High → tech/assistant on site → known software (Kroll, HealthWATCH…) → languages → skills → notes (280 chars) → Post → "Shift posted" dialog (OK / View candidates) | **~80 s, ~45 taps** |
| **Shift detail** | Status chip, "current worker" placeholder, time/role/$, address + map, manager, facility type, script volume, software, languages, on-site staff, reimbursements, shift history timeline. Actions: Edit shift · View candidates · Share · Cancel | — |
| **Accept an applicant** | Shift → View applicants → list (name, rating, ✕ / Assign) → spinner → "Success" alert → screen then says **"No application submitted"** | ~25 s |
| **Invite candidates** | "Candidates 2050" (exact) / "3430" (broad): plain list of name + rating (mostly N/A) + ♡ + Request, one at a time | — |
| **Notifications** | Push: "New shift application" and "Shift confirmed". Email: plain text with shift ID, date and address, and "use the app to accept". No button or link to act on it. The confirmation email includes the worker's phone number | — |

## Friction we can fix

1. **Posting is slow and repetitive.** Every shift in his calendar is the same (Pharmacist · Westwood Mall · 4 PM–12 AM · $65/h), yet each one is typed from scratch.
2. **Wheel pickers for time** take 3 to 4 flicks each, and the number keypad covers the form.
3. **The applicant list gives no reason to choose.** It shows a name and stars only. There's no licence-verified badge, distance, software match, experience or proposed rate.
4. **The confirmation is confusing.** After "Assign", the screen says "No application submitted" instead of "Tran is booked".
5. **The candidate list is unusable.** 2,050 people, unsorted, mostly unrated, invited one tap at a time, with no filters for distance, availability or software.
6. **Nothing to act on is shown first.** Shifts that need a decision look the same as finished ones.
7. **Emails are dead ends.** You can't act from them, and they're plain text.
8. **No rewards or incentives** for workers. This is our differentiator.

## Our improvements (proposed for M3; ✱ = depends on later milestone)

**Pharmacy side**
- **Post in under 20 s:** "Repost" on any past shift, plus saved shift templates. Last-used pharmacy, manager, role and rate are filled in automatically. Quick time chips (e.g. 9–5, 4–12) plus typed times. Pick several dates to post the same shift on many days. A live summary stays at the bottom ("Sat Dec 5 · 4 PM–12 AM · 8 h · $520"). Optional requirements are folded under "More details".
- **"Needs you" section** at the top of the home screen: shifts with new applicants, and unfilled shifts starting soon.
- **Applicant cards that help decide:** licence-verified badge, distance, rating and completed shifts, why they match ("Knows HealthWATCH · 6 km away"), and proposed rate (rate negotiation is already in M3). One-tap Accept with a short Undo. The shift then shows the booked worker clearly.
- **Smart candidates:** best match first. Filters for distance, verified, software and rating. "My favourites" on top. Invite several at once.
- ✱ **Emails with action buttons** ("Review applicant") that link straight to the shift (M4 notifications). Worker phone shared only after booking.

**Worker side** (no reference; designed by us)
- Shift feed sorted by distance with the same clean cards. Filter by date, distance and rate. Apply in one tap, or propose a rate.
- Clear status for each application: Applied → Accepted → Booked → Completed.

**Rewards (ADR-011)**
- Each listing shows the reward: **"+$5 reward"**.
- Home shows the balance and progress: "$35 earned · $15 to your next $50 gift card".
- After a shift is completed, the worker sees "You earned $5".
- Rewards page: balance, history, redeem a gift card (Blackhawk catalogue) and redemption status.
- *Ideas that need a client decision (not in ADR-011; probably a change order):* pharmacy-funded **bonus on hard-to-fill shifts**, a **reliability streak** bonus, and a **referral** reward.

## Open questions for the client
- Does he expect a **native app** for M3? Our scope is a mobile-first web app. The native app is future work (CLAUDE.md).
- Are any of the extra reward ideas wanted, and who funds a shift bonus (the pharmacy or the platform)?
- Can he share **worker-side** screens of the current app, if he has access?
