import { HttpError, type HttpClient } from '@/data/data_sources/http';
import type { MeDto } from '@/data/dtos/me';
import { authLog } from '@/core/logger';

const ME_PATH = '/api/auth/me';
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [250, 500, 1000];

const isTransient = (e: unknown): boolean => {
  if (e instanceof HttpError) {
    // status 0 = network failure (HttpClient sets it on fetch throw); 5xx = BE issue.
    return e.status === 0 || e.status >= 500;
  }
  return false;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class MeRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the BE-shaped profile. Retries up to MAX_ATTEMPTS on transient
   * failures (network + 5xx); 401/403/other 4xx throw on the first attempt
   * — they will not improve with a retry, and 401 already triggers the
   * HttpClient onUnauthorized hook synchronously.
   */
  async fetchMe(): Promise<MeDto> {
    authLog.info('data_source', `MeRemoteDataSource.fetchMe → GET ${ME_PATH}`);
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const dto = await this.http.get<MeDto>(ME_PATH);
        authLog.info(
          'data_source',
          `MeRemoteDataSource.fetchMe ← ok (role=${dto.role}, perms=${dto.permissions?.length ?? 0}, attempt=${attempt})`,
        );
        return dto;
      } catch (e) {
        lastErr = e;
        if (!isTransient(e) || attempt === MAX_ATTEMPTS) {
          authLog.error(
            'data_source',
            `MeRemoteDataSource.fetchMe failed (attempt=${attempt}, transient=${isTransient(e)})`,
            e,
          );
          throw e;
        }
        const backoff = BACKOFF_MS[attempt - 1] ?? 1000;
        authLog.warn(
          'data_source',
          `MeRemoteDataSource.fetchMe transient failure (attempt=${attempt}), retrying in ${backoff}ms`,
        );
        await sleep(backoff);
      }
    }
    // Unreachable — the loop either returns or throws.
    throw lastErr;
  }
}
