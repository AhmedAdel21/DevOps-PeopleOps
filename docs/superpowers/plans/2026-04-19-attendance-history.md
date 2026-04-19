# Attendance History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate `GET /api/attendance/me/history` with full clean-architecture layers, a dedicated History screen with cursor-based infinite scroll, and a 5-item Recent preview on the home screen.

**Architecture:** Cursor-based pagination state added to the existing attendance Redux slice alongside current attendance state. A shared `AppAttendanceRecordCard` atom renders in both home preview (5 items, dispatches `pageSize: 5` on mount) and `HistoryScreen` (pageSize: 14 default, appends on scroll via `onEndReached`). The `append` boolean in the thunk payload distinguishes replace vs. extend in the reducer.

**Tech Stack:** React Native, Redux Toolkit (`createAsyncThunk`), react-i18next, lucide-react-native, `FlatList` infinite scroll, existing `HttpClient` with Bearer token injection, `Intl.DateTimeFormat` for locale-aware date/time formatting.

---

## File Map

| Action | Path |
|--------|------|
| Create | `frontend/mobile/src/domain/entities/attendance_record.entity.ts` |
| Modify | `frontend/mobile/src/domain/entities/index.ts` |
| Modify | `frontend/mobile/src/domain/repositories/attendance.repository.ts` |
| Create | `frontend/mobile/src/domain/use_cases/attendance/get_attendance_history.use_case.ts` |
| Modify | `frontend/mobile/src/domain/use_cases/attendance/index.ts` |
| Create | `frontend/mobile/src/data/dtos/attendance/attendance_history.dto.ts` |
| Modify | `frontend/mobile/src/data/dtos/attendance/index.ts` |
| Create | `frontend/mobile/src/data/mappers/attendance/attendance_history.mapper.ts` |
| Modify | `frontend/mobile/src/data/mappers/attendance/index.ts` |
| Modify | `frontend/mobile/src/data/data_sources/attendance/attendance.remote_data_source.ts` |
| Modify | `frontend/mobile/src/data/repositories/attendance.repository_impl.ts` |
| Modify | `frontend/mobile/src/presentation/store/slices/attendance.slice.ts` |
| Modify | `frontend/mobile/src/presentation/store/selectors/attendance.selectors.ts` |
| Modify | `frontend/mobile/src/core/keys/di.key.ts` |
| Modify | `frontend/mobile/src/di/service_locator.ts` |
| Modify | `frontend/mobile/src/presentation/localization/languages/en.ts` |
| Modify | `frontend/mobile/src/presentation/localization/languages/ar.ts` |
| Create | `frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/app_attendance_record_card.tsx` |
| Create | `frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/index.ts` |
| Modify | `frontend/mobile/src/presentation/components/atoms/index.ts` |
| Create | `frontend/mobile/src/presentation/screens/history/history_screen.tsx` |
| Create | `frontend/mobile/src/presentation/screens/history/index.ts` |
| Modify | `frontend/mobile/src/presentation/navigation/types.ts` |
| Modify | `frontend/mobile/src/presentation/navigation/root_navigation.tsx` |
| Modify | `frontend/mobile/src/presentation/screens/home/home_screen.tsx` |

---

### Task 1: Domain entity, repository interface, use case

**Files:**
- Create: `frontend/mobile/src/domain/entities/attendance_record.entity.ts`
- Modify: `frontend/mobile/src/domain/entities/index.ts`
- Modify: `frontend/mobile/src/domain/repositories/attendance.repository.ts`
- Create: `frontend/mobile/src/domain/use_cases/attendance/get_attendance_history.use_case.ts`
- Modify: `frontend/mobile/src/domain/use_cases/attendance/index.ts`

- [ ] **Step 1: Create the entity file**

Create `frontend/mobile/src/domain/entities/attendance_record.entity.ts`:

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
  date: string;                          // yyyy-MM-dd
  status: AttendanceRecordStatus;
  place: AttendanceRecordPlace | null;
  signInAt: Date | null;
  signOutAt: Date | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryPage {
  items: AttendanceRecord[];
  nextCursor: string | null;             // null = no more pages
}
```

- [ ] **Step 2: Export from entities barrel**

Read `frontend/mobile/src/domain/entities/index.ts`, then add at the end:

```ts
export type {
  AttendanceRecord,
  AttendanceHistoryPage,
  AttendanceRecordStatus,
  AttendanceRecordPlace,
} from './attendance_record.entity';
```

- [ ] **Step 3: Add `getHistory` to the repository interface**

In `frontend/mobile/src/domain/repositories/attendance.repository.ts`, add `getHistory` to the interface after `signOut`:

```ts
import type { Attendance, AttendancePlace, AttendanceHistoryPage } from '@/domain/entities';

export interface AttendanceRepository {
  getCurrentStatus(): Promise<Attendance>;
  signIn(place: AttendancePlace): Promise<Attendance>;
  signOut(): Promise<Attendance>;
  getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage>;
}
```

- [ ] **Step 4: Create the use case**

Create `frontend/mobile/src/domain/use_cases/attendance/get_attendance_history.use_case.ts`:

```ts
import { UseCase } from '@/domain/use_cases/use_case.base';
import type { AttendanceRepository } from '@/domain/repositories';
import type { AttendanceHistoryPage } from '@/domain/entities';
import { attendanceLog } from '@/core/logger';

export interface GetAttendanceHistoryInput {
  before?: string;
  pageSize?: number;
}

export class GetAttendanceHistoryUseCase extends UseCase<
  GetAttendanceHistoryInput,
  AttendanceHistoryPage
