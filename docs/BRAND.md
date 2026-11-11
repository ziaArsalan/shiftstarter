# Brand — ShiftStarter

The product's public identity. UI work (M2+) follows this. Internal identifiers (repo name `pharmacy-staffing`, npm package names) stay as-is to avoid churn — this governs **user-facing** name, domain, logo, and colors.

## Name & domain
- **Product name:** ShiftStarter (stylized "ShiftStarter AI" / "Shift Starter").
- **Domain:** https://shiftstarter.ca
- **Theme:** racing / "fast start" — checkered flag, motion swoosh. Energetic, quick, reliable.

## Logo
- File: [`client/public/shiftstarter-logo.png`](../client/public/shiftstarter-logo.png) (also in `docs/brand/`).
- Checkered flag on a blue pole + wordmark "Shift / Starter" with an "AI" accent and a blue speed-swoosh ellipse.
- Use on white/light backgrounds. Keep clear space around it; don't recolor the flag.
- TODO (ask before sourcing): an SVG version and a favicon/app-icon derived from the flag mark.

## Color palette (sampled from the logo)

| Token | Hex | Use |
|---|---|---|
| `brand-navy` | `#0A2A5E` | primary text, headers, "Shift" wordmark |
| `brand-navy-deep` | `#001040` | darkest navy accents |
| `brand-blue` | `#1565E0` | primary action color, links, "Starter" wordmark |
| `brand-azure` | `#2E9BFF` | highlights, speed swoosh, hover/active |
| `brand-ink` | `#0A1F3C` | body text on light |
| `surface` | `#FFFFFF` | background |
| `surface-muted` | `#F3F6FB` | cards, subtle fills |

Primary gradient (swoosh / hero accents): `#1565E0 → #2E9BFF`.
These are wired into [`client/tailwind.config.js`](../client/tailwind.config.js) as `colors.brand.*`.

## Voice
Fast, confident, no-nonsense. "Get your shift started." Speaks to busy pharmacists and pharmacies who want to fill/find shifts quickly.

## Accessibility
- `brand-navy` / `brand-ink` on white meet AA for body text.
- `brand-blue` (`#1565E0`) on white is AA for large text / UI; for small text prefer navy. Never place `brand-azure` text on white for body copy (low contrast) — use it for accents/large elements only.
