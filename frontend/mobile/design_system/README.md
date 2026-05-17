# Devopsolution Design System

> A modern, glass-forward visual language for **Devopsolution** — a full-service digital agency based in Cairo (with a presence in the Saudi market), specializing in web & mobile development, enterprise architecture, RPA, AI/chatbots, motion graphics, branding, and digital marketing.

This document plus the surrounding files form a **reusable design system**, *not* a rebuild of the existing devopsolution.net website. The goal: give designers and engineers a single source of truth so the next generation of marketing pages, product surfaces, and bilingual (EN/AR) content all feel like they came from the same brand.

---

## Index — what's in this folder

| File / Folder | Purpose |
|---|---|
| `README.md` | This file. Brand overview, content fundamentals, visual foundations, iconography. |
| `SKILL.md` | Skill manifest — describes how an agent should use this system. |
| `colors_and_type.css` | **Source of truth** for color, type, spacing, radius, shadow, and motion tokens. |
| `assets/` | Logos, brand marks, generic placeholder imagery. |
| `preview/` | One small HTML card per design-system concept. Surfaced in the Design System tab. |
| `ui_kits/website/` | High-fidelity React-style recreation of the marketing website surface. |
| `fonts/` | (Empty — fonts loaded from Google Fonts CDN. See *Typography* below.) |

---

## Sources & references

- **Logo file (provided):** `uploads/devop-logo-03-01.png` → copied to `assets/devop-logo.png`
- **Brand brief (provided in chat):**
  - Primary `#262261`, accent `#787CF2`
  - Type: Livvic (EN), Cairo (AR)
  - Direction: glassmorphism, soft gradients, light borders, soft shadows, rounded corners, spacious
- **Live website (reference only — not copied):** <https://devopsolution.net/>
  - Pulled to understand product copy, services list, and content tone.
  - **We are not redesigning the live site yet** — only building the system that will eventually replace it.

---

## The company at a glance

- **Founded** 2018, full-service creative & engineering agency.
- **HQ** Cairo, Egypt. Active in EG + KSA markets — bilingual EN/AR is non-negotiable.
- **Services** Enterprise Architecture · Web Development · Mobile App Development · Motion Graphics · Digital Marketing · Branding & Design · RPA · Chatbots / AI.
- **In-house solutions / sub-brands:** SecYours, YallaTour, Medical ChatBot, Nafizaty.
- **Audience** SMB & enterprise decision-makers across MENA — IT directors, CTOs, marketing leads, product owners commissioning digital transformation work.
- **One-line positioning:** *"Your one-stop shop for innovative and inspiring digital solutions."*

---

## Content fundamentals

**Voice.** Confident, partner-led, plural. The agency speaks as **"we"**, addresses the reader as **"you" / "your business"**. Never uses "I". The tone is professional but warm — proud of craft, never boastful or jargon-heavy.

**Casing.**
- **Sentence case** for body, buttons, links, navigation, form labels.
- **Title Case** for service names, solution names, page titles ("Web Development", "Mobile App Development", "Enterprise Architecture").
- The wordmark itself is set ALL-CAPS (DEVOPSOLUTION) and split-colored — orange `DEVOP` + indigo `SOLUTION`. Don't reproduce that styling in body copy; only the official lockup uses it.
- Avoid SHOUTING headlines.

**Person & address.** "We" / "our team" / "our experts". The reader is "you" or "your business". A pattern repeats across every service page: *(1)* what the service is, *(2)* what we deliver, *(3)* why it matters for the reader's growth — always closing on the reader's outcome.

**Typical phrases (lifted from the live site).** "Take your digital journey to the next level." "One-stop shop for all your digital needs." "Tailor-made solutions." "From start to finish." "Full-service creative agency." Use these sparingly as anchors; vary the surrounding copy.

**Vibe.** Confident, optimistic, momentum-forward. Talks about *journeys*, *transformation*, *growth*, *unlocking possibility*. Never edgy, snarky, or self-deprecating. Never overly technical — even when describing RPA or chatbots, the framing is business outcomes (faster response, less manual work, happier customers).

**Emoji.** **No.** Devopsolution is a B2B agency. Emoji never appears in marketing copy, UI labels, or buttons. Use brand iconography or no icon at all.