> {
  constructor(private readonly repo: AttendanceRepository) {
    super();
  }

  async execute(input: GetAttendanceHistoryInput = {}): Promise<AttendanceHistoryPage> {
    attendanceLog.info(
      'use_case',
      `GetAttendanceHistoryUseCase.execute → before=${input.before ?? 'none'}, pageSize=${input.pageSize ?? 'default'}`,
    );
    try {
      const page = await this.repo.getHistory(input);
      attendanceLog.info(
        'use_case',
        `GetAttendanceHistoryUseCase.execute → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`,
      );
      return page;
    } catch (e) {
      attendanceLog.error(
        'use_case',
        'GetAttendanceHistoryUseCase.execute threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}
```

- [ ] **Step 5: Export from use cases barrel**

In `frontend/mobile/src/domain/use_cases/attendance/index.ts`, add:

```ts
export {
  GetAttendanceHistoryUseCase,
  type GetAttendanceHistoryInput,
} from './get_attendance_history.use_case';
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add \
  frontend/mobile/src/domain/entities/attendance_record.entity.ts \
  frontend/mobile/src/domain/entities/index.ts \
  frontend/mobile/src/domain/repositories/attendance.repository.ts \
  frontend/mobile/src/domain/use_cases/attendance/get_attendance_history.use_case.ts \
  frontend/mobile/src/domain/use_cases/attendance/index.ts
git commit -m "feat(attendance): add AttendanceRecord entity, repository interface, and GetAttendanceHistoryUseCase"
```

---

### Task 2: DTO, mapper (with tests), data source, repository

**Files:**
- Create: `frontend/mobile/src/data/dtos/attendance/attendance_history.dto.ts`
- Modify: `frontend/mobile/src/data/dtos/attendance/index.ts`
- Create: `frontend/mobile/src/data/mappers/attendance/attendance_history.mapper.ts`
- Modify: `frontend/mobile/src/data/mappers/attendance/index.ts`
- Modify: `frontend/mobile/src/data/data_sources/attendance/attendance.remote_data_source.ts`
- Modify: `frontend/mobile/src/data/repositories/attendance.repository_impl.ts`
- Test: `frontend/mobile/__tests__/attendance_history.mapper.test.ts`

- [ ] **Step 1: Write failing mapper tests**

Create `frontend/mobile/__tests__/attendance_history.mapper.test.ts`:

```ts
import {
  attendanceRecordDtoToDomain,
  attendanceHistoryResponseDtoToDomain,
} from '../src/data/mappers/attendance/attendance_history.mapper';
import type { AttendanceRecordDto, AttendanceHistoryResponseDto } from '../src/data/dtos/attendance/attendance_history.dto';

test('maps InOffice record with all fields', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-15',
    status: 'InOffice',
    place: 'InOffice',
    signInTime: '2026-04-15T08:00:00Z',
    signOutTime: '2026-04-15T17:00:00Z',
    workedMinutes: 540,
  };
  const record = attendanceRecordDtoToDomain(dto);
  expect(record.date).toBe('2026-04-15');
  expect(record.status).toBe('in_office');
  expect(record.place).toBe('in_office');
  expect(record.signInAt).toEqual(new Date('2026-04-15T08:00:00Z'));
  expect(record.signOutAt).toEqual(new Date('2026-04-15T17:00:00Z'));
  expect(record.workedMinutes).toBe(540);
});

test('maps Wfh record', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-14',
    status: 'Wfh',
    place: 'Wfh',
    signInTime: '2026-04-14T09:00:00Z',
    signOutTime: null,
    workedMinutes: null,
  };
  const record = attendanceRecordDtoToDomain(dto);
  expect(record.status).toBe('wfh');
  expect(record.place).toBe('wfh');
  expect(record.signOutAt).toBeNull();
  expect(record.workedMinutes).toBeNull();
});

test('maps NotCheckedIn record with all nulls', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-13',
    status: 'NotCheckedIn',
    place: null,
    signInTime: null,
    signOutTime: null,
    workedMinutes: null,
  };
  const record = attendanceRecordDtoToDomain(dto);
  expect(record.status).toBe('not_checked_in');
  expect(record.place).toBeNull();
  expect(record.signInAt).toBeNull();
});

test('maps SignedOut status', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-12',
    status: 'SignedOut',
    place: 'InOffice',
    signInTime: '2026-04-12T08:00:00Z',
    signOutTime: '2026-04-12T16:00:00Z',
    workedMinutes: 480,
  };
  expect(attendanceRecordDtoToDomain(dto).status).toBe('signed_out');
});

test('maps Vacation status', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-11',
    status: 'Vacation',
    place: null,
    signInTime: null,
    signOutTime: null,
    workedMinutes: null,
  };
  expect(attendanceRecordDtoToDomain(dto).status).toBe('vacation');
});

test('maps Absent status', () => {
  const dto: AttendanceRecordDto = {
    date: '2026-04-10',
    status: 'Absent',
    place: null,
    signInTime: null,
    signOutTime: null,
    workedMinutes: null,
  };
  expect(attendanceRecordDtoToDomain(dto).status).toBe('absent');
});

test('maps full history response with nextCursor', () => {
  const response: AttendanceHistoryResponseDto = {
    items: [
      { date: '2026-04-15', status: 'InOffice', place: 'InOffice', signInTime: '2026-04-15T08:00:00Z', signOutTime: '2026-04-15T17:00:00Z', workedMinutes: 540 },
      { date: '2026-04-14', status: 'NotCheckedIn', place: null, signInTime: null, signOutTime: null, workedMinutes: null },
    ],
    nextCursor: '2026-04-11',
  };
  const page = attendanceHistoryResponseDtoToDomain(response);
  expect(page.items).toHaveLength(2);
  expect(page.nextCursor).toBe('2026-04-11');
});

