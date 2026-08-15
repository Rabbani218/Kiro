# Spec: To-Do List Life Dashboard

## Overview
A production-ready, single-page browser dashboard built with pure HTML5, CSS3, and Vanilla JavaScript. No frameworks, no backend, no build step — open `index.html` directly in any modern browser.

---

## Technical Constraints

| ID   | Constraint |
|------|-----------|
| TC-1 | Pure HTML5, CSS3, Vanilla JS — zero frameworks |
| TC-2 | Browser `localStorage` for all data persistence |
| TC-3 | Responsive across Chrome, Firefox, Edge, Safari |

---

## File Structure

```
/
├── index.html          # Entry point
├── css/
│   └── style.css       # All styling (single file)
├── js/
│   └── app.js          # All logic (single file)
└── .kiro/
    └── specs/
        └── dashboard.md  # This spec
```

---

## Feature Inventory

### Greeting & Clock
- Real-time `HH:MM:SS AM/PM` clock, updated every second
- Full date display (Day, Month Date, Year)
- Dynamic greeting: Good Morning / Good Afternoon / Good Evening based on hour

### Custom Name in Greeting (Challenge #1)
- Edit button reveals inline name input inside the hero card
- Saves to `localStorage` under key `ld_name`
- Falls back to "Friend" if unset

### Light / Dark Mode (Challenge #2)
- Toggle switch in the top bar
- Applies `data-theme="dark"` to `<html>`
- Persisted in `localStorage` under key `ld_theme`
- Full design token swap via CSS custom properties

### Focus Timer (Pomodoro)
- 25-minute (1500 s) countdown
- Start / Stop (pause) / Reset buttons
- Progress bar tracks time remaining
- Colour urgency: blue → amber (≤5 min) → red (≤1 min) with pulse animation
- Browser tab title flash on completion

### To-Do List
- Add tasks via input + Enter or Add button
- **Duplicate prevention (Challenge #3)** — case-insensitive exact match check
- Mark complete with checkbox (strike-through + faded style)
- Inline edit with ✏️ button; confirm with 💾 or Enter; cancel with Escape
- Delete with 🗑 button (slide-out animation)
- Filter tabs: All / Active / Done
- Clear completed button
- Remaining count badge
- Persisted in `localStorage` under key `ld_tasks`

### Quick Links
- Add custom links (Name + URL)
- Auto-prefixes `https://` if scheme missing
- URL validation before saving
- Google Favicon API for link icons
- Opens in new tab with `rel="noopener noreferrer"`
- Delete button per chip
- Persisted in `localStorage` under key `ld_links`

---

## localStorage Keys

| Key        | Type     | Contents |
|------------|----------|----------|
| `ld_theme` | `string` | `"light"` or `"dark"` |
| `ld_name`  | `string` | User's display name |
| `ld_tasks` | `Array`  | `[{ id, text, completed, createdAt }]` |
| `ld_links` | `Array`  | `[{ id, name, url }]` |

---

## Design System

- **Font**: Inter (Google Fonts)
- **Layout**: CSS Grid + Flexbox, max-width 1100 px, card-based
- **Theming**: CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, `--shadow-*`)
- **Transitions**: 150 ms / 250 ms / 400 ms ease
- **Responsive breakpoints**: 860 px (tablet), 540 px (mobile)
- **Accessibility**: ARIA labels, roles, live regions, focus-visible outlines, `prefers-reduced-motion` support
