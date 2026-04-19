import { attendanceLog } from '@/core/logger';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type TokenProvider = () => Promise<string | null>;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface HttpRequestOptions {
  method: HttpMethod;
  path: string;
  body?: unknown;
}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async request<T>({ method, path, body }: HttpRequestOptions): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let token: string | null = null;
    try {
      token = await this.tokenProvider();
    } catch (e) {
      attendanceLog.warn('http', 'tokenProvider threw, sending request without auth', e);
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    attendanceLog.info(
      'http',
      `→ ${method} ${url} (auth=${token ? 'bearer' : 'none'})`,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      attendanceLog.error(
        'http',
        `× ${method} ${url} network failure`,
        e,
      );
      throw new HttpError(0, null, 'Network request failed');
    }

    const text = await response.text();
    let data: unknown = null;
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    attendanceLog.info(
      'http',
      `← ${method} ${url} ${response.status}`,
    );

    if (!response.ok) {
      throw new HttpError(
        response.status,
        data,
        `Request failed with status ${response.status}`,
      );
    }

    return data as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'GET', path });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', path, body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', path });
  }
}