test('maps history response with null nextCursor (last page)', () => {
  const response: AttendanceHistoryResponseDto = {
    items: [],
    nextCursor: null,
  };
  const page = attendanceHistoryResponseDtoToDomain(response);
  expect(page.items).toHaveLength(0);
  expect(page.nextCursor).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/mobile && npx jest __tests__/attendance_history.mapper.test.ts --no-coverage
```

Expected: FAIL — mapper files don't exist yet.

- [ ] **Step 3: Create the DTO file**

Create `frontend/mobile/src/data/dtos/attendance/attendance_history.dto.ts`:

```ts
export interface AttendanceRecordDto {
  date: string;
  status: string;           // 'InOffice' | 'Wfh' | 'SignedOut' | 'NotCheckedIn' | 'Vacation' | 'Absent'
  place: string | null;     // 'InOffice' | 'Wfh' | null
  signInTime: string | null;
  signOutTime: string | null;
  workedMinutes: number | null;
}

export interface AttendanceHistoryResponseDto {
  items: AttendanceRecordDto[];
  nextCursor: string | null;
}
```

- [ ] **Step 4: Export DTOs from barrel**

In `frontend/mobile/src/data/dtos/attendance/index.ts`, add:

```ts
export type {
  AttendanceRecordDto,
  AttendanceHistoryResponseDto,
} from './attendance_history.dto';
```

- [ ] **Step 5: Create the mapper**

Create `frontend/mobile/src/data/mappers/attendance/attendance_history.mapper.ts`:

```ts
import type { AttendanceRecord, AttendanceHistoryPage, AttendanceRecordStatus, AttendanceRecordPlace } from '@/domain/entities';
import type { AttendanceRecordDto, AttendanceHistoryResponseDto } from '@/data/dtos/attendance';

const toDomainStatus = (raw: string): AttendanceRecordStatus => {
  switch (raw) {
    case 'InOffice':    return 'in_office';
    case 'Wfh':         return 'wfh';
    case 'SignedOut':   return 'signed_out';
    case 'Vacation':    return 'vacation';
    case 'Absent':      return 'absent';
    default:            return 'not_checked_in';
  }
};

const toDomainPlace = (raw: string | null): AttendanceRecordPlace | null => {
  if (raw === 'InOffice') return 'in_office';
  if (raw === 'Wfh')      return 'wfh';
  return null;
};

export const attendanceRecordDtoToDomain = (dto: AttendanceRecordDto): AttendanceRecord => ({
  date: dto.date,
  status: toDomainStatus(dto.status),
  place: toDomainPlace(dto.place),
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

- [ ] **Step 6: Export mapper from barrel**

In `frontend/mobile/src/data/mappers/attendance/index.ts`, add:

```ts
export {
  attendanceRecordDtoToDomain,
  attendanceHistoryResponseDtoToDomain,
} from './attendance_history.mapper';
```

- [ ] **Step 7: Run mapper tests — expect pass**

```bash
cd frontend/mobile && npx jest __tests__/attendance_history.mapper.test.ts --no-coverage
```

Expected: 8 tests PASS.

- [ ] **Step 8: Add `getHistory` to the data source**

In `frontend/mobile/src/data/data_sources/attendance/attendance.remote_data_source.ts`, add after the existing path constants and before the class closing brace:

Add constant at top (after existing constants):
```ts
const GET_HISTORY_PATH = '/api/attendance/me/history';
```

Add method to the class (after `signOut`):
```ts
  async getHistory(params: {
    before?: string;
    pageSize?: number;
  }): Promise<AttendanceHistoryResponseDto> {
    const query = new URLSearchParams();
    if (params.before)    query.set('before', params.before);
    if (params.pageSize)  query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    const path = qs ? `${GET_HISTORY_PATH}?${qs}` : GET_HISTORY_PATH;
    attendanceLog.info('data_source', `GET ${path}`);
    return this.http.get<AttendanceHistoryResponseDto>(path);
  }
```

Also add the DTO import to the top of the file. The current import is:
```ts
import type {
  EmployeeStatusDto,
  SignInRequestDto,
} from '@/data/dtos/attendance';
```

Change to:
```ts
import type {
  EmployeeStatusDto,
  SignInRequestDto,
  AttendanceHistoryResponseDto,
} from '@/data/dtos/attendance';
```

- [ ] **Step 9: Add `getHistory` to the repository implementation**

In `frontend/mobile/src/data/repositories/attendance.repository_impl.ts`, add the import for the new mapper and entity types, then add the `getHistory` method.

Current imports — add `AttendanceHistoryPage` and the new mapper:
```ts
import type {
  Attendance,
  AttendancePlace,
  AttendanceHistoryPage,
} from '@/domain/entities';
```

```ts
import {
  employeeStatusDtoToDomain,
  mapHttpErrorToAttendance,
  placeToDto,
  attendanceHistoryResponseDtoToDomain,
} from '@/data/mappers/attendance';
```

Add method after `signOut`:
```ts
  async getHistory(params: { before?: string; pageSize?: number }): Promise<AttendanceHistoryPage> {
    attendanceLog.info(
      'repository',
      `getHistory called (before=${params.before ?? 'none'}, pageSize=${params.pageSize ?? 'default'})`,
    );
    try {
      const dto = await this.ds.getHistory(params);
      const page = attendanceHistoryResponseDtoToDomain(dto);
      attendanceLog.info('repository', `getHistory → ${page.items.length} items, nextCursor=${page.nextCursor ?? 'none'}`);
      return page;
    } catch (e) {
      const mapped = mapHttpErrorToAttendance(e);
      attendanceLog.error('repository', `getHistory failed (code=${mapped.attendanceCode})`);
      throw mapped;
    }
  }
```

- [ ] **Step 10: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add \
  frontend/mobile/src/data/dtos/attendance/attendance_history.dto.ts \
  frontend/mobile/src/data/dtos/attendance/index.ts \
  frontend/mobile/src/data/mappers/attendance/attendance_history.mapper.ts \
  frontend/mobile/src/data/mappers/attendance/index.ts \
  frontend/mobile/src/data/data_sources/attendance/attendance.remote_data_source.ts \
  frontend/mobile/src/data/repositories/attendance.repository_impl.ts \
  frontend/mobile/__tests__/attendance_history.mapper.test.ts
git commit -m "feat(attendance): add history DTO, mapper, data source method, and repository method"
```

---

### Task 3: Redux slice history additions + selectors

**Files:**
- Modify: `frontend/mobile/src/presentation/store/slices/attendance.slice.ts`
- Modify: `frontend/mobile/src/presentation/store/selectors/attendance.selectors.ts`
- Test: `frontend/mobile/__tests__/attendance_history.slice.test.ts`

- [ ] **Step 1: Write failing slice tests**

Create `frontend/mobile/__tests__/attendance_history.slice.test.ts`:

```ts
import reducer, {
  fetchAttendanceHistory,
  type AttendanceState,
} from '../src/presentation/store/slices/attendance.slice';
import type { SerializableAttendanceRecord } from '../src/presentation/store/slices/attendance.slice';

const makeRecord = (date: string): SerializableAttendanceRecord => ({
  date,
  status: 'signed_out',
  place: 'in_office',
  signInAtIso: `${date}T08:00:00.000Z`,
  signOutAtIso: `${date}T17:00:00.000Z`,
  workedMinutes: 540,
});

const baseHistoryState = {
  historyItems: [],
  historyNextCursor: null,
  historyHasMore: false,
  historyFetchStatus: 'idle' as const,
  historyFetchError: null,
};

test('fetchAttendanceHistory.pending clears error and sets pending', () => {
  const state = { ...baseHistoryState, historyFetchError: { code: 'err', message: 'x' }, historyFetchStatus: 'error' as const };
  const action = fetchAttendanceHistory.pending('', { append: false });
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyFetchStatus).toBe('pending');
  expect(next.historyFetchError).toBeNull();
});

test('fetchAttendanceHistory.fulfilled with append:false replaces items', () => {
  const existing = [makeRecord('2026-04-10')];
  const incoming = [makeRecord('2026-04-15'), makeRecord('2026-04-14')];
  const state = { ...baseHistoryState, historyItems: existing };
  const action = fetchAttendanceHistory.fulfilled(
    { items: incoming, nextCursor: '2026-04-14', append: false },
    '',
    { append: false },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyItems).toEqual(incoming);
  expect(next.historyNextCursor).toBe('2026-04-14');
  expect(next.historyHasMore).toBe(true);
  expect(next.historyFetchStatus).toBe('loaded');
});

test('fetchAttendanceHistory.fulfilled with append:true appends items', () => {
  const existing = [makeRecord('2026-04-15')];
  const incoming = [makeRecord('2026-04-10'), makeRecord('2026-04-09')];
  const state = { ...baseHistoryState, historyItems: existing };
  const action = fetchAttendanceHistory.fulfilled(
    { items: incoming, nextCursor: null, append: true },
    '',
    { append: true },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyItems).toEqual([...existing, ...incoming]);
  expect(next.historyHasMore).toBe(false);
  expect(next.historyNextCursor).toBeNull();
});

test('fetchAttendanceHistory.rejected sets error status', () => {
  const state = { ...baseHistoryState };
  const action = fetchAttendanceHistory.rejected(
    null,
    '',
    { append: false },
    { code: 'attendance/network', message: 'Network error' },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyFetchStatus).toBe('error');
  expect(next.historyFetchError).toEqual({ code: 'attendance/network', message: 'Network error' });
});

test('fetchAttendanceHistory.rejected with append:true preserves existing items', () => {
  const existing = [makeRecord('2026-04-15')];
  const state = { ...baseHistoryState, historyItems: existing };
  const action = fetchAttendanceHistory.rejected(
    null,
    '',
    { append: true },
    { code: 'attendance/network', message: 'Network error' },
  );
  const next = reducer(state as unknown as AttendanceState, action);
  expect(next.historyItems).toEqual(existing);
  expect(next.historyFetchStatus).toBe('error');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend/mobile && npx jest __tests__/attendance_history.slice.test.ts --no-coverage
```

Expected: FAIL — `fetchAttendanceHistory` not exported from slice.

- [ ] **Step 3: Add history state to the slice**

Open `frontend/mobile/src/presentation/store/slices/attendance.slice.ts`.

Add these imports at the top (after the existing use case imports):
```ts
import type { AttendanceRecord, AttendanceRecordStatus, AttendanceRecordPlace } from '@/domain/entities';
import { GetAttendanceHistoryUseCase } from '@/domain/use_cases';
```

Add `SerializableAttendanceRecord` type definition after the existing `SerializableAttendance` type:
```ts
export interface SerializableAttendanceRecord {
  date: string;
  status: AttendanceRecordStatus;
  place: AttendanceRecordPlace | null;
  signInAtIso: string | null;
  signOutAtIso: string | null;
  workedMinutes: number | null;
}
```

Add history fields to `AttendanceState` (after `signOutError`):
```ts
  historyItems: SerializableAttendanceRecord[];
  historyNextCursor: string | null;
  historyHasMore: boolean;
  historyFetchStatus: FetchStatus;
  historyFetchError: SerializableDomainError | null;
```

Add to `initialState` (after `signOutError: null`):
```ts
  historyItems: [],
  historyNextCursor: null,
  historyHasMore: false,
  historyFetchStatus: 'idle',
  historyFetchError: null,
```

Add `toSerializableRecord` helper after the existing `toSerializable` function:
```ts
const toSerializableRecord = (r: AttendanceRecord): SerializableAttendanceRecord => ({
  date: r.date,
  status: r.status,
  place: r.place,
  signInAtIso: r.signInAt ? r.signInAt.toISOString() : null,
  signOutAtIso: r.signOutAt ? r.signOutAt.toISOString() : null,
  workedMinutes: r.workedMinutes,
});
```

Add the new thunk after `signOutAttendance`:
```ts
export const fetchAttendanceHistory = createAsyncThunk<
  { items: SerializableAttendanceRecord[]; nextCursor: string | null; append: boolean },
  { before?: string; pageSize?: number; append: boolean },
  { rejectValue: SerializableDomainError }
>('attendance/fetchHistory', async ({ before, pageSize, append }, { rejectWithValue }) => {
  attendanceLog.info(
    'slice',
    `fetchAttendanceHistory thunk → before=${before ?? 'none'}, pageSize=${pageSize ?? 'default'}, append=${append}`,
  );
  try {
    const useCase = ServiceLocator.get<GetAttendanceHistoryUseCase>(
      DiKeys.GET_ATTENDANCE_HISTORY_USE_CASE,
    );
    const page = await useCase.execute({ before, pageSize });
    return {
      items: page.items.map(toSerializableRecord),
      nextCursor: page.nextCursor,
      append,
    };
  } catch (e) {
    return rejectWithValue(serializeError(e));
  }
});
```

Add history reducer cases inside `extraReducers` builder (after the `signOutAttendance` cases):
```ts
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.historyFetchStatus = 'pending';
        state.historyFetchError = null;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        const { items, nextCursor, append } = action.payload;
        state.historyItems = append
          ? [...state.historyItems, ...items]
          : items;
        state.historyNextCursor = nextCursor;
        state.historyHasMore = nextCursor !== null;
        state.historyFetchStatus = 'loaded';
        state.historyFetchError = null;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.historyFetchStatus = 'error';
        state.historyFetchError =
          action.payload ?? {
            code: 'attendance/unknown',
            message: 'Failed to load history',
          };
      });
```

Add `fetchAttendanceHistory` to the exports at the bottom of the file.

- [ ] **Step 4: Add history selectors**

In `frontend/mobile/src/presentation/store/selectors/attendance.selectors.ts`, add at the end:

```ts
export const selectAttendanceHistoryItems = (s: RootState) =>
  s.attendance.historyItems;
export const selectAttendanceHistoryHasMore = (s: RootState) =>
  s.attendance.historyHasMore;
export const selectAttendanceHistoryNextCursor = (s: RootState) =>
  s.attendance.historyNextCursor;
export const selectAttendanceHistoryFetchStatus = (s: RootState) =>
  s.attendance.historyFetchStatus;
export const selectAttendanceHistoryFetchError = (s: RootState) =>
  s.attendance.historyFetchError;
```

- [ ] **Step 5: Run slice tests — expect pass**

```bash
cd frontend/mobile && npx jest __tests__/attendance_history.slice.test.ts --no-coverage
```

Expected: 5 tests PASS.

- [ ] **Step 6: Run full test suite**

```bash
cd frontend/mobile && npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add \
  frontend/mobile/src/presentation/store/slices/attendance.slice.ts \
  frontend/mobile/src/presentation/store/selectors/attendance.selectors.ts \
  frontend/mobile/__tests__/attendance_history.slice.test.ts
git commit -m "feat(attendance): add history state, fetchAttendanceHistory thunk, and selectors to attendance slice"
```

---

### Task 4: DI wiring + i18n strings

**Files:**
- Modify: `frontend/mobile/src/core/keys/di.key.ts`
- Modify: `frontend/mobile/src/di/service_locator.ts`
- Modify: `frontend/mobile/src/presentation/localization/languages/en.ts`
- Modify: `frontend/mobile/src/presentation/localization/languages/ar.ts`

- [ ] **Step 1: Add DI key**

In `frontend/mobile/src/core/keys/di.key.ts`, add inside the `DiKeys` object after `SIGN_OUT_ATTENDANCE_USE_CASE`:

```ts
  GET_ATTENDANCE_HISTORY_USE_CASE: 'getAttendanceHistoryUseCase',
```

- [ ] **Step 2: Register use case in ServiceLocator**

In `frontend/mobile/src/di/service_locator.ts`:

Add `GetAttendanceHistoryUseCase` to the use cases import:
```ts
import {
  LoginUseCase,
  LogoutUseCase,
  ObserveAuthStateUseCase,
  GetAttendanceStatusUseCase,
  SignInAttendanceUseCase,
  SignOutAttendanceUseCase,
  GetAttendanceHistoryUseCase,
} from '@/domain/use_cases';
```

Add registration after `SIGN_OUT_ATTENDANCE_USE_CASE`:
```ts
    ServiceLocator.register(
      DiKeys.GET_ATTENDANCE_HISTORY_USE_CASE,
      new GetAttendanceHistoryUseCase(attendanceRepo),
    );
```

- [ ] **Step 3: Add i18n strings to en.ts**

In `frontend/mobile/src/presentation/localization/languages/en.ts`, add a `history` key inside the `attendance` section. If `attendance` doesn't exist as a top-level key yet, add it before `profile`. Add:

```ts
  attendance: {
    history: {
      title: 'Attendance History',
      empty: 'No attendance history yet',
      loadError: 'Failed to load history.',
      loadMoreError: 'Failed to load more.',
      retry: 'Retry',
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
  },
```

- [ ] **Step 4: Add i18n strings to ar.ts**

In `frontend/mobile/src/presentation/localization/languages/ar.ts`, add the Arabic equivalent:

```ts
  attendance: {
    history: {
      title: 'سجل الحضور',
      empty: 'لا يوجد سجل حضور بعد',
      loadError: 'فشل تحميل السجل.',
      loadMoreError: 'فشل تحميل المزيد.',
      retry: 'إعادة المحاولة',
      workedHours: '{{h}}س {{m}}د',
      workedHoursOnly: '{{h}}س',
      workedMinutesOnly: '{{m}}د',
      status: {
        inOffice: 'في المكتب',
        wfh: 'عن بُعد',
        signedOut: 'انصرف',
        notCheckedIn: 'لم يسجّل',
        vacation: 'إجازة',
        absent: 'غائب',
      },
      place: {
        inOffice: 'مكتب',
        wfh: 'عن بُعد',
      },
    },
  },
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add \
  frontend/mobile/src/core/keys/di.key.ts \
  frontend/mobile/src/di/service_locator.ts \
  frontend/mobile/src/presentation/localization/languages/en.ts \
  frontend/mobile/src/presentation/localization/languages/ar.ts
git commit -m "feat(attendance): wire GetAttendanceHistoryUseCase in DI and add history i18n strings"
```

---

### Task 5: AppAttendanceRecordCard atom

**Files:**
- Create: `frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/app_attendance_record_card.tsx`
- Create: `frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/index.ts`
- Modify: `frontend/mobile/src/presentation/components/atoms/index.ts`

- [ ] **Step 1: Create the card component**

Create `frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/app_attendance_record_card.tsx`:

```tsx
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import { AppText } from '@/presentation/components/atoms/app_text';
import type { SerializableAttendanceRecord } from '@/presentation/store/slices/attendance.slice';
import type { AttendanceRecordStatus } from '@/domain/entities';

export interface AppAttendanceRecordCardProps {
  record: SerializableAttendanceRecord;
}

const STATUS_I18N_KEY: Record<AttendanceRecordStatus, string> = {
  in_office:      'attendance.history.status.inOffice',
  wfh:            'attendance.history.status.wfh',
  signed_out:     'attendance.history.status.signedOut',
  not_checked_in: 'attendance.history.status.notCheckedIn',
  vacation:       'attendance.history.status.vacation',
  absent:         'attendance.history.status.absent',
};

const formatDate = (date: string, language: string): string => {
  // Append T00:00:00 to parse as local midnight (avoid UTC date-shift)
  const d = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
};

const formatTime = (iso: string, language: string): string =>
  new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

const formatWorked = (
  minutes: number,
  t: ReturnType<typeof useTranslation>['t'],
): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t('attendance.history.workedMinutesOnly', { m });
  if (m === 0) return t('attendance.history.workedHoursOnly', { h });
  return t('attendance.history.workedHours', { h, m });
};

export const AppAttendanceRecordCard: React.FC<AppAttendanceRecordCardProps> = ({
  record,
}) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const statusColor = resolveStatusColor(theme, record.status);
  const isNoCheckIn = record.status === 'not_checked_in';

  const dateLabel = formatDate(record.date, i18n.language);
  const statusLabel = t(STATUS_I18N_KEY[record.status]);

  return (
    <View style={styles.row}>
      {/* Left: date + status badge */}
      <View style={styles.left}>
        <AppText variant="caption" color={theme.colors.mutedForeground}>
          {dateLabel}
        </AppText>
        <View style={[styles.badge, { backgroundColor: statusColor.light }]}>
          <AppText variant="caption" color={statusColor.base} weight="medium">
            {statusLabel}
          </AppText>
        </View>
      </View>

      {/* Right: place + times + worked */}
      <View style={styles.right}>
        {isNoCheckIn ? (
          <AppText variant="caption" color={theme.colors.mutedForeground}>
            —
          </AppText>
        ) : (
          <>
            {record.place && (
              <AppText variant="caption" color={theme.colors.mutedForeground}>
                {t(`attendance.history.place.${record.place === 'in_office' ? 'inOffice' : 'wfh'}`)}
              </AppText>
            )}
            {record.signInAtIso && record.signOutAtIso && (
              <AppText variant="caption" color={theme.colors.foreground}>
                {formatTime(record.signInAtIso, i18n.language)}
                {' → '}
                {formatTime(record.signOutAtIso, i18n.language)}
              </AppText>
            )}
            {record.workedMinutes != null && (
              <AppText variant="caption" color={theme.colors.mutedForeground}>
                {formatWorked(record.workedMinutes, t)}
              </AppText>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const resolveStatusColor = (
  theme: AppTheme,
  status: AttendanceRecordStatus,
): { base: string; light: string } => {
  switch (status) {
    case 'in_office':
      return { base: theme.colors.primary, light: theme.colors.primaryLight };
    case 'wfh':
      return { base: theme.colors.status.info.base, light: theme.colors.status.info.light };
    case 'signed_out':
      return { base: theme.colors.status.success.base, light: theme.colors.status.success.light };
    case 'vacation':
      return { base: theme.colors.status.warning.base, light: theme.colors.status.warning.light };
    case 'absent':
      return { base: theme.colors.status.error.base, light: theme.colors.status.error.light };
    case 'not_checked_in':
    default:
      return { base: theme.colors.mutedForeground, light: theme.colors.muted };
  }
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: hs(10),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      gap: ws(12),
    },
    left: {
      flex: 1,
      gap: hs(4),
    },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: ws(8),
      paddingVertical: hs(2),
      borderRadius: theme.radius.s,
    },
    right: {
      alignItems: 'flex-end',
      gap: hs(2),
    },
  });
```

- [ ] **Step 2: Create the barrel export**

Create `frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/index.ts`:

```ts
export {
  AppAttendanceRecordCard,
  type AppAttendanceRecordCardProps,
} from './app_attendance_record_card';
```

- [ ] **Step 3: Export from atoms barrel**

In `frontend/mobile/src/presentation/components/atoms/index.ts`, add at the end:

```ts
export * from './app_attendance_record_card';
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add \
  frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/app_attendance_record_card.tsx \
  frontend/mobile/src/presentation/components/atoms/app_attendance_record_card/index.ts \
  frontend/mobile/src/presentation/components/atoms/index.ts
git commit -m "feat(attendance): add AppAttendanceRecordCard atom"
```

---

### Task 6: HistoryScreen + navigation

**Files:**
- Create: `frontend/mobile/src/presentation/screens/history/history_screen.tsx`
- Create: `frontend/mobile/src/presentation/screens/history/index.ts`
- Modify: `frontend/mobile/src/presentation/navigation/types.ts`
- Modify: `frontend/mobile/src/presentation/navigation/root_navigation.tsx`

- [ ] **Step 1: Create the HistoryScreen**

Create `frontend/mobile/src/presentation/screens/history/history_screen.tsx`:

```tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme, type AppTheme } from '@themes/index';
import { hs, ws } from '@/presentation/utils/scaling';
import {
  AppAlertBanner,
  AppAttendanceRecordCard,
  AppText,
} from '@/presentation/components/atoms';
import {
  useAppDispatch,
  useAppSelector,
} from '@/presentation/store/hooks';
import { fetchAttendanceHistory } from '@/presentation/store/slices';
import {
  selectAttendanceHistoryItems,
  selectAttendanceHistoryHasMore,
  selectAttendanceHistoryNextCursor,
  selectAttendanceHistoryFetchStatus,
  selectAttendanceHistoryFetchError,
} from '@/presentation/store/selectors';
import type { SerializableAttendanceRecord } from '@/presentation/store/slices/attendance.slice';

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectAttendanceHistoryItems);
  const hasMore = useAppSelector(selectAttendanceHistoryHasMore);
  const nextCursor = useAppSelector(selectAttendanceHistoryNextCursor);
  const fetchStatus = useAppSelector(selectAttendanceHistoryFetchStatus);
  const fetchError = useAppSelector(selectAttendanceHistoryFetchError);

  const isInitialLoad = fetchStatus === 'pending' && items.length === 0;
  const isAppending = fetchStatus === 'pending' && items.length > 0;
  const isInitialError = fetchStatus === 'error' && items.length === 0;
  const isAppendError = fetchStatus === 'error' && items.length > 0;

  useEffect(() => {
    dispatch(fetchAttendanceHistory({ append: false }));
  }, [dispatch]);

  const handleEndReached = useCallback(() => {
    if (hasMore && fetchStatus !== 'pending') {
      dispatch(fetchAttendanceHistory({ append: true, before: nextCursor ?? undefined }));
    }
  }, [dispatch, hasMore, nextCursor, fetchStatus]);

  const handleRetryInitial = useCallback(() => {
    dispatch(fetchAttendanceHistory({ append: false }));
  }, [dispatch]);

  const handleRetryAppend = useCallback(() => {
    dispatch(fetchAttendanceHistory({ append: true, before: nextCursor ?? undefined }));
  }, [dispatch, nextCursor]);

  const renderItem = useCallback(
    ({ item }: { item: SerializableAttendanceRecord }) => (
      <AppAttendanceRecordCard record={item} />
    ),
    [],
  );

  const renderFooter = () => {
    if (isAppending) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    if (isAppendError) {
      return (
        <View style={styles.footer}>
          <AppAlertBanner
            variant="error"
            message={t('attendance.history.loadMoreError')}
            onPress={handleRetryAppend}
          />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (fetchStatus !== 'loaded') return null;
    return (
      <View style={styles.emptyContainer}>
        <AppText variant="body" color={theme.colors.mutedForeground} align="center">
          {t('attendance.history.empty')}
        </AppText>
      </View>
    );
  };

  if (isInitialLoad) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isInitialError) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <View style={styles.centered}>
          <AppAlertBanner
            variant="error"
            message={t('attendance.history.loadError')}
            onPress={handleRetryInitial}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
      <FlatList<SerializableAttendanceRecord>
        data={items}
        keyExtractor={(item) => item.date}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ws(24),
    },
    list: {
      paddingHorizontal: ws(20),
      paddingVertical: hs(12),
      flexGrow: 1,
    },
    footer: {
      paddingVertical: hs(16),
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: hs(40),
    },
  });
```

- [ ] **Step 2: Create barrel export**

Create `frontend/mobile/src/presentation/screens/history/index.ts`:

```ts
export { HistoryScreen } from './history_screen';
```

- [ ] **Step 3: Add History to navigation types**

In `frontend/mobile/src/presentation/navigation/types.ts`, add `History: undefined` to `RootStackParamList`:

```ts
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Otp: { email: string };
  SetPassword: { mode: 'reset' | 'firstLogin'; token: string };
  MainTabs: undefined;
  Placeholder: undefined;
  History: undefined;
};
```

- [ ] **Step 4: Register HistoryScreen in the navigator**

In `frontend/mobile/src/presentation/navigation/root_navigation.tsx`:

Add import near the other screen imports:
```ts
import { HistoryScreen } from '@/presentation/screens/history';
```

Inside the `Stack.Navigator`, add the screen after `MainTabs`:
```tsx
<Stack.Screen
  name="History"
  component={HistoryScreen}
  options={{ title: '' }}
