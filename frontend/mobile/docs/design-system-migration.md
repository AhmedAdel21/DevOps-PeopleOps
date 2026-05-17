# Design System Migration — Devopsolution DS → RN Mobile

Status: **Phase 5 complete — migration code-complete; awaiting final device QA sign-off** · Scope: **full visual language** (incl. glass + gradients) · Date: 2026-05-17

Source of truth for the target: `design_system/colors_and_type.css` + `design_system/README.md`.
Current implementation: `src/presentation/themes/*`.

---

## 1. Headline — this is a brand inversion, not a re-skin

| | Current app | New design system |
|---|---|---|
| **Primary** | `#FF6633` warm orange | `#262261` deep indigo |
| **Secondary / accent** | `#1B2A5B` navy | `#787CF2` lavender (accent) |
| **Orange** | the whole brand | demoted to `#EE5C2D` **"spark"** — status dots & illustration accents only, *never a button fill* |
| **Neutrals** | generic gray (`#6B7280`, `#F3F4F6`) | cool indigo-tinted `--ink-*` (`#4A4870`, `#E5E4EE`) |
| **Type** | Inter (EN only) | Livvic (EN) + Cairo (AR), locale-conditional |
| **Motifs** | flat cards | glassmorphism + soft indigo-tinted shadows + brand gradients |

The colour the app is currently built around (orange) becomes an accent you are told to use *sparingly*. Every token-driven screen will look materially different after Phase 1 — this needs stakeholder eyes on a screenshot before we go past the token layer (see Phase 1 checkpoint).

**One caveat baked into the source:** the DS is explicitly a **web/marketing** system (Tailwind, `next-themes`, `backdrop-filter`, 88px desktop display sizes) and states product surfaces "would each get their own folder." We are *translating* it to RN, not transliterating — desktop-only values (top of the type scale, CSS-only mechanisms) are adapted, not copied.

---

## 2. Token-by-token comparison

### 2.1 Colour — brand

| Role | Current | New DS | Migration note |
|---|---|---|---|
| primary | `#FF6633` | `--brand-primary #262261` | straight swap |
| primaryHover | `#E85A2B` | `--brand-primary-700 #1B1849` | |
| primaryLight | `#FFF0EB` | `--brand-primary-050 #EFEEF7` | |
| secondary | `#1B2A5B` | — | DS has no "secondary"; it has **accent** |
| (new) accent | — | `--brand-accent #787CF2` | **decision:** add `colors.accent` *and* remap `secondary`→accent, or repurpose `secondary` slot. Recommend a real `accent` token + keep `secondary` as an alias to it during transition. |
| (new) spark | — | `--brand-spark #EE5C2D` | new `colors.spark`; usage-restricted (no button fills) |

DS ships full shade ramps (`-700/-500/-300/-100/-050` for primary, `-700..-050` for accent, `-300/-100` for spark). Current theme only has `hover`/`light`. Recommend importing the **full ramps** so components can pick the right step instead of hand-mixing.

### 2.2 Colour — neutrals (the cool-grey switch)

Current grays → DS indigo-tinted `--ink-*`:

| Current | New DS |
|---|---|
| `foreground #111827` | `--ink-700 #1F1D3D` (body) / `--ink-900 #0E0D2A` (max-contrast headings) |
| `mutedForeground #6B7280` | `--ink-500 #4A4870` (secondary) / `--ink-400 #6F6D8E` (metadata) |
| `border #E5E7EB` | `--ink-100 #E5E4EE` |
| `borderStrong #D1D5DB` | `--ink-200 #C8C6D6` |
| `muted #F3F4F6` | `--ink-050 #F4F4F8` |
| `background #FFFFFF` | `--bg-canvas #FFFFFF` (cards) / `--bg-page #F7F7FB` (page) |

Note the DS distinguishes **page** (`#F7F7FB`, cool wash) from **canvas** (`#FFFFFF`, cards). The app currently uses pure white for both — adopting `bg-page` is a visible, intended change.

