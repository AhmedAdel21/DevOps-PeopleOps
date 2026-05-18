import { UseCase } from '@/domain/use_cases/use_case.base';
import type { Department } from '@/domain/entities';
import type { DepartmentRepository } from '@/domain/repositories';
import { managementLog } from '@/core/logger';

export class ListDepartmentsUseCase extends UseCase<
  void,
  readonly Department[]
> {
  constructor(private readonly repo: DepartmentRepository) {
    super();
  }

  async execute(): Promise<readonly Department[]> {
    managementLog.info('use_case', 'ListDepartmentsUseCase.execute');
    try {
      const result = await this.repo.listDepartments();
      managementLog.info(
        'use_case',
        `ListDepartmentsUseCase completed → ${result.length}`,
      );
      return result;
    } catch (e) {
      managementLog.error(
        'use_case',
        'ListDepartmentsUseCase threw (rethrowing)',
        e,
      );
      throw e;
    }
  }
}
