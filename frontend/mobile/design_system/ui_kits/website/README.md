# Website UI Kit — Devopsolution

A high-fidelity, click-thru recreation of a marketing surface for **Devopsolution** built against this repo's design system (`/colors_and_type.css`).

This kit is intentionally **cosmetic** — components are simple and visual, not production-ready. Use them as a reference when assembling real marketing pages (homepage, service detail, solutions, careers, contact).

## Files

| File | Purpose |
|---|---|
| `index.html` | Main entry. Renders a complete homepage prototype with click-thru EN ↔ AR language toggle. |
| `app.jsx` | Page assembly + tiny app shell + language state. |
| `Nav.jsx` | Sticky glass top navigation. |
| `Hero.jsx` | Hero section with display headline, dual CTAs, and a glass stat card stack. |
| `Services.jsx` | 8-up service grid with hover lift + icons. |
| `Solutions.jsx` | Solutions strip — SecYours / YallaTour / Medical ChatBot / Nafizaty. |
| `CTA.jsx` | "Start your digital journey" CTA band on hero gradient. |
| `Footer.jsx` | Footer with services, contact, social, memberships. |

## Patterns demonstrated

- Sticky glass nav (transparent → glass on scroll).
- Hero with radial gradient blobs + glass stat tiles + dual CTAs (primary indigo + lavender accent).
- Service grid using monochrome Lucide icons (substituted; see README in root).
- Solutions strip with hover lift.
- Bilingual support — flip the lang toggle in the nav to switch between EN (LTR · Livvic) and AR (RTL · Cairo).
- All elevation & color via tokens — no hard-coded hex outside the imported stylesheet.

## What's intentionally **not** here

- Real photography (using gradient + abstract shapes instead — flag in root README).
- Real form submission, real router, real CMS — this is a static UI mockup.
- Sub-brand homepages (SecYours, YallaTour, Medical ChatBot, Nafizaty). Each would warrant its own kit.