### 2.3 Colour — semantic & app-specific extensions

DS provides only flat pairs: `--success #1F9D74` / `--success-bg #E5F5EE` (same for warning/danger/info).
The app extends this with `status.{success,warning,error,info}.{base,foreground,light}` **and** `leaveTypes.{annual,casual,sick,compassionate,unpaid,hajj,marriage}` — neither exists in the DS.

**Decision (recommended):** keep both app extensions on top of the DS. Map `--success`→`.base`, `--success-bg`→`.light`, derive `.foreground` (darkened base) per status. Re-tint `leaveTypes` toward the indigo family where it doesn't hurt recognition (sick=danger, annual=success stay). These are *additive*, not "missing DS tokens" — they don't count as gaps.

### 2.4 Surfaces, glass & gradients (new — no current equivalent)

The app theme has **no** glass or gradient tokens today. DS adds:

- Glass: `--glass-fill rgba(255,255,255,0.55)`, `--glass-fill-strong`, `--glass-fill-onbrand`, `--glass-stroke`, `--glass-blur 18px` (+ strong 28px).
- Gradients: `--grad-hero` (135° indigo→lavender), `--grad-page` (two **radial** halos + linear base), `--grad-hero-soft`, `--grad-spark`, glass overlays.

RN feasibility for these is the main effort risk — see §3.

### 2.5 Typography

| | Current | New DS |
|---|---|---|
| EN font | Inter (Regular/Medium/SemiBold/Bold) | **Livvic** 300/400/500/600/700/900 |
| AR font | *none — Inter for everything* | **Cairo** 200–900 |
| Family selection | static `fontFamily` const | **must be locale-conditional** (Livvic for EN, Cairo for AR) |
| Scale | `xs 11 … hero 32` (via `fs()`) | `caption 12 … display-2xl 88` |
| Tracking | none | headlines `-0.02em`, eyebrow `+0.18em` uppercase |
| AR leading | n/a | `1.8` (Cairo needs more) |

Both Livvic + Cairo TTFs **already exist** in `design_system/fonts/`. The current `fontFamily` const is consumed directly by `AppText`/`AppButton` with no locale branch (`language_context.tsx` exposes `isRTL`/`language` but typography ignores it). Making family locale-aware is a small **API change** to `typography.ts` + `AppText`, not just a value swap.

DS display sizes 56/72/88px are desktop hero sizes — **do not port the top of the scale**. Cap at the existing mobile `hero (32)`/`title (24)`; map DS `h4–h6/body/caption` to the existing `AppText` variants and keep `fs()` accessibility scaling.

### 2.6 Spacing

Current `xs4 / s8 / m16 / l24 / xl32 / xxl40` (skips 12 & 20). DS is a fuller scale: `1·2·3·4·5·6·8·10·12·16·20·24·32` (4→128px). Recommend **extending** to the DS steps (adds the missing 12/20 and the large marketing steps) while keeping the existing names as aliases so current screens compile.

### 2.7 Radius

| Current | New DS |
|---|---|
| `s 4 / m 8 / l 12 / xl 16 / pill` | `xs 6 / sm 10 / md 14 / lg 20 / xl 28 / 2xl 36 / pill` |

DS rules: default `md 14`, cards `lg 20`, hero `xl 28`/`2xl 36`, buttons & chips `pill`. **`AppButton` is already `radius.pill`** — that brand cue is satisfied. **Resolved (surgical):** legacy `s/m/l/xl` keep their original values; DS keys `xs/md/lg/xxl` are added alongside. The card `12→20` change is a deliberate per-component move in Phase 4 (`radius.l` → `radius.lg`), not a global Phase 1 bump.

### 2.8 Shadow / elevation (new — no current equivalent)

