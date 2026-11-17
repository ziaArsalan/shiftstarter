# Client documents

Everything shared with the client (Bobby) lives here. Nothing in this folder is internal-only.

| File | What it is |
|---|---|
| `QUOTATION - Bobby Pharma APP (1).pdf` | Signed scope: 5 milestones, $2,200 |
| `ShiftStarter-Milestone-<n>-Update.pdf` | 1–2 page progress update, sent when a milestone completes |
| `ShiftStarter-Milestone-<n>-Walkthrough.pdf` | PDF export of the presentation deck |
| `decks/M<n>/project/` | Source of each presentation deck (slides + index), kept so the next deck can copy it |
| `updates/M<n>/` | Source of each progress-update PDF: `update.html` + `logo.png` (from M2 on; M1's source wasn't kept) |

## Live presentation decks (Claude Slides)

| Milestone | Deck |
|---|---|
| M1 | [ShiftStarter — Milestone 1 Walkthrough](https://claude.ai/artifact/2x93GmUq7snUsAYjN2Endx) |
| M2 | [ShiftStarter — Milestone 2 Walkthrough](https://claude.ai/artifact/3kK1Y3he3C1ZgadDf9VkcZ) |

Decks are private until shared from the deck's **Share** menu. Export the PDF from **Share › Export** and save it here as `ShiftStarter-Milestone-<n>-Walkthrough.pdf`.

## The pattern: every completed milestone gets both

### 1. Progress update (PDF, 1–2 pages, Letter)
Same layout as `ShiftStarter-Milestone-1-Update.pdf` and `-2-Update.pdf`:
1. Header: logo · "Project progress update" · ShiftStarter · date · "Prepared by Zia Arsalan" · shiftstarter.ca
2. Status bar: "Milestone N Complete — <name>" · "On track · N of 5 milestones"
3. **What we completed**: checklist, a bold title plus a one-line plain-language description per item
4. Optional: **Who can do what** or **Tested before handover**
5. **Project roadmap**: 5 nodes (DONE green check / NEXT blue / upcoming outline)
6. **Next step** banner (navy): next milestone, "awaiting your go-ahead"
7. **What we need from you**: numbered asks (only real blockers)
8. **Why this matters**: 3 cards
9. Closing line + footer "Confidential project update for Bobby"

Copy the previous `updates/M<n>/` folder and edit `update.html`. Render with headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --allow-file-access-from-files --no-pdf-header-footer --print-to-pdf=<out.pdf> file://<folder>/update.html`, then check every page fits (pages are fixed Letter size; overflow is clipped).

### 2. Walkthrough deck (Claude Slides, 16:9)
Copy the previous deck's slides from `decks/M<n-1>/` and keep the look:
- **Fonts:** Space Grotesk (headings) + Inter (text)
- **Colours:** navy `#0A2A5E`, blue `#1565E0`, azure `#2E9BFF`, background `#F7F9FC`, cards white with `#DCE3EE` border; body text `#4A5568`
- **Every content slide:** blue uppercase eyebrow, 72px heading, cards/table, footer "ShiftStarter · Milestone N walkthrough" + page number at bottom 64px, speaker notes in plain language
- **Slide order:** cover (logo, "Milestone N of 5 · Complete") → roadmap (5 cards with amounts; done = navy, next = blue border) → what we delivered (6 icon cards) → 3–5 detail slides for the milestone → decisions (confirmed / your input needed) → next milestone (6 items + "What you’ll see" navy panel) → "Questions?" (logo)

### Writing rules (both documents)
- Written for a non-technical client: outcomes, not implementation detail.
- Only claim what is built and tested; future work is labelled with its milestone.
- No invented numbers: use only figures from `qa/`, `plans/` or the quotation.
- Money beyond milestone amounts (change orders) is left out unless Zia says to include it.
