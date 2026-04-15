# Auth & Attendance — Architecture

This document describes the two features wired into the mobile app so far — **Firebase Authentication** and **Attendance backend integration** — and the clean-architecture conventions they share. It covers the layer boundaries, the data flow, the scenarios each layer handles, the DI wiring, and the step-by-step flows executed at runtime.

---

## 1. Scope

Two features are described here.

### 1.1 Authentication
- Email/password sign-in via `@react-native-firebase/auth`.
- Persistent session (Firebase caches credentials in native Keychain/Keystore).
- Observer-driven Redux state: a single `onAuthStateChanged` subscription installed at app bootstrap is the **only** writer of the auth user state.
- Logout button on the Profile screen.
- Existing Forgot Password / OTP / Set Password screens are intentionally left as unwired stubs (Firebase does not offer OTP-based reset).

### 1.2 Attendance backend
- Reads and mutates the employee's attendance status against the backend at `AppConfig.API_BASE_URL` (default `http://localhost:3000`).
- Three endpoints:
  - `GET  /api/attendance/signin`  — returns current `EmployeeStatusDto`
  - `POST /api/attendance/signin`  with body `{ "place": "InOffice" | "WFH" }` — checks in
  - `POST /api/attendance/signout` with empty body — checks out
- All three return the same `EmployeeStatusDto` shape.
- Every request carries `Authorization: Bearer <firebase-id-token>`.
- Errors map to domain-level codes that drive localized messages.

---

## 2. Clean-architecture layers

```
┌───────────────────────────────────────────────────────────┐
│  presentation/                                             │
│  - screens/auth/login                                      │
│  - screens/profile                                         │
│  - screens/home                                            │
│  - navigation/root_navigation                              │
│  - store/slices  (auth, attendance)                        │
│  - store/selectors                                         │
└───────────────────────────────────────────────────────────┘
              ▲                              │
              │ selectors/dispatch            │ calls use cases
              │                              ▼
┌───────────────────────────────────────────────────────────┐
│  domain/                                                   │
│  - entities:     User, Attendance                          │
│  - errors:       DomainError → AuthError, AttendanceError  │
│  - repositories: AuthRepository, AttendanceRepository      │
│  - use_cases:    Login, Logout, ObserveAuthState,          │
│                  GetAttendanceStatus, SignInAttendance,    │
│                  SignOutAttendance                         │
└───────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│  data/                                                     │
│  - data_sources/http: HttpClient (fetch + bearer token)    │
│  - data_sources/auth: FirebaseAuthRemoteDataSource         │
│  - data_sources/attendance: AttendanceRemoteDataSource     │
│  - dtos/attendance: EmployeeStatusDto, SignInRequestDto    │
│  - mappers/auth, mappers/attendance                        │
│  - repositories: AuthRepositoryImpl, AttendanceRepoImpl    │
└───────────────────────────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────┐
│  External                                                  │
│  - @react-native-firebase/auth                             │
│  - fetch (http://localhost:3000)                           │
└───────────────────────────────────────────────────────────┘
```

**Cross-cutting**

- `di/service_locator.ts` — manual service locator wiring everything up.
- `core/keys/di.key.ts` — string keys used by the locator.
- `core/logger` — toggleable structured loggers (`authLog`, `attendanceLog`).

### 2.1 Layer rules the code enforces

- **Only** `FirebaseAuthRemoteDataSource` imports from `@react-native-firebase/auth`. No other layer ever references Firebase types.
- **Only** `HttpClient` calls `fetch`. The token provider is injected as a plain `() => Promise<string | null>`, so `HttpClient` does not know Firebase exists.
- Domain types never leak into data types and vice versa. Mappers bridge them.
- Redux slices depend on use cases via `ServiceLocator`; never on repositories or data sources directly.
- Presentation components depend on selectors + dispatched actions; they never import from `domain/` or `data/` directly, except for type-only imports of enums (e.g. `AttendanceErrorCode`) for building i18n keys.

---

## 3. File inventory

### 3.1 Shared
| Path | Purpose |
|---|---|
| `src/di/config.ts` | `AppConfig` — API base URL, log flags |
| `src/di/service_locator.ts` | Manual DI container; `initialize()` constructs every layer |
| `src/core/keys/di.key.ts` | `DiKeys` const — typed service-locator keys |
| `src/core/logger/auth.logger.ts` | `authLog` — toggleable scoped logger for the auth flow |
| `src/core/logger/attendance.logger.ts` | `attendanceLog` — toggleable scoped logger for the attendance flow |
| `src/core/logger/index.ts` | Barrel |