The app theme has **no shadow tokens**. DS defines `xs→xl` + `--shadow-glow-accent` + `--shadow-inset-hairline`, all **indigo-tinted** `rgba(38,34,97,…)` (never gray). Needs a cross-platform RN mapping (iOS `shadowColor/Offset/Opacity/Radius`, Android `elevation`) added to `AppTheme`.

### 2.9 Motion (new)

DS: easing `cubic-bezier(.2,.7,.2,1)` / `(.16,.84,.32,1)`, durations 140/220/380ms, "no bouncy springs." App has no motion tokens. Low priority — add the tokens, apply opportunistically when animating.

### 2.10 Dark mode

Both have it. App: AsyncStorage `'light'|'dark'`, context-driven, dark theme hand-derived from the *old* palette. DS ships a canonical `html.dark { … }` override block. Action: regenerate `dark.theme.ts` from the DS dark block (surfaces, ink scale, glass, semantic tints, near-black shadows). DS also supports a `system` mode — optional add to the theme context.

---

## 3. RN feasibility & new dependencies

| Need | Library | Installed? | Notes |
|---|---|---|---|
| Glass blur | `@react-native-community/blur` | ❌ no | bare app → community/blur (not expo-blur). Android blur fidelity is weak; DS README already prescribes the fallback: **+~20% fill opacity** when `backdrop-filter` is unreliable. |
| Linear gradients | `react-native-linear-gradient` | ❌ no | needs native rebuild after install |
| Radial gradient (`--grad-page`) | — | — | `react-native-linear-gradient` is **linear-only**. `--grad-page`'s two radial halos must use `react-native-svg` `RadialGradient` (**already installed** ✅) or be approximated with layered linear gradients. |
| Fonts (Livvic/Cairo) | `react-native-asset` (already in use) | files present in `design_system/fonts/` | copy to `src/assets/fonts/`, re-run `npx react-native-asset`, **native rebuild required** (per CLAUDE.md). Use the **static-weight** Cairo TTFs, not `Cairo-VariableFont…` (RN handles static files reliably). |

Per CLAUDE.md: any new native module needs `pod install` + a clean `run-android`/`run-ios`; Metro hot-reload won't pick it up. Also jest will fail to load the new native modules unless mocked (follow the `__mocks__/` pattern already used for the document picker).

---

## 4. Impact surface

- **23 components**, **23 screens** consume the theme.
- **26 files** reference `colors.primary`/`colors.secondary` — these reskin automatically once the token layer changes.
- **6 files / ~10 occurrences** use hardcoded hex outside theme files — these need manual Phase 4 cleanup.
- `text.*` legacy aliases + `placeholder_screen.tsx` rely on old values — keep aliases mapped during transition.

The architecture is favourable: components are token-driven through one `AppTheme` shape, so a token-layer swap propagates broadly without per-component edits. The real work is fonts, glass/gradient primitives, and the colour-*semantics* remap (what was `secondary` vs the new `accent`/`spark`).

**Already aligned (tailwinds, not work):** the app uses `lucide-react-native` (`language_context.tsx:7`), which matches the DS-prescribed Lucide icon set — only the default icon colour needs to track `primary`. `AppButton` is already `radius.pill`. These reduce real scope versus first impression.

---

## 5. Phased migration plan

Each phase ends with a checkpoint: `npx tsc --noEmit` clean, `npx jest` green, device smoke (Android + iOS).

**Phase 0 — Decisions & deps (no UI change)**
- Resolve the open decisions in §6.
- `npm i @react-native-community/blur react-native-linear-gradient`; `cd ios && pod install`; add jest mocks; native rebuild.
- Copy `design_system/fonts/` (static weights only) → `src/assets/fonts/`; `npx react-native-asset`; native rebuild; verify iOS PostScript names.