/>
```

(The title is set to empty string; the screen displays its own header via `AppText` title, or you can set `headerShown: false` if the app doesn't use a navigation header for this screen. Use `options={{ headerShown: false }}` to match the existing pattern where screens manage their own safe area.)

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add \
  frontend/mobile/src/presentation/screens/history/history_screen.tsx \
  frontend/mobile/src/presentation/screens/history/index.ts \
  frontend/mobile/src/presentation/navigation/types.ts \
  frontend/mobile/src/presentation/navigation/root_navigation.tsx
git commit -m "feat(attendance): add HistoryScreen with infinite scroll and navigation route"
```

---

### Task 7: Home screen Recent section integration

**Files:**
- Modify: `frontend/mobile/src/presentation/screens/home/home_screen.tsx`

The home screen is a large file (~530 lines). Read it fully before making changes.

- [ ] **Step 1: Read the full home screen**

Read `frontend/mobile/src/presentation/screens/home/home_screen.tsx` in full to locate:
1. The `HomeScreenProps` interface — note the `recentEntries`, `onViewHistory` props
2. The `DEFAULT_RECENT` constant
3. The `RecentEntry` interface
4. The JSX section that renders `recentEntries.map(...)` using the `recentSection` / `recentRow` styles
5. The `HomeWrapper` in `root_navigation.tsx` that connects Redux to props

