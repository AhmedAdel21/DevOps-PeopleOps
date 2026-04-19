# Attendance History Feature Design

**Date:** 2026-04-19  
**Status:** Approved

---

## Overview

Integrate the `GET /api/attendance/me/history` endpoint into the app using the existing clean-architecture layers. The home screen "Recent" section shows the 5 most recent records. "View full history" navigates to a dedicated `HistoryScreen` with cursor-based infinite scroll (oldest-to-newest, newest first in list).

---

## Architecture

### New files

| Path | Purpose |
|------|---------|
| `domain/entities/attendance_record.entity.ts` | `AttendanceRecord`, `AttendanceHistoryPage`, status/place types |
| `domain/use_cases/attendance/get_attendance_history.use_case.ts` | `GetAttendanceHistoryUseCase` |
| `data/dtos/attendance/attendance_history.dto.ts` | `AttendanceRecordDto`, `AttendanceHistoryResponseDto` |
| `data/mappers/attendance/attendance_history.mapper.ts` | DTO → domain mapping |
| `presentation/screens/history/history_screen.tsx` | Full history screen with infinite scroll |
| `presentation/screens/history/index.ts` | Barrel export |
| `presentation/components/atoms/app_attendance_record_card/app_attendance_record_card.tsx` | Single-record card atom |
| `presentation/components/atoms/app_attendance_record_card/index.ts` | Barrel export |

### Modified files

| Path | Change |
|------|--------|
| `domain/repositories/attendance.repository.ts` | Add `getHistory` to interface |
| `domain/use_cases/attendance/index.ts` | Export new use case |
| `data/data_sources/attendance/attendance.remote_data_source.ts` | Add `getHistory` method |
| `data/repositories/attendance.repository_impl.ts` | Implement `getHistory` |
| `data/dtos/attendance/index.ts` | Export new DTOs |
| `data/mappers/attendance/index.ts` | Export new mapper |
| `presentation/store/slices/attendance.slice.ts` | Add history state + `fetchAttendanceHistory` thunk |
| `presentation/store/selectors/attendance.selectors.ts` | Add history selectors |
| `presentation/navigation/root_navigation.tsx` | Add `History` route |
| `presentation/navigation/types.ts` | Add `History` to `RootStackParamList` |
| `presentation/screens/home/home_screen.tsx` | Fill "Recent" section |
| `presentation/components/atoms/index.ts` | Export new card atom |
| `core/keys/di.key.ts` | Add `GET_ATTENDANCE_HISTORY_USE_CASE` |
| `di/service_locator.ts` | Register new use case |
| `localization/languages/en.ts` | Add `attendance.history.*` keys |
| `localization/languages/ar.ts` | Add `attendance.history.*` keys |

---

## Domain Layer

### `attendance_record.entity.ts`

```ts
export type AttendanceRecordStatus =
  | 'signed_out'
  | 'in_office'
  | 'wfh'
  | 'not_checked_in'
  | 'vacation'
  | 'absent';

export type AttendanceRecordPlace = 'in_office' | 'wfh';

export interface AttendanceRecord {
  date: string;                         // yyyy-MM-dd
  status: AttendanceRecordStatus;
  place: AttendanceRecordPlace | null;
  signInAt: Date | null;
  signOutAt: Date | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryPage {
  items: AttendanceRecord[];
  nextCursor: string | null;            // null = no more pages
}
```

### `AttendanceRepository` interface addition

```ts
getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage>;
```

### `GetAttendanceHistoryUseCase`

```ts
export interface GetAttendanceHistoryInput {
  before?: string;
  pageSize?: number;
}

export class GetAttendanceHistoryUseCase
  extends UseCase<GetAttendanceHistoryInput, AttendanceHistoryPage> {
  constructor(private readonly repo: AttendanceRepository) { super(); }

  async execute(input: GetAttendanceHistoryInput = {}): Promise<AttendanceHistoryPage> {
    attendanceLog.info('use_case', `GetAttendanceHistoryUseCase.execute → before=${input.before ?? 'none'}`);
    try {
      const page = await this.repo.getHistory(input);
      attendanceLog.info('use_case', `GetAttendanceHistoryUseCase.execute → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`);
      return page;
    } catch (e) {
      attendanceLog.error('use_case', 'GetAttendanceHistoryUseCase.execute threw (rethrowing)', e);
      throw e;
    }
  }
}
```

---

## Data Layer

### `attendance_history.dto.ts`

