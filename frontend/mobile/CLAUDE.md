# CLAUDE.md — DevOps-PeopleOps Mobile

Instructions for Claude Code (and human teammates) working in this app.
Read this **before** making changes.

> **Backend** lives at `D:\Work\Slack-Daily-Attendance` (separate repo) with
> its own `CLAUDE.md`. The two repos move together; coordinate API changes.

---

## Project overview

React Native 0.85 + React 19 + Redux Toolkit + i18next bare app (no Expo).
Targets Android and iOS. Connects to the Slack-Daily-Attendance .NET
backend via JWT-authenticated REST. Authentication is Firebase (email +
password) or Zoho OAuth; the JWT carries a `role` custom claim that gates
features.

Layered structure (clean architecture):

```
src/
├── core/             logger + DI + storage keys
├── domain/           pure entities, repositories (interfaces), use cases
├── data/             dtos, data_sources (HTTP), repository impls, mappers
├── presentation/     screens, components, store (Redux), navigation, theme
└── di/               ServiceLocator + AppConfig (mock flags etc.)
```

`presentation` may import from `domain` and `data` only via use cases / DI;
nothing in `data` or `domain` should import `presentation`.

---

## Commands

```bash
# Install / refresh deps
npm install
cd ios && pod install   # iOS only

# Type-check (always)
npx tsc --noEmit

# Test
npx jest

# Run
npx react-native run-android
npx react-native run-ios
npx react-native start    # metro bundler if not auto-started
```

---

## Conventions

### Components

PascalCase per file pair: `app_attachment_picker/app_attachment_picker.tsx`
+ `app_attachment_picker/index.ts`. Re-exported from
`presentation/components/{atoms|molecules|organisms}/index.ts`. Theme via
`useTheme()` from `@themes/index`; sizes via `hs()`, `ws()`, `fs()` from
`@/presentation/utils/scaling`. **There is no `vs()`** — use `hs()` for
vertical scaling.

### State

Redux Toolkit slices in `presentation/store/slices/`. Async work goes
through `createAsyncThunk` against use cases resolved from `ServiceLocator`.
Selectors in `presentation/store/selectors/`. Components use
`useAppSelector` / `useAppDispatch` from `presentation/store/hooks`.

### i18n

Strings live in `presentation/localization/languages/{en,ar}.ts`. Both
locales must stay in lockstep: every key added to one must exist in the
other. Components use `t('namespace.key')`. Arabic ships full
right-to-left translations — preserve any Egyptian-Arabic phrasing you find.

### Logging

Per-feature loggers in `core/logger/`: `attendanceLog`, `leaveLog`,
`authLog`, `slackLog`. Each has a typed `Scope` union — pass exactly one
of those literals (e.g. `'data_source'`, `'repository'`, `'screen'`).

### HTTP

One `HttpClient` (`data/data_sources/http/http_client.ts`) per app, keyed
by base URL + token provider. JWT is auto-attached via the token provider.
For multipart, use `postMultipart()` — it deliberately omits
`Content-Type` so fetch fills in the boundary.

---

## Mock toggles

`AppConfig` in `src/di/config.ts` exposes per-feature mock flags:

| Flag | Default | What it controls |
|---|---|---|
| `USE_MOCK_LEAVE` | `false` | Vacation/leave endpoints |
| `USE_MOCK_PERMISSIONS` | `false` | Permission endpoints |

When you flip a flag, **every repo path for that feature must read it**.
A common bug: a repo method short-circuits to a static mock (e.g.
returning `MOCK_QUOTA` directly) and never goes through the data source.
Once the flag flips, that path keeps returning mock data silently.

---

## Operational gotchas (lessons learned)

### Document picker library: use `@react-native-documents/picker`

`react-native-document-picker` (the older library) is **deprecated and
broken** on RN 0.79+ — it references `GuardedResultAsyncTask`, a Java
class that was removed from React Native core. The maintained successor
is `@react-native-documents/picker` (same author, rebranded). The API
differs slightly:

| Old | New |
|---|---|
| `DocumentPicker.pickSingle({ type, copyTo })` | `pick({ type, allowMultiSelection: false })` returns `NonEmptyArray`, take `[0]` |
| `isCancel(e)` | `isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED` |
| `picked.fileCopyUri ?? picked.uri` | `picked.uri` (call `keepLocalCopy` separately if needed; see next item) |

### Multipart uploads on Android need `keepLocalCopy`

The picker returns a `content://` URI on Android with a transient read
permission. RN's `fetch` *should* be able to stream it through `FormData`
according to the docs, but in practice this fails with `TypeError:
Network request failed` once the permission expires. Defensive fix: on
Android, call `keepLocalCopy({ files, destination: 'cachesDirectory' })`
to convert to a stable `file://` URI, then upload.

```ts
let uploadUri = picked.uri;
if (Platform.OS === 'android') {
  const [copy] = await keepLocalCopy({
    files: [{ uri: picked.uri, fileName }],
    destination: 'cachesDirectory',
  });
  if (copy.status === 'success') uploadUri = copy.localUri;
}
```

iOS already returns `file://`, so the copy is a no-op — only run on
Android.

### Lazy-fetch tab data; never fetch all tabs on mount

When a screen has tabs (e.g. `leave_screen.tsx` with Leave + Permission),
do **not** fetch every tab's data on mount. Fetch the active tab eagerly
and the inactive tab on first switch. Drive the lazy fetch from a status
selector so failed fetches retry on the next switch:

```ts
useEffect(() => {
  if (activeTab !== 'permission') return;
  if (status === 'idle' || status === 'error') {
    dispatch(fetchPermissionQuota());
    dispatch(fetchPermissionRequests({ append: false }));
  }
}, [activeTab, status, dispatch]);
```

This also handles the "BE was down at first mount, came back up later"
case for free.

### ngrok base URL changes every restart

If you're tunnelling the local BE through `ngrok-free.dev` for device
testing, the public hostname rotates whenever the tunnel restarts. Update
`AppConfig.API_BASE_URL` in `src/di/config.ts` for each new session.
Free ngrok also injects a click-through warning page for **browser**
visits, but doesn't affect API calls — so it's not a cause of upload
failures.

### Adding a native module needs a rebuild

After `npm install` of any package with native code (document picker,
firebase, datetimepicker, etc.):

```bash
cd ios && pod install
# then re-run from a clean state
npx react-native run-android
npx react-native run-ios
```

The Metro bundler hot-reload alone does **not** pick up new native code.

### Pre-existing test-suite failures from `react-native-inappbrowser-reborn`

Three test suites (`App.test.tsx`, `language_context.test.tsx`,
`attendance_history.slice.test.ts`) currently fail with
`SyntaxError: Cannot use import statement outside a module` because
`react-native-inappbrowser-reborn` ships ESM and isn't in jest's
`transformIgnorePatterns` allowlist. **This is pre-existing**, not caused
by recent feature work, and the 8 actual tests inside those suites do
pass when run in isolation. To fix permanently, add
`react-native-inappbrowser-reborn` to the allowlist in `jest.config.js`.

### Native modules + jest

Any package that does native bindings will fail to load in jest unless
mocked. The pattern is in `__mocks__/` — see
`__mocks__/@react-native-documents/picker.js` and the corresponding
`moduleNameMapper` entry in `jest.config.js`. Any new native module
follows the same pattern.

---

## Things not to do

- Don't write to Firestore from the app — the backend owns all writes via
  its service account. Use REST endpoints for mutations.
- Don't bypass `ServiceLocator` to instantiate repositories directly inside
  components. Always go through use cases.
- Don't add new strings without translating them in both `en.ts` and `ar.ts`.
- Don't fetch all tabs of a tabbed screen on mount (see lazy-fetch gotcha
  above).
- Don't hardcode the API base URL — it lives in `AppConfig.API_BASE_URL`.
- Don't ship with `console.log` calls or commented-out code blocks; use
  the per-feature loggers (they respect `*_LOGS_ENABLED` config flags).