- [ ] **Step 2: Update `HomeScreenProps`**

In `home_screen.tsx`, replace the `RecentEntry` interface, `DEFAULT_RECENT` constant, and update `HomeScreenProps` to remove `recentEntries` and add history props.

Remove:
```ts
export interface RecentEntry { ... }  // entire interface
const DEFAULT_RECENT: RecentEntry[] = [ ... ];  // entire constant
```

Update `HomeScreenProps` — remove `recentEntries?: RecentEntry[]` and add:
```ts
  historyItems?: SerializableAttendanceRecord[];
  historyFetchStatus?: 'idle' | 'pending' | 'loaded' | 'error';
  historyFetchError?: { code: string; message: string } | null;
  onRetryHistory?: () => void;
  onViewHistory?: () => void;  // keep this — it already exists
```

Add import at the top of the file:
```ts
import type { SerializableAttendanceRecord } from '@/presentation/store/slices/attendance.slice';
import { AppAttendanceRecordCard } from '@/presentation/components/atoms';
```

- [ ] **Step 3: Replace the Recent section JSX**

Locate the section that renders `recentEntries` (look for `recentSection` style and the map over entries). Replace it with:

```tsx
{/* ── Recent / History preview ── */}
<View style={styles.recentSection}>
  <View style={styles.recentHeader}>
    <AppText variant="cardTitle">{t('home.recentTitle')}</AppText>
    {onViewHistory && (
      <Pressable onPress={onViewHistory} hitSlop={8}>
        <AppText variant="caption" color={theme.colors.primary}>
          {t('home.historyLink')}
        </AppText>
      </Pressable>
    )}
  </View>

  {historyFetchStatus === 'pending' && (historyItems ?? []).length === 0 && (
    <View style={styles.recentSpinner}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  )}

  {historyFetchStatus === 'error' && (historyItems ?? []).length === 0 && (
    <AppAlertBanner
      variant="error"
      message={t('attendance.history.loadError')}
      onPress={onRetryHistory}
    />
  )}

  {historyFetchStatus === 'loaded' && (historyItems ?? []).length === 0 && (
    <AppText variant="caption" color={theme.colors.mutedForeground}>
      {t('attendance.history.empty')}
    </AppText>
  )}

  {(historyItems ?? []).map((record) => (
    <AppAttendanceRecordCard key={record.date} record={record} />
  ))}
</View>
```