```ts
export interface AttendanceRecordDto {
  date: string;
  status: string;            // 'InOffice' | 'Wfh' | 'SignedOut' | 'NotCheckedIn' | 'Vacation' | 'Absent'
  place: string | null;      // 'InOffice' | 'Wfh' | null
  signInTime: string | null; // ISO 8601
  signOutTime: string | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryResponseDto {
  items: AttendanceRecordDto[];
  nextCursor: string | null;
}
```

### `attendance_history.mapper.ts`

```ts
const toDomainRecordStatus = (raw: string): AttendanceRecordStatus => {
  switch (raw) {
    case 'InOffice':      return 'in_office';
    case 'Wfh':           return 'wfh';
    case 'SignedOut':     return 'signed_out';
    case 'Vacation':      return 'vacation';
    case 'Absent':        return 'absent';
    default:              return 'not_checked_in';
  }
};

const toDomainRecordPlace = (raw: string | null): AttendanceRecordPlace | null => {
  if (raw === 'InOffice') return 'in_office';
  if (raw === 'Wfh')      return 'wfh';
  return null;
};

export const attendanceRecordDtoToDomain = (dto: AttendanceRecordDto): AttendanceRecord => ({
  date: dto.date,
  status: toDomainRecordStatus(dto.status),
  place: toDomainRecordPlace(dto.place),
  signInAt: dto.signInTime ? new Date(dto.signInTime) : null,
  signOutAt: dto.signOutTime ? new Date(dto.signOutTime) : null,
  workedMinutes: dto.workedMinutes,
});

export const attendanceHistoryResponseDtoToDomain = (
  dto: AttendanceHistoryResponseDto,
): AttendanceHistoryPage => ({
  items: dto.items.map(attendanceRecordDtoToDomain),
  nextCursor: dto.nextCursor,
});
```

### `AttendanceRemoteDataSource` addition

```ts
async getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryResponseDto> {
  const query = new URLSearchParams();
  if (params.before)   query.set('before', params.before);
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  const path = qs ? `/api/attendance/me/history?${qs}` : '/api/attendance/me/history';
  attendanceLog.info('data_source', `GET ${path}`);
  return this.http.get<AttendanceHistoryResponseDto>(path);
}
```

### `AttendanceRepositoryImpl` addition

```ts
async getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage> {
  attendanceLog.info('repository', `getHistory called (before=${params.before ?? 'none'})`);
  try {
    const dto = await this.ds.getHistory(params);
    const page = attendanceHistoryResponseDtoToDomain(dto);
    attendanceLog.info('repository', `getHistory → ${page.items.length} items`);
    return page;
  } catch (e) {
    const mapped = mapHttpErrorToAttendance(e);
    attendanceLog.error('repository', `getHistory failed (code=${mapped.attendanceCode})`);
    throw mapped;
  }
}
```

---

## Redux Layer

### New state shape (additions to `AttendanceState`)

```ts
interface SerializableAttendanceRecord {
  date: string;
  status: AttendanceRecordStatus;
  place: AttendanceRecordPlace | null;
  signInAtIso: string | null;
  signOutAtIso: string | null;
  workedMinutes: number | null;
}

// Added to AttendanceState:
historyItems: SerializableAttendanceRecord[];
historyNextCursor: string | null;
historyHasMore: boolean;
historyFetchStatus: 'idle' | 'pending' | 'loaded' | 'error';
historyFetchError: SerializableDomainError | null;
```

### New thunk

```ts
fetchAttendanceHistory = createAsyncThunk<
  { items: SerializableAttendanceRecord[]; nextCursor: string | null; append: boolean },
  { before?: string; pageSize?: number; append: boolean },
  { rejectValue: SerializableDomainError }
>('attendance/fetchHistory', async ({ before, pageSize, append }, { rejectWithValue }) => {
  const useCase = ServiceLocator.get<GetAttendanceHistoryUseCase>(DiKeys.GET_ATTENDANCE_HISTORY_USE_CASE);
  try {
    const page = await useCase.execute({ before, pageSize });
    return {
      items: page.items.map(serializeAttendanceRecord),
      nextCursor: page.nextCursor,
      append,
    };
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});
```

Reducer cases:
- `pending`: set `historyFetchStatus = 'pending'`; if `!append` clear `historyFetchError`
- `fulfilled`: if `append` spread items; if `!append` replace items; set `historyNextCursor`, `historyHasMore = nextCursor !== null`, `historyFetchStatus = 'loaded'`
- `rejected`: set `historyFetchStatus = 'error'`, `historyFetchError = action.payload`; if `!append` clear `historyItems`

### New selectors