**Bilingual rules.**
- Every page is built EN-first then mirrored to AR (`dir="rtl"`).
- Arabic uses Cairo, larger line-height (`--lh-loose: 1.8`), and 0 letter-spacing (Arabic doesn't tolerate tracking).
- Numbers stay Western Arabic (1, 2, 3) by default unless the client specifically asks for Eastern Arabic-Indic (١٢٣).
- Don't translate proper nouns: "Devopsolution", "SecYours", "YallaTour", "Nafizaty", "WhatsApp" stay in Latin script.

**Examples — keep / avoid:**
- ✅ "Take your business to the mobile world with apps designed to grow with you."
- ✅ "We tailor-make software solutions that fit your team — start to finish."
- ❌ "🚀 We crush it at mobile dev! Let's gooo 🔥"  (emoji, slang, exclamation overload)
- ❌ "I think we're pretty good at this."  (first-person singular, hedging)

---

## Visual foundations

### Color
- **Primary:** `#262261` Deep indigo — wordmark "SOLUTION", primary buttons, headlines, footer.
- **Accent:** `#787CF2` Lavender — links, secondary CTAs, focus rings, glow under key cards, gradient end-stops.
- **Spark:** `#EE5C2D` Orange (lifted from the wordmark glyph) — used **sparingly** for status dots, illustration sparks, list-marker accents. Never as a button fill on its own.
- **Neutrals are cool & indigo-tinted** (not pure gray) — `--ink-700: #1F1D3D`, `--ink-100: #E5E4EE` — so the page never feels disconnected from the brand.
- **Semantic** success/warning/danger live alongside accent in `colors_and_type.css`.

### Dark mode

The system ships with a complete dark variant. Activation is class-based
(`<html class="dark">`) — both consumer apps drive it via
[`next-themes`](https://github.com/pacocoursey/next-themes) with
`attribute="class"`.

**What flips** (the *canvas* the brand sits on):

- Surfaces: `--bg-page`, `--bg-page-deep`, `--bg-canvas`
- Full `--ink-*` scale (the indigo-tinted neutrals invert — `--ink-900` goes
  from near-black to white, `--ink-100` from pale lavender to a deep indigo
  divider, etc.)
- Glass tokens (`--glass-fill`, `--glass-stroke`) — the dark variant is a
  semi-opaque dark canvas with a faint white stroke that catches light
- Semantic surface tints (`--success-bg`, `--warning-bg`, `--danger-bg`) —
  low-alpha tints over dark canvas
- Shadows (`--shadow-xs`…`--shadow-xl`) — indigo-tinted shadows disappear on
  dark indigo; the dark overrides switch to near-black at higher opacity
- The page gradient (`--grad-page`) — same two-radial shape, lower saturation

**What stays the same** (brand-identity tokens):

- `--brand-primary`, `--brand-accent`, `--brand-spark` and their shade scales
- The hero gradient (`--grad-hero`)
- Motion curves and durations
- Radii and the type scale

**For implementers:** prefer var-backed tokens (`text-ink-500`,
`bg-canvas`, `border-ink-100`, `shadow-md`) so components flip automatically.
Use `dark:` Tailwind variants only when you need an explicit override
(typically translucent overlays like `bg-white/40` that can't compute alpha
from a CSS var on Tailwind v3 — Tailwind v4 handles that natively).

See `colors_and_type.css` for the canonical `html.dark { … }` block.

### Type
- **English:** Livvic (300 / 400 / 500 / 600 / 700 / 900). Geometric, slightly humanist sans. Set headlines tight (`-0.02em`).
- **Arabic:** Cairo (300 / 400 / 500 / 600 / 700 / 900). Generous leading (`1.8`) and 0 letter-spacing.
- **Hierarchy** is dramatic: hero displays at 56–88 px, h1 at 44, body at 16/18. Strong contrast between display and body sells the *spacious-modern* feel.
- **Eyebrow** uppercase, 12 px, letter-spacing `0.18em`, color `--brand-accent-700` — the tiny indigo-lavender label that introduces almost every section.

### Backgrounds & gradients
- Pages live on a **soft cool wash** (`--bg-page: #F7F7FB`) with two large radial highlights at the top corners (lavender top-left, indigo-100 top-right). This is captured in `--grad-page`.
- The **hero gradient** (`--grad-hero`) is `#262261 → #3D3A8A → #787CF2` at 135°. This shows up in hero panels, dark sections, and CTA bands.
- **No** repeating patterns, no grain, no hand-drawn illustrations. Visual texture comes from **glass + light + soft gradients** — nothing else.
- Photography (when used): cool / desaturated / professional. Avoid warm sunset tones; avoid b&w.

### Glassmorphism — usage rules
Glass is a **flagship motif** but applied with restraint.

**When to use glass:**
- Floating panels over a colored or gradient background (hero card, nav on scroll, modal, side panel).
- Stats/metric tiles inside hero or CTA bands.
- Hover-up cards on a tinted section background.

**When NOT to use glass:**
- Plain white sections — falls flat with no visual context behind it.
- Large body content (paragraphs of text get unreadable through blur).
- Tiny UI elements (chips < 32 px, dense table rows).

**Recipe (light glass):** `background: var(--glass-fill)` + `backdrop-filter: blur(var(--glass-blur)) saturate(140%)` + `border: 1px solid var(--glass-stroke)` + `box-shadow: var(--shadow-md)` + radius `var(--radius-lg)`.
**Recipe (on indigo):** swap `--glass-fill-onbrand` and `--glass-stroke-onbrand`; add a subtle `--grad-glass-onbrand` overlay.
Always pair glass with a **colorful or gradient background behind it** — that's where the effect lives.

### Borders
- Hairline-thin (1 px), cool. `--ink-100` on white surfaces, `rgba(255,255,255,0.18)` on indigo.
- Glass borders are slightly *lighter than* the fill — they catch light, not separate.
- No heavy 2 px+ borders anywhere except inputs in focus state.

### Shadows / elevation
- All shadows are **indigo-tinted** (`rgba(38, 34, 97, …)`) — never gray. This keeps depth on-brand.
- Five steps: `xs` → `sm` → `md` → `lg` → `xl`, plus a special `--shadow-glow-accent` for hero cards (lavender glow).
- Inner shadow `--shadow-inset-hairline` adds the wet-glass "edge light" on key glass panels.

### Corner radii
- Default for everything: `--radius-md: 14px`.
- Cards: `--radius-lg: 20px`.
- Hero / feature cards: `--radius-xl: 28px` or `--radius-2xl: 36px`.
- Buttons: `--radius-pill` (fully rounded) — this is a strong brand cue.
- Inputs: `--radius-md: 14px`.
- Tiny chips/badges: `--radius-pill`.

### Cards
- Solid white card: `--bg-canvas` + `--shadow-md` + `--radius-lg` + 1 px `--ink-100` border.
- Glass card: see glass recipe above.
- Indigo card (used to break up sections): `var(--brand-primary)` bg, white text, `--shadow-lg`, optional inner gradient `--grad-hero`.
- Hover: lifts 4 px (`translateY(-4px)`) + shadow steps up to `--shadow-lg`. Transition `220ms var(--ease-out)`.

### Buttons
- **Primary:** indigo fill (`--brand-primary`), white text, pill radius, h: 48 px (lg) / 40 px (md) / 32 px (sm), padding 24/16 px. Hover → `--brand-primary-700`. Press → `transform: scale(0.98)`.
- **Accent:** lavender fill (`--brand-accent`), white text, optional `--shadow-glow-accent` for hero CTAs.
- **Secondary / outline:** transparent, 1 px `--brand-primary` border, indigo text. Hover → `--brand-primary-050` fill.
- **Ghost:** no border, indigo text, hover → `--brand-accent-100` fill.
- **Glass:** glass fill + white border, white text — only on dark/colored backgrounds.

### Hover & press states
- **Hover** on links: color shifts to `--brand-primary` (from accent) and underline thickens.
- **Hover** on cards: lift 4 px, shadow increases.
- **Hover** on buttons: darker fill (one step) or lighter background tint for ghost/outline.
- **Press**: `transform: scale(0.98)` for buttons + 1-step shadow reduction.
- **Focus ring**: 3 px `rgba(120, 124, 242, 0.45)` outline-offset 2 px. Always visible — accessibility-first.

### Animation & motion
- **Easing:** `cubic-bezier(.2,.7,.2,1)` for everyday transitions; `cubic-bezier(.16,.84,.32,1)` for entrances.
- **Duration:** 140 / 220 / 380 ms.
- **Style:** crossfades, soft slides (8–12 px), gentle scales (0.98 → 1). **No bouncy springs**, no overshoot, no rotation tricks.
- Page-load: stagger hero elements ~60 ms apart with a 12 px upward translate + fade. Subtle.
- Decorative blobs in hero gradient drift slowly (`16s` ease-in-out infinite alternate).

### Layout rules
- **Max content width:** 1200–1280 px, centered with 24–48 px gutters.
- **Section vertical rhythm:** 96 / 128 px between marketing sections; 64 px on tablet; 48 px on mobile.
- **Grid:** 12-column with 24 px gutters.
- **Spacious** = generous whitespace around hero, around section headers (eyebrow + h2 + lede), around CTA bands. Never crowd.
- **Fixed elements:** sticky top nav (becomes glass on scroll). No floating chat bubbles or pop-ups in the system itself.

### Transparency & blur
- Used for nav-on-scroll, modals, side drawers, hero stat tiles, "behind glass" panels.
- Never on plain white backgrounds — needs color behind to register.
- Mobile fallback: increase fill opacity by ~20 % (some Android browsers don't render `backdrop-filter` cleanly).

### Imagery vibe
- Cool, professional, slightly desaturated. Tech-forward — laptops, abstract gradients, server rooms, dashboards.
- We have **no real photography in this system yet** — UI uses gradient placeholders + 3D-feeling abstract shapes from the brand. (Flag for the user: confirm photography library.)

---

## Iconography

The live devopsolution.net site uses **custom illustrative PNG icons** for service tiles (e.g. `webicon.png`, `Mobile.png`) — these are **not** included in this design-system version because we don't have permission to redistribute the originals as system assets, and they're stylistically dated.

**Approach in this system:**
- **Primary icon set: [Lucide](https://lucide.dev/)** — clean 24 px stroke icons, 1.75 px weight, rounded line-caps. Loaded from CDN. This is a **substitution**; please confirm or supply a preferred icon set. The closest free-tier matches to the live site's icon style would be **Phosphor Icons (Duotone)** or **Iconoir** — happy to switch.
- **Stroke weight:** 1.75 px Lucide default.
- **Color:** monochrome `--brand-primary` by default; `--brand-accent` for highlighted states; `--brand-spark` *only* for status indicators or illustration accents.
- **Sizes:** 16 px (inline), 20 px (default UI), 24 px (buttons), 32–48 px (feature cards).
- **No emoji** anywhere in product UI. No Unicode symbols as icons (no →, ★, ✓ in body — use the actual icon component).
- **Logo** is the only PNG icon in this system. Use the SVG version (TBD — flag) wherever possible for sharpness; the PNG (`assets/devop-logo.png`) is a 468×97 transparent file.

**Custom illustration / brand spark:** the orange "circuit-D" mark inside the logo is an illustration motif that can be lifted as a decorative element (corner sparks, hero accent shapes). Don't redraw it — extract it from the logo file if needed.

---

## UI kits

| Surface | Path | Status |
|---|---|---|
| Marketing website | `ui_kits/website/index.html` | Hi-fi, click-thru hero + services + glass nav + footer. |

(Future surfaces — internal product like SecYours, Nafizaty — would each get their own folder.)

---

## Caveats & open questions

- **Fonts:** loaded from Google Fonts CDN (Livvic + Cairo). No `.ttf` files committed locally; `fonts/` is a placeholder. If self-hosting is required, please provide the licensed weights.
- **Iconography:** we substituted Lucide as a placeholder. Please confirm or provide the preferred icon library.
- **Photography:** no real photo library in the system yet. We use gradient + abstract placeholders. Please share an approved photo bank if available.
- **Logo SVG:** only the PNG was provided. An SVG version would render sharper at all sizes — please share if available.
- **Sub-brand identities** (SecYours, YallaTour, Medical ChatBot, Nafizaty) are out of scope here — their visual systems would each need their own treatment.