### 3.2 Domain
| Path | Purpose |
|---|---|
| `domain/entities/user.entity.ts` | `User` — Firebase-facing fields only |
| `domain/entities/attendance.entity.ts` | `Attendance`, `AttendancePlace`, `AttendanceStatus` |
| `domain/errors/domain_error.ts` | Base `DomainError` with `code` |
| `domain/errors/auth.error.ts` | `AuthError` + `AuthErrorCode` union |
| `domain/errors/attendance.error.ts` | `AttendanceError` + `AttendanceErrorCode` |
| `domain/repositories/auth.repository.ts` | `AuthRepository`, `AuthStateSubscription` interfaces |
| `domain/repositories/attendance.repository.ts` | `AttendanceRepository` interface |
| `domain/use_cases/use_case.base.ts` | `UseCase<In,Out>` (async) and `SyncUseCase<In,Out>` |
| `domain/use_cases/auth/*` | `LoginUseCase`, `LogoutUseCase`, `ObserveAuthStateUseCase` |
| `domain/use_cases/attendance/*` | `GetAttendanceStatusUseCase`, `SignInAttendanceUseCase`, `SignOutAttendanceUseCase` |

### 3.3 Data
| Path | Purpose |
|---|---|
| `data/data_sources/auth/firebase_auth.remote_data_source.ts` | Wraps `auth()` — sign-in, sign-out, `getCurrentUser`, `getIdToken`, `observe` |
| `data/data_sources/http/http_client.ts` | Generic `fetch` client with bearer-token injection and `HttpError` |
| `data/data_sources/attendance/attendance.remote_data_source.ts` | Three endpoint methods on top of `HttpClient` |
| `data/dtos/attendance/employee_status.dto.ts` | `EmployeeStatusDto`, `SignInRequestDto`, `ErrorBodyDto` |
| `data/mappers/auth/firebase_user.mapper.ts` | `FirebaseAuthTypes.User` → domain `User` |
| `data/mappers/auth/firebase_error.mapper.ts` | Firebase error → `AuthError` |
| `data/mappers/attendance/attendance.mapper.ts` | `EmployeeStatusDto` → `Attendance`, plus `placeToDto` |
| `data/mappers/attendance/http_error.mapper.ts` | `HttpError` → `AttendanceError` |
| `data/repositories/auth.repository_impl.ts` | Composes auth data source + mappers |
| `data/repositories/attendance.repository_impl.ts` | Composes attendance data source + mappers |

### 3.4 Presentation
| Path | Purpose |
|---|---|
| `presentation/store/index.ts` | `configureStore` with `auth` + `attendance` reducers |
| `presentation/store/hooks.ts` | Typed `useAppDispatch`, `useAppSelector`, `SerializableDomainError` |
| `presentation/store/slices/auth.slice.ts` | `bootstrapAuth`, `loginWithEmail`, `logout` thunks; observer-fed `user`/`status` |
| `presentation/store/slices/attendance.slice.ts` | `fetchAttendanceStatus`, `signInAttendance`, `signOutAttendance` thunks |
| `presentation/store/selectors/*` | Typed selectors for both slices |
| `presentation/navigation/root_navigation.tsx` | Splash gating, login wrapper, auth-loss → Login stack reset |
| `presentation/screens/auth/login/login_screen.tsx` | Controlled `status` + `errorMessage` props |
| `presentation/screens/profile/profile_screen.tsx` | Displays email, dispatches `logout` |
| `presentation/screens/home/home_screen.tsx` | Reads attendance from Redux; dispatches sign-in/sign-out |

---

## 4. DI wiring

```
ServiceLocator.initialize()
│
├── FirebaseAuthRemoteDataSource           (DiKeys.FIREBASE_AUTH_DATA_SOURCE)
│     └── AuthRepositoryImpl               (DiKeys.AUTH_REPOSITORY)
│           ├── LoginUseCase               (DiKeys.LOGIN_USE_CASE)
│           ├── LogoutUseCase              (DiKeys.LOGOUT_USE_CASE)
│           └── ObserveAuthStateUseCase    (DiKeys.OBSERVE_AUTH_STATE_USE_CASE)
│
└── HttpClient                             (DiKeys.HTTP_CLIENT)
      │  baseUrl = AppConfig.API_BASE_URL
      │  tokenProvider = () => firebaseAuthDs.getIdToken()
      │
      └── AttendanceRemoteDataSource       (DiKeys.ATTENDANCE_REMOTE_DATA_SOURCE)
            └── AttendanceRepositoryImpl   (DiKeys.ATTENDANCE_REPOSITORY)
                  ├── GetAttendanceStatusUseCase  (DiKeys.GET_ATTENDANCE_STATUS_USE_CASE)
                  ├── SignInAttendanceUseCase     (DiKeys.SIGN_IN_ATTENDANCE_USE_CASE)
                  └── SignOutAttendanceUseCase    (DiKeys.SIGN_OUT_ATTENDANCE_USE_CASE)
```

