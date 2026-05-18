import type { HttpClient } from '@/data/data_sources/http';
import type {
  DepartmentDetailDto,
  DepartmentDto,
} from '@/data/dtos/department';
import { managementLog } from '@/core/logger';
import { AppConfig } from '@/di/config';

// ── Path (docs/team-api-contract.md §3.3) ───────────────────────────────────

const DEPARTMENTS = '/api/v1/departments';

// ── Mock ────────────────────────────────────────────────────────────────────

const useMock = (): boolean => AppConfig.USE_MOCK_DEPARTMENTS;

const mockDelay = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, AppConfig.MOCK_DELAY_MS));

/** Matches the team-attendance mock (`d_eng` Engineering) + design dcnNd. */
const MOCK_DEPARTMENTS: DepartmentDto[] = [
  {
    id: 'd_eng',
    nameEn: 'Engineering',
    nameAr: 'الهندسة',
    memberCount: 12,
    managerEmployeeId: 'e_ahmed',
    managerName: 'Ahmed El-Sayed',
  },
  {
    id: 'd_mkt',
    nameEn: 'Marketing',
    nameAr: 'التسويق',
    memberCount: 8,
    managerEmployeeId: 'e_mona',
    managerName: 'Mona Saleh',
  },
  {
    id: 'd_fin',
    nameEn: 'Finance',
    nameAr: 'المالية',
    memberCount: 6,
    managerEmployeeId: null,
    managerName: null,
  },
];

export class DepartmentRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async listDepartments(): Promise<DepartmentDto[]> {
    if (useMock()) {
      managementLog.info('data_source', `[MOCK] GET ${DEPARTMENTS}`);
      await mockDelay();
      return MOCK_DEPARTMENTS;
    }
    managementLog.info('data_source', `GET ${DEPARTMENTS}`);
    return this.http.get<DepartmentDto[]>(DEPARTMENTS);
  }

  async getDepartment(id: string): Promise<DepartmentDetailDto> {
    if (useMock()) {
      managementLog.info('data_source', `[MOCK] GET ${DEPARTMENTS}/${id}`);
      await mockDelay();
      const base =
        MOCK_DEPARTMENTS.find(d => d.id === id) ?? MOCK_DEPARTMENTS[0];
      return { ...base, memberIds: [] };
    }
    const path = `${DEPARTMENTS}/${encodeURIComponent(id)}`;
    managementLog.info('data_source', `GET ${path}`);
    return this.http.get<DepartmentDetailDto>(path);
  }
}