```ts
selectAttendanceHistoryItems        // SerializableAttendanceRecord[]
selectAttendanceHistoryHasMore      // boolean
selectAttendanceHistoryNextCursor   // string | null
selectAttendanceHistoryFetchStatus  // 'idle' | 'pending' | 'loaded' | 'error'
selectAttendanceHistoryFetchError   // SerializableDomainError | null
```

---

## DI Wiring

`DiKeys`:
```ts
GET_ATTENDANCE_HISTORY_USE_CASE: 'getAttendanceHistoryUseCase',
```

`ServiceLocator.initialize()`:
```ts
ServiceLocator.register(
  DiKeys.GET_ATTENDANCE_HISTORY_USE_CASE,
  new GetAttendanceHistoryUseCase(attendanceRepo),
);
```

---

## Navigation

Add to `RootStackParamList`:
```ts
History: undefined;
```

Add `HistoryScreen` to the native stack in `root_navigation.tsx`. Navigated to from the home screen "View full history" link.

---

## Presentation

### `AppAttendanceRecordCard` (new atom)

Props:
```ts
interface AppAttendanceRecordCardProps {
  record: SerializableAttendanceRecord;
}
```

Layout (single row card):
- **Left column:** date formatted as `Mon, Apr 15` + status badge
- **Right column:** place label, `signIn → signOut` times in local time, worked hours as `Xh Ym`
- `not_checked_in` items: muted placeholder row, no times/place shown

Status badge colors (mapped from `theme.colors`). `status.info` is confirmed present; implementer should verify `status.success`, `status.warning`, `status.error` exist or use fallback hex values:
| Status | Color token |
|--------|-------------|
| `in_office` | `primary` |
| `wfh` | `status.info.base` |
| `signed_out` | `status.success.base` |
| `not_checked_in` | `mutedForeground` |
| `vacation` | `status.warning.base` |
| `absent` | `status.error.base` |

### Home screen "Recent" section

On mount (in existing `useEffect` alongside `fetchAttendanceStatus`), dispatches:
```ts
dispatch(fetchAttendanceHistory({ append: false, pageSize: 5 }));
```

Renders below the sign-in card:
- **Loading:** 3 skeleton placeholder rows
- **Loaded (items > 0):** up to 5 `AppAttendanceRecordCard` + "View full history" pressable
- **Loaded (empty):** single muted `AppText` "No attendance history yet"
- **Error:** `AppAlertBanner` variant="error" + retry button

### `HistoryScreen`

On mount dispatches:
```ts
dispatch(fetchAttendanceHistory({ append: false }));  // default pageSize: 14
```

Uses `FlatList` with:
- `data={historyItems}`
- `keyExtractor={item => item.date}`
- `renderItem` → `AppAttendanceRecordCard`
- `onEndReached` → if `historyHasMore && historyFetchStatus !== 'pending'` dispatch append thunk with `before: historyNextCursor`
- `onEndReachedThreshold={0.3}`
- `ListFooterComponent`: spinner when `pending + append`, error banner when `error + append`
- `ListEmptyComponent`: empty state when `loaded` and no items

Full-screen states (non-append):
- Initial load pending: full-screen centered spinner
- Initial load error: full-screen error + retry
- Loaded + empty: full-screen empty state message

---

## i18n Keys

Added under `attendance.history`:

Reuse existing keys: `home.recentTitle` for the section header and `home.historyLink` for the "View full history" link — no new keys needed for those.

```ts
// en
history: {
  title: 'Attendance History',
  empty: 'No attendance history yet',
  loadError: 'Failed to load history. Tap to retry.',
  loadMoreError: 'Failed to load more. Tap to retry.',
  workedHours: '{{h}}h {{m}}m',
  workedHoursOnly: '{{h}}h',
  workedMinutesOnly: '{{m}}m',
  status: {
    inOffice: 'In Office',
    wfh: 'Remote',
    signedOut: 'Signed Out',
    notCheckedIn: 'No Check-in',
    vacation: 'Vacation',
    absent: 'Absent',
  },
  place: {
    inOffice: 'Office',
    wfh: 'Remote',
  },
},
```

Arabic equivalents added to `ar.ts`.

---

## Error Handling

- All network/auth errors go through existing `mapHttpErrorToAttendance` — no new error codes needed
- Append failures keep existing items visible, show inline error banner in list footer
- Fresh load failures show full-screen error with retry
- Retry: re-dispatch `fetchAttendanceHistory({ append: false })` for full-screen error, `fetchAttendanceHistory({ append: true, before: nextCursor })` for append error

---

## Out of Scope

- Pull-to-refresh on history screen
- Date range filtering
- Editing or correcting history records
- Attendance tab screen (still Coming Soon)