`App.tsx` calls `ServiceLocator.initialize()` once at module load (before render), then `bootstrapAuth()` once inside `AppContent`'s effect. Redux slices fetch the use cases they need from the locator by key.

The token provider is a **closure**, not a class reference, so `HttpClient` does not know about Firebase — a test can instantiate `HttpClient` with `() => Promise.resolve('fake')` and it works.

---

## 5. Redux store shape

```ts
RootState = {
  auth: {
    user: User | null;
    status: 'uninitialized' | 'authenticated' | 'unauthenticated';
    loginStatus:  'idle' | 'pending' | 'error';
    loginError:   { code, message } | null;
    logoutStatus: 'idle' | 'pending' | 'error';
    logoutError:  { code, message } | null;
  },
  attendance: {
    current: SerializableAttendance | null;  // dates as ISO strings
    fetchStatus:   'idle' | 'pending' | 'loaded' | 'error';
    fetchError:    { code, message } | null;
    signInStatus:  'idle' | 'pending' | 'error';
    signInError:   { code, message } | null;
    signOutStatus: 'idle' | 'pending' | 'error';
    signOutError:  { code, message } | null;
  }
}
```

**Why two separate "statuses" per slice.** `auth.status` is observer-fed and drives navigation gating; `auth.loginStatus` is thunk-fed and drives the login button spinner. Mixing them into one field would conflate "is a user currently signed in?" with "is a login request in flight?".

**Dates are stored as ISO strings.** Redux Toolkit's serializability check refuses `Date` instances, so the slice converts at the boundary (`toSerializable()`) and the screen rehydrates with `new Date(iso)` when rendering elapsed time.

---

## 6. Error mapping

### 6.1 Auth
| Firebase code | → | `AuthErrorCode` | i18n key |
|---|---|---|---|
| `auth/invalid-email` | → | `invalid-credentials` | `auth.loginScreen.errors.invalidCredentials` |
| `auth/user-not-found` | → | `invalid-credentials` | same |
| `auth/wrong-password` | → | `invalid-credentials` | same |
| `auth/invalid-credential` / `auth/invalid-login-credentials` | → | `invalid-credentials` | same |
| `auth/user-disabled` | → | `user-disabled` | `auth.loginScreen.errors.userDisabled` |
| `auth/too-many-requests` | → | `too-many-requests` | `auth.loginScreen.errors.accountLocked` |
| `auth/network-request-failed` | → | `network` | `auth.loginScreen.errors.network` |
| (anything else) | → | `unknown` | `common.error` |

### 6.2 Attendance
| HTTP status + body | → | `AttendanceErrorCode` | i18n key |
|---|---|---|---|
| network failure (status 0) | → | `network` | `home.errors.network` |
| 401 | → | `unauthenticated` | `home.errors.sessionExpired` |
| 404 + `body.code === "employee_not_linked"` | → | `employee-not-linked` | `home.errors.employeeNotLinked` |
| 400 / 409 | → | `invalid-state` | `home.errors.invalidState` |
| (anything else) | → | `unknown` | `home.errors.generic` |

Error **strings** never appear in data or domain layers. Data maps raw errors to domain codes; presentation maps domain codes to i18n keys.

---

## 7. Logging

Two independent, toggleable loggers:

- `authLog` — controlled by `AppConfig.AUTH_LOGS_ENABLED`. Scopes: `data_source | repository | mapper | use_case | slice | bootstrap | observer | navigation`.
- `attendanceLog` — controlled by `AppConfig.ATTENDANCE_LOGS_ENABLED`. Scopes: `http | data_source | repository | mapper | use_case | slice | screen`.

Both emit `[<feature>] <scope>: <message>` (and an optional extra payload). Emails are masked via `authLog.maskEmail()` before logging. Passwords are never logged. Bearer tokens are never logged in full — only a presence marker (`auth=bearer` vs. `auth=none`) and length.