Add `ActivityIndicator` to the React Native imports at the top of the file if not already present.

Add `recentHeader` and `recentSpinner` styles to `createStyles`:
```ts
    recentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    recentSpinner: {
      paddingVertical: hs(16),
      alignItems: 'center',
    },
```

- [ ] **Step 4: Update HomeWrapper in root_navigation.tsx**

Read `frontend/mobile/src/presentation/navigation/root_navigation.tsx` to find the `HomeWrapper` component. It currently passes `recentEntries` to `HomeScreen`. Update it:

Add imports:
```ts
import {
  fetchAttendanceStatus,
  signInAttendance,
  signOutAttendance,
  clearAttendanceErrors,
  fetchAttendanceHistory,
} from '@/presentation/store/slices';
import {
  selectAttendanceCurrent,
  selectAttendanceFetchError,
  selectAttendanceFetchStatus,
  selectAttendanceSignInError,
  selectAttendanceSignInStatus,
  selectAttendanceSignOutError,
  selectAttendanceSignOutStatus,
  selectAttendanceHistoryItems,
  selectAttendanceHistoryFetchStatus,
  selectAttendanceHistoryFetchError,
} from '@/presentation/store/selectors';
```

Inside `HomeWrapper`, add selectors and dispatch:
```ts
  const historyItems = useAppSelector(selectAttendanceHistoryItems);
  const historyFetchStatus = useAppSelector(selectAttendanceHistoryFetchStatus);
  const historyFetchError = useAppSelector(selectAttendanceHistoryFetchError);
```