**Phase 1 — Token layer** ✅ **DONE** *(biggest visual delta)*
- ✅ Rewrote `light.theme.ts` + `dark.theme.ts` from DS values; extended `AppTheme` + added `themes/{shadow,glass,gradient,motion}.ts`; extended `spacing.ts` + `radius.ts` additively.
- ✅ `secondary`/`text.*`/`status.*`/`leaveTypes` kept as compat aliases; `secondary` → `accent`.
- ✅ **Radius/spacing are surgical:** legacy names keep original values (no shape change at Phase 1); DS steps added on top under new keys. The documented card `12→20` bump moves to the Phase 4 component pass (point `AppCard` at `radius.lg`).
- ✅ Verified: `npx tsc --noEmit` exit 0, `npx jest` 37/37.
- ⏳ **Checkpoint + sign-off gate (requester action):** run the app — `npx react-native run-android` / `run-ios` — and review **home + a leave screen, light & dark**. The whole app is now indigo + indigo-tinted neutrals. Token-driven components reskin automatically; the 6 hardcoded-hex files are still orange until Phase 4. **Sign off before Phase 2.**

**Phase 2 — Typography pipeline** ✅ **DONE**
- ✅ Fonts: copied static Livvic + Cairo (4 weights each) → `src/assets/fonts/`; `npx react-native-asset` linked them (iOS `Info.plist`/`pbxproj`, Android assets). **Inter fully removed** (files + manifests) so the required native rebuild is clean.
- ✅ `typography.ts`: `fontFamilyFor(language)` resolver (Arabic→Cairo, else Livvic; defensive default) — **TDD'd**, `__tests__/font_family.test.ts` 5/5. Added `letterSpacing` tokens (em; consumers apply `em × size`).
- ✅ `AppText`: locale-aware family via `useFontFamily`; new `eyebrow` variant (uppercase, accent-700); DS tracking on `hero/display/title/subtitle/cardTitle`, **zeroed for Arabic** (Cairo).
- ✅ Locale-awareness threaded into the 4 non-`AppText` font consumers (tab labels, text field, 2 notes inputs).
- ✅ **Bug found & fixed:** `useFontFamily` resolves from the **global react-i18next instance**, not the custom `LanguageProvider` — providers nest `Theme > Dialog > Language`, so `AppText` inside dialogs is outside `LanguageProvider`; a context dependency crashed every dialog. Caught by `language_context.test`.
- ✅ Verified: `npx tsc --noEmit` exit 0, `npx jest` 8 suites / 42 tests.
- ⏳ **Native rebuild + sign-off (requester action):** the new fonts need a clean native build — `npx react-native run-android` / `run-ios` (not Metro reload). Then verify: **EN** text = Livvic (subtle: wider/more humanist than Inter); **AR** text = Cairo (the visible win — Arabic was previously falling back to the system font). **Test Arabic specifically** — if AR looks unchanged, Cairo didn't load (usually a missing native rebuild). `eyebrow` exists but is unused until Phase 4.