Flipping either flag to `false` silences every log point of that feature at once without touching any call sites.

---

## 8. Flow: Firebase Authentication

### 8.1 App start — bootstrap

```
App.tsx mounts
  │
  ▼
ServiceLocator.initialize()         (once, at module load)
  │
  ▼
AppContent useEffect → dispatch(bootstrapAuth())
  │
  ▼
bootstrapAuth thunk
  ├── resolve ObserveAuthStateUseCase from DI
  ├── use case calls AuthRepositoryImpl.observeAuthState(cb)
  ├── repo calls FirebaseAuthRemoteDataSource.observe(cb)
  ├── data source calls auth().onAuthStateChanged(rawCb)
  │       rawCb maps raw user → domain User and invokes cb
  │       cb dispatches authSlice.actions.authStateChanged({ user })
  │       reducer sets state.user and flips state.status to
  │       'authenticated' or 'unauthenticated'
  │
  └── Subscription stored in a module-level variable so that
      a second bootstrap dispatch is a no-op.
```

Firebase emits the current state **synchronously** on subscribe, so by the time the next microtask runs, the Redux state is no longer `'uninitialized'`.

### 8.2 Splash gate

```
SplashWrapper renders
  │
  ├── starts a 2s minimum branding timer
  ├── reads selectAuthStatus from Redux
  │
  └── useEffect on [minDelayElapsed, authStatus]:
        if !minDelayElapsed → wait
        if authStatus === 'uninitialized' → wait
        else navigation.replace(
          authStatus === 'authenticated' ? 'MainTabs' : 'Login'
        )
```

### 8.3 Login

```
User taps Sign In
  │
  ▼
LoginScreen → handleSubmit → onSubmit({email, password})
  │
  ▼
LoginWrapper → dispatch(loginWithEmail({email, password}))
  │
  ▼
loginWithEmail thunk
  ├── status → 'pending'
  ├── LoginUseCase.execute → AuthRepositoryImpl.signIn
  ├──   → FirebaseAuthRemoteDataSource.signIn
  ├──     → auth().signInWithEmailAndPassword(...)
  │
  ├── (a) success path
  │     thunk resolves void
  │     loginStatus → 'idle'
  │     ALSO: Firebase's observer fires inside
  │     AuthRepositoryImpl.observeAuthState → dispatches
  │     authStateChanged({ user }) → reducer flips
  │     status to 'authenticated'
  │
  └── (b) failure path
        AuthRepositoryImpl catches the error and rethrows as
        AuthError via mapFirebaseAuthError
        thunk rejectWithValue({ code, message })
        loginStatus → 'error', loginError → payload
```

The screen renders a banner whenever `loginError` is set, using `t(ERROR_I18N_KEY[resolveErrorCode(err.code)])`. When `authStatus` flips to `'authenticated'`, `LoginWrapper`'s effect resets the stack to `MainTabs` (Login falls out of history).

### 8.4 Logout

```
User taps Sign out on Profile screen
  │
  ▼
dispatch(logout())
  │
  ▼
logout thunk → LogoutUseCase → AuthRepositoryImpl.signOut
  → FirebaseAuthRemoteDataSource.signOut → auth().signOut()
  │
  ▼
Firebase observer fires with user=null
  │
  ▼
authSlice.authStateChanged({ user: null }) → status = 'unauthenticated'
  │
  ▼
RootNavigation's watcher sees authenticated → unauthenticated
  and resets the root stack to [{ name: 'Login' }].
```

The logout button itself does **not** call `navigation.reset`. Navigation reset is centralized in `RootNavigation`'s `useEffect` so any auth-loss path (explicit logout, token revocation, account disabled, etc.) goes through the same code.

### 8.5 Session persistence

Firebase caches credentials natively. A returning user who launches the app:
1. `ServiceLocator.initialize()` runs.
2. `bootstrapAuth()` installs the observer.
3. Firebase's observer fires **immediately** with the persisted user.
4. The reducer sets `status` to `'authenticated'`.
5. Once the 2 s splash delay elapses, the splash routes to `MainTabs`.

No login screen is shown.

---

## 9. Flow: Attendance backend integration

### 9.1 HTTP request shape

Every call:

```
HttpClient.request(method, path, body?)
  │
  ├── const token = await tokenProvider()    // firebaseAuthDs.getIdToken()
  ├── headers:
  │     Accept: application/json
  │     Content-Type: application/json (when body)
  │     Authorization: Bearer <token>         (when token)
  │
  ├── fetch(baseUrl + path, {method, headers, body: JSON.stringify(body)})
  │
  ├── on network failure → throw HttpError(0, null, 'Network request failed')
  │
  ├── parse body as JSON (fall back to text)
  │
  ├── on !response.ok → throw HttpError(status, body, message)
  │
  └── return parsed body as T
```

### 9.2 Fetch current status — home screen mount

```
HomeScreen mounts (already inside MainTabs → user is authenticated)
  │
  ▼
useEffect → dispatch(fetchAttendanceStatus())
  │
  ▼
thunk → GetAttendanceStatusUseCase → AttendanceRepositoryImpl.getCurrentStatus
  │
  ▼
AttendanceRemoteDataSource.getCurrentStatus
  → HttpClient.get('/api/attendance/signin')
  → GET http://localhost:3000/api/attendance/signin
    Authorization: Bearer <firebase-id-token>
  │
  ▼ response body = EmployeeStatusDto
  │
  ▼
employeeStatusDtoToDomain(dto) → Attendance entity
  status 'InOffice' → 'in_office'
  status 'WFH'      → 'wfh'
  else              → 'not_signed_in'
  signInUtc (ISO)   → Date
  │
  ▼
Repository returns Attendance to use case
use case returns to thunk
thunk converts to SerializableAttendance and resolves
  │
  ▼
Reducer: state.current = payload, fetchStatus = 'loaded'
  │
  ▼
HomeScreen re-renders:
  - greeting uses current.displayName
  - status card reflects 'notSignedIn' / 'signedInOffice' / 'signedInRemote'
  - "since" label is formatted from current.signInAtIso
```

### 9.3 Sign in (check in)

```
User taps "Sign In" → SignInLocationSheet opens
User picks Office or Remote, picks a time (time is informational in the UI;
    backend uses server clock), taps Confirm
  │
  ▼
HomeScreen.handleConfirmSignIn(mode) dispatches
  signInAttendance({ place: mode === 'office' ? 'in_office' : 'wfh' })
  │
  ▼
thunk → SignInAttendanceUseCase → AttendanceRepositoryImpl.signIn(place)
  │
  ▼
repo.signIn maps place → 'InOffice' | 'WFH' (placeToDto)
  → AttendanceRemoteDataSource.signIn('InOffice' | 'WFH')
  → HttpClient.post('/api/attendance/signin', { place })
  → POST http://localhost:3000/api/attendance/signin
    Authorization: Bearer <firebase-id-token>
    Body: { "place": "InOffice" }
  │
  ▼
Success: DTO comes back → mapper → Attendance → SerializableAttendance
thunk resolves → reducer updates current and fetchStatus → UI re-renders
    in signed-in state (office or remote).
```

### 9.4 Sign out (check out)

```
User taps "Sign out" on HomeScreen
  │
  ▼
dispatch(signOutAttendance())
  │
  ▼
thunk → SignOutAttendanceUseCase → AttendanceRepositoryImpl.signOut
  → AttendanceRemoteDataSource.signOut
  → HttpClient.post('/api/attendance/signout', {})
  → POST http://localhost:3000/api/attendance/signout
    Authorization: Bearer <firebase-id-token>
  │
  ▼
Response: EmployeeStatusDto with status === 'NotSignedIn' (or similar)
mapper → Attendance with status = 'not_signed_in'
reducer → current updated, UI flips to "not signed in" state.
```

### 9.5 Failure scenarios

- **Missing / expired Firebase token** → backend returns 401 → `HttpError(401, ...)` → mapped to `AttendanceError('unauthenticated', ...)` → rejected thunk → reducer sets `signInError`/`fetchError` → HomeScreen shows the banner "Your session has expired".
- **Firebase email doesn't match Slack email** → backend returns 404 with body `{ "code": "employee_not_linked", ... }` → mapped to `AttendanceError('employee-not-linked', ...)` → banner "We couldn't find your employee profile".
- **Device offline / DNS failure** → `fetch` throws → `HttpClient` catches and throws `HttpError(0, null, ...)` → mapped to `AttendanceError('network', ...)` → banner "Network error".
- **Trying to sign out when not signed in** → backend returns 409 (or 400) → mapped to `AttendanceError('invalid-state', ...)` → banner "That action isn't allowed right now".
- **Anything unexpected** → mapped to `AttendanceError('unknown', ...)` → banner "Something went wrong".