In the `useEffect` that dispatches `fetchAttendanceStatus`, also dispatch history:
```ts
  useEffect(() => {
    dispatch(fetchAttendanceStatus());
    dispatch(fetchAttendanceHistory({ append: false, pageSize: 5 }));
  }, [dispatch]);
```

Add handler:
```ts
  const handleRetryHistory = useCallback(() => {
    dispatch(fetchAttendanceHistory({ append: false, pageSize: 5 }));
  }, [dispatch]);
```

Add `onViewHistory` handler that navigates to History:
```ts
  const handleViewHistory = useCallback(() => {
    navigation.navigate('History');
  }, [navigation]);
```

Pass new props to `<HomeScreen>`:
```tsx
  historyItems={historyItems}
  historyFetchStatus={historyFetchStatus}
  historyFetchError={historyFetchError}
  onRetryHistory={handleRetryHistory}
  onViewHistory={handleViewHistory}
```

Remove any `recentEntries={...}` prop from `<HomeScreen>` in the wrapper.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd frontend/mobile && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run full test suite**

```bash
cd frontend/mobile && npx jest --no-coverage
```

Expected: all tests pass.

- [ ] **Step 7: Manual verification checklist**

Run the app and verify:

- [ ] Home screen Recent section shows a spinner while history loads
- [ ] Recent section shows up to 5 `AppAttendanceRecordCard` items when loaded
- [ ] Each card shows: date (`Mon, Apr 15`), colored status badge, place, sign-in → sign-out times, worked hours
- [ ] `NotCheckedIn` cards show `—` instead of times
- [ ] "View full history" link is visible and tapping it navigates to HistoryScreen
- [ ] HistoryScreen shows a full-screen spinner on first load
- [ ] HistoryScreen lists items with newest at top
- [ ] Scrolling to the bottom triggers loading older items (spinner in footer)
- [ ] When all pages are loaded, no further requests are made
- [ ] Error state on home Recent shows error banner with retry
- [ ] Error state on HistoryScreen initial load shows full-screen error + retry
- [ ] Error on append (load more) shows inline footer error with retry
- [ ] Empty state shows when no history exists

- [ ] **Step 8: Commit**

```bash
git add \
  frontend/mobile/src/presentation/screens/home/home_screen.tsx \
  frontend/mobile/src/presentation/navigation/root_navigation.tsx
git commit -m "feat(attendance): integrate history preview in home screen and connect HistoryScreen navigation"
```
