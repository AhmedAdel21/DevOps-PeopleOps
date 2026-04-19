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

  async execute(input: GetAttendanceHistoryInput): Promise<AttendanceHistoryPage> {
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
