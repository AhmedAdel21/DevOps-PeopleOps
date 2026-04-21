## Task: Implement the "EmployeeRequests" screen from the Pencil design

### Context

- Design file: `design/design.pen` (read-only — do NOT modify it)
- App: React Native 0.85, TypeScript, Redux Toolkit, React Navigation
- Architecture: Clean architecture — screens live in `frontend/mobile/src/presentation/screens/`
- Theme tokens: `frontend/mobile/src/presentation/themes/` (already synced from design)
- Icon library: `lucide-react-native`
- Also provide Dummy Mode

### Step 1 — Read the Pencil design

Use the `mcp__pencil__batch_get` tool to read the screen node and its children:
batch_get(
patterns: [],
nodeIds: ["Node ID: vkaE1","Node ID: u4fOk"],
readDepth: 5
)

Also read the design system variables to confirm colour/spacing tokens:
mcp**pencil**get_variables()

Do NOT use `batch_design` or any write operation on the .pen file.

### Step 2 — Understand the existing conventions

Before writing a single line of code, read these files:

1. `frontend/mobile/src/presentation/themes/light.theme.ts` — colour & spacing tokens
2. `frontend/mobile/src/presentation/themes/typography.ts` — font sizes, weights, families
3. `frontend/mobile/src/presentation/screens/home/home_screen.tsx` — reference screen structure
4. `frontend/mobile/src/presentation/components/` — check for any shared components you can reuse

### Step 3 — Implement the screen

Create a new screen file at:
`frontend/mobile/src/presentation/screens/[folder_name]/[screen_name]_screen.tsx`
Rules:

- Use `useTheme()` from `theme_context` to access tokens — never hardcode hex values
- Map every design token (colour, spacing, radius, font) to the corresponding theme key
- Reproduce the layout faithfully: match flex direction, gap, padding, and alignment from the Pencil design
- Use `lucide-react-native` for icons (match icon names to what you see in the design)
- Add `StyleSheet.create` at the bottom of the file — no inline styles except for dynamic values
- Export a named component and a default export

### Step 4 — Wire up navigation (if needed)

If the screen is new (not yet referenced in navigation):

- Add it to `frontend/mobile/src/presentation/navigation/` following the existing stack/tab pattern
- Add the route type to the navigation param list

### Step 5 — Verify

After writing the screen:

- Run `cd frontend/mobile && npx tsc --noEmit` and fix any TypeScript errors
- Check that no hardcoded colours remain (`grep -r "#[0-9a-fA-F]" src/presentation/screens/[folder_name]/`)

### Constraints

- DO NOT edit `design/design.pen` or any `.pen` file
- DO NOT modify existing screens unless wiring up navigation
- Pixel-perfect fidelity to the Pencil design is the goal