The banner in HomeScreen is a `Pressable` wrapping `AppAlertBanner`; tapping it clears the error (`clearAttendanceErrors`).

---

## 10. Native Firebase setup

### 10.1 Android
- `android/build.gradle` — `com.google.gms:google-services:4.4.4` classpath added to `buildscript.dependencies`. (A previous malformed root `plugins {}` block was removed.)
- `android/app/build.gradle` — `apply plugin: "com.google.gms.google-services"` added at the top. (A previous malformed bottom `plugins {}` block was removed.) Firebase BoM is imported for native dependencies.
- `android/app/google-services.json` — moved from `android/` to `android/app/` where Gradle expects it. Package name matches `com.devops.peopleops`.
- Verified with `./gradlew :app:processDebugGoogleServices`.

### 10.2 iOS
- `ios/Podfile` — `pod 'Firebase/Core'` added inside the `mobile` target.
- `ios/mobile/AppDelegate.swift` — `import FirebaseCore` and `FirebaseApp.configure()` as the first line of `didFinishLaunchingWithOptions`.
- Bundle identifier updated to `com.devops.peopleops` in `project.pbxproj`, display name updated in `Info.plist` to match Android.
- `GoogleService-Info.plist` must be downloaded from Firebase Console and added to the Xcode project under the `mobile` target for iOS to work at runtime.
- `cd ios && pod install` after pulling.

### 10.3 Firebase Console prerequisites
- Enable Email/Password sign-in in Authentication → Sign-in method.
- Create test users, or rely on the backend to provision them.
- Users' emails must match their Slack emails (case-insensitive) or the backend returns `employee_not_linked`.

---

## 11. What we did, in order

1. **Native Firebase config** — fixed malformed Gradle blocks, moved `google-services.json`, wired iOS `AppDelegate.configure()` and the `Firebase/Core` pod, aligned iOS bundle ID. Verified with `:app:processDebugGoogleServices`.
2. **Firebase Auth clean-arch implementation** — built the domain/data/DI/redux/presentation stack for email/password login, logout, and session bootstrap. Applied the observer-as-single-source-of-truth pattern: login/logout thunks return void; only the observer writes the user state.
3. **i18n for auth errors** — added `userDisabled` and `network` strings in English and Arabic; repurposed `accountLocked` for `too-many-requests`.
4. **Toggleable auth logger** — `authLog` behind `AppConfig.AUTH_LOGS_ENABLED`, wired across every layer (data source, repository, mapper, use case, slice, navigation). Emails masked, passwords never logged.
5. **HTTP client with bearer injection** — generic `HttpClient` accepting a `TokenProvider` closure, so it stays Firebase-agnostic. Added `getIdToken()` on `FirebaseAuthRemoteDataSource` and wired it up as the token provider in the service locator.
6. **Attendance clean-arch implementation** — domain entities/errors/repo/use cases, data DTO/mapper/error mapper/remote data source/repo impl, Redux slice with Date↔ISO serialization, HomeScreen wired to dispatch on mount and from the sign-in sheet + sign-out button.
7. **i18n for attendance errors** — `home.errors.*` keys added in English and Arabic (`sessionExpired`, `employeeNotLinked`, `invalidState`, `network`, `generic`).
8. **Toggleable attendance logger** — `attendanceLog` behind `AppConfig.ATTENDANCE_LOGS_ENABLED`, covering `http`, `data_source`, `repository`, `mapper`, `use_case`, `slice`, `screen` scopes. Every request logs an arrow in/out plus response status.
9. **Typecheck** — `npx tsc --noEmit` passes cleanly after each major step.

---

## 12. Known gaps / follow-ups

- Profile screen should optionally dispatch `resetAttendanceState()` on logout so stale data isn't visible if a different user signs in.
- The `SignInLocationSheet` lets the user pick a time, but the backend uses the server clock. The picker is currently informational only.
- Forgot Password / OTP / Set Password screens are unwired; Firebase Auth offers only email-link password resets, which doesn't fit that OTP-based flow. Either switch the flow to an email-link, or back it with a custom backend.
- `Attendance` entity has `isAdminOverride`, `overrideMarkedBy`, `overrideNote` fields that the UI does not yet render.
- No caching of the attendance status between app launches; Redux state is in-memory only. A returning user waits for the status fetch to complete after the splash.
- HTTP request retries are not implemented; a transient network hiccup surfaces as an error banner until the user retries manually.