**Phase 3 — Glass + gradient primitives** ✅ **DONE** *(scope: primitives + demo; full sweep → Phase 4)*
- ✅ Deps installed: `@react-native-community/blur`, `react-native-linear-gradient`. Jest mocks + `moduleNameMapper` added for both + `react-native-svg`.
- ✅ New atoms: `AppLinearGradient` (token-driven; `angleToStartEnd` CSS-angle→vector math **TDD'd**, `__tests__/angle_to_start_end.test.ts` 4/4), `AppPageBackground` (linear base + two **svg RadialGradient** halos, light/dark via theme), `AppGlassSurface` (iOS real blur / Android DS opacity fallback; outer-shadow + inner-clip pattern).
- ✅ Page wash wired at the navigator root (`AppContent`) + transparent React-Navigation theme + transparent scene `contentStyle` so any transparent screen reveals it.
- ✅ `AppBottomSheet` converted to glass (safe — sits over a scrim).
- ✅ Demo screens made root-transparent: **home + leave** (continuity with the Phase 1 sign-off pair).
- ✅ **Bug found & fixed:** the `react-native-svg` jest mock was a Proxy; lucide-react-native does `Object.keys(require('react-native-svg'))` to build its namespace, a Proxy-over-`{}` enumerates nothing → every icon `createElement(undefined)` → dialog crash. Replaced with a concrete enumerable mock. Caught by `language_context.test`.
- ✅ Verified: `npx tsc --noEmit` exit 0, `npx jest` 9 suites / 46 tests.
- ⚠️ **Known limitations (perception, not bugs — for sign-off):**
  1. `AppBottomSheet` renders inside RN `<Modal>`; BlurView there blurs the dim scrim, not the page wash — sheet glass reads **subtler** than inline glass. Moving sheets off `<Modal>` is a separate decision, not Phase 3.
  2. The sheet's indigo shadow may not render under its `overflow:'hidden'` (sheets had no shadow before — not a regression). Phase 4 polish via the outer/inner pattern.
- ⏳ **Native rebuild + sign-off (requester action):** another native build is required — `cd ios && pod install` then a clean `run-android` / `run-ios` (Metro reload won't pick up the new native modules). Look at the **Home and Leave tabs** for the page wash (Profile/Team stay white until Phase 4) and open any bottom sheet (e.g. leave type picker) for glass.

**Phase 4 — Component & screen pass** ✅ **DONE** *(objective sweep; subjective items → Phase 5)*
- ✅ Page-wash sweep: 9 root containers across 8 app screens → `transparent` (history, leave-detail, new-permission, new-vacation, permission-detail, profile ×2, coming-soon, placeholder). **Auth (4) + splash intentionally excluded** (own branded backgrounds). Footers/submit-bars/cards/pills left opaque (correct on the wash). location_picker / sign_in_location_sheet had no opaque root — nothing to do.
- ✅ Hex triage (per-occurrence, not blanket): `#FF6633`→`primary` & `#6B7280`→`mutedForeground` (PickerModal confirm/cancel — old brand orange was leaking in, the strongest evidence the migration was needed); `#8B5CF6` HalfDay→`accentHover` at all 4 sites (locked decision); `#4A154B` Slack brand **kept + commented** (third-party mark); `#0B1220` photo lightbox→DS dark `#0F0E2A` + comment (intentional always-dark) + its radius `l`→`lg`.
- ✅ `AppCard` → DS solid recipe: `radius.lg` + `shadow.md` (affects ~10 usages across home/profile/login/set_password/placeholder).
- ✅ `AppButton` → DS fixed heights **48 / 40 / 32**, pill radius kept.
- ⏸️ **Deferred to Phase 5 (subjective / design-judgment):** `AppHeaderBar` glass (it's already transparent → wash-correct; a glass panel is additive design judgment, not a rule-driven swap), `eyebrow` adoption (which labels become eyebrows is per-screen design), bottom-sheet shadow restructure (risk on animated transform for a non-regressive cosmetic).
- ✅ Verified: `npx tsc --noEmit` exit 0, `npx jest` 9 suites / 46 tests.
- ⏳ **Sign-off (requester action):** **Metro reload is sufficient** — no new native modules, no `pod install`, no rebuild. Look at: history, profile, new-vacation, new-permission, leave-detail, the permission-type picker sheet (wash + cards). **Skip auth + splash** (intentionally unchanged). Expect: cards now carry an indigo drop shadow; `lg` submit buttons are a fixed 48px (visibly slightly different from before).

**Phase 5 — QA & polish** ✅ **DONE (code-complete)**
- ✅ `AppHeaderBar` → frosted bar (inline blur / Android opacity fallback + bottom hairline). Single usage (home), over the wash.
- ✅ `AppBottomSheet` restructured outer(shadow+radius+transform) / inner(overflow-clip+glass) so the indigo shadow now renders.
- ✅ `eyebrow`: **left available, not swept** (locked decision — per-screen design judgment, not a token task; variant ready since Phase 2).
- ✅ **AA contrast check** (computed, WCAG):

  | Pair | Ratio | Verdict |
  |---|---|---|
  | body `ink-700` on canvas / page-wash | 16:1 / 15:1 | PASS AA |
  | muted `ink-500` on white | 8.6:1 | PASS AA |
  | `primary #262261` on white / white on primary btn | 14:1 | PASS AA |
  | dark body `#E5E4EE` on dark canvas | 13.5:1 | PASS AA |
  | **`accent`/`secondary #787CF2` on white** | **3.5:1** | **FAILS AA-Normal** (AA-Large/UI only) |
  | `accentHover #5559D6` on white | 5.5:1 | PASS AA |

  → Rule documented in CLAUDE.md: body/inline-link text uses `accentHover`, not `accent`/`secondary`. **2 live violations fixed** (profile small-text in `secondary` → `accentHover`). White-on-`accent` button labels (3.5:1) are OK only because labels are large/bold (AA-Large 3:1).
- ✅ CLAUDE.md updated: Design system section, Fonts/`useFontFamily` trap, `react-native-svg` mock gotcha, no-tests-for-token-files rule.
- ✅ Verified: `npx tsc --noEmit` exit 0, `npx jest` 9 suites / 46 tests.
- ⏳ **Final sign-off (requester):** **Metro reload is sufficient** (no native changes this phase). Run the full QA matrix below.

---

## 7. Closing QA matrix (requester)

Migration is **code-complete**. Final acceptance = walk this matrix on device:

- **Light + Dark** × **EN + AR (RTL)** × **Android + iOS**.
- Screens with wash: home, leave, history, profile, new-vacation, new-permission, leave/permission detail. **Auth + splash intentionally unchanged.**
- Glass: open any bottom sheet (leave-type / permission-type picker) — expect frosted panel + indigo shadow; home header is a frosted bar. Android = opacity fallback (no live blur, by design).
- Fonts: EN = Livvic, AR = Cairo (test Arabic explicitly — the canary for a missing earlier native rebuild).
- Spot-check: cards have indigo shadow + 20px radius; buttons fixed 48/40/32; no orange anywhere except the deliberate `spark` usages.

---

## 6. Decisions — resolved (Phase 0 unblocked)

1. **`secondary` vs `accent`:** ✅ **Add dedicated `colors.accent` (`#787CF2`); keep `secondary` as a transitional alias** pointing at it. No mass find-replace; drop the alias post-migration.
2. **Spacing/radius naming:** ✅ **Extend additively, surgical.** Legacy names keep their original values (screens render identically at Phase 1); DS steps added under new keys (`spacing.sm/ml/xxxl/huge`, `radius.xs/md/lg/xxl`). Components opt into DS radii during Phase 4.
3. **`leaveTypes` palette:** ✅ (recommended default) keep the semantically-anchored hues (sick=danger, annual=success) for recognisability; re-tint only the arbitrary ones toward the indigo/lavender family.
4. **`--grad-page` radials:** ✅ **SVG `RadialGradient`** via the already-installed `react-native-svg` — faithful to the DS, accepts one extra render layer behind the page.
5. **`system` theme mode:** ✅ (recommended default) **defer** — stay manual light/dark for this migration.

## 7. Risks

- **Visual shock:** orange→indigo touches every screen. Mitigated by the Phase 1 stakeholder gate.
- **Android glass:** `backdrop-filter` has no RN equivalent; community/blur on Android is inconsistent — rely on the DS-prescribed opacity fallback, don't over-invest in true blur.
- **Font names:** iOS keys fonts by PostScript name, not filename — must verify post-`react-native-asset` (e.g. `Livvic-SemiBold`, `Cairo-SemiBold`).
- **Radial gradient:** unsupported by the linear-gradient lib; SVG path adds a render layer behind the page.
- **em→px tracking:** DS letter-spacing is in `em`; RN `letterSpacing` is absolute px — convert per font size.
