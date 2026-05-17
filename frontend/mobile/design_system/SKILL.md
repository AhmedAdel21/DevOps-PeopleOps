---
name: devopsolution-design
description: Use this skill to generate well-branded interfaces and assets for Devopsolution, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Source of truth for tokens:** `colors_and_type.css` — every color, gradient, type style, radius, shadow, and motion variable lives here. Always import this file at the top of any new artifact instead of redeclaring values.
- **Brand essentials:** primary indigo `#262261`, accent lavender `#787CF2`, sparing orange spark `#EE5C2D`. EN font Livvic, AR font Cairo. Glassmorphism is a flagship motif (rules in `README.md`).
- **Logo:** `assets/devop-logo.png` (468×97, transparent). Use SVG version when supplied.
- **Fonts:** self-hosted in `fonts/` (Livvic + Cairo). The `@font-face` declarations are wired in `colors_and_type.css`.
- **Reference UI kit:** `ui_kits/website/` shows a glass-nav + hero + services + solutions + CTA + footer assembled from the system. Crib component patterns (button shapes, card recipes, hero gradient blobs) from there rather than reinventing them.
- **Iconography:** Lucide stand-in (CDN). 1.75 px stroke. No emoji.

## When making a new artifact

1. Confirm whether it's EN-only, AR-only, or bilingual. If AR involved, set `dir="rtl" lang="ar"` on the relevant scope and let `colors_and_type.css` swap fonts/leading automatically.
2. Import `colors_and_type.css` at the very top.
3. Pick a background — soft `--grad-page` for marketing surfaces; solid white for app UI; `--grad-hero` only for hero/CTA bands.
4. Compose with the existing tokens — don't introduce new colors. If you need a new shade, use OKLCH and stay in the indigo/lavender family.
5. Buttons are pill-shaped. Cards are 20 px radius. Shadows are indigo-tinted.
6. No emoji. No gray neutrals (use the cool indigo-tinted ones). No bouncy springs.
