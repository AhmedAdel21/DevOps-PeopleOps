import InAppBrowser from 'react-native-inappbrowser-reborn';
import { AuthError } from '@/domain/errors';
import { authLog } from '@/core/logger';

/**
 * Options injected by the DI layer so we can vary URLs per environment.
 * All three MUST be provided at construction time.
 */
export interface ZohoAuthRemoteDataSourceOptions {
  baseUrl: string;
  /** HTTPS URL registered in Zoho + sent to backend for state validation. */
  mobileRedirectUri: string;
  /** Custom URL scheme the app intercepts after the backend bounce. */
  deepLink: string;
  /** Per-attempt timeout (ms) for the warm-up ping. */
  warmUpTimeoutMs: number;
}

export interface ZohoLoginResponse {
  accessToken: string;
  isActive: boolean;
  email: string;
  fullName: string;
  roleName: string;
  mustChangePassword: boolean;
  provider: string;
  imageUrl?: string;
}

function parseCallbackParams(url: string): Record<string, string> {
  const qIdx = url.indexOf('?');
  if (qIdx === -1) return {};
  const params: Record<string, string> = {};
  url
    .slice(qIdx + 1)
    .split('&')
    .forEach(pair => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) return;
      params[decodeURIComponent(pair.slice(0, eqIdx))] = decodeURIComponent(
        pair.slice(eqIdx + 1),
      );
    });
  return params;
}

export class ZohoAuthRemoteDataSource {
  private readonly baseUrl: string;
  private readonly mobileRedirectUri: string;
  private readonly deepLink: string;
  private readonly warmUpTimeoutMs: number;

  constructor(options: ZohoAuthRemoteDataSourceOptions) {
    this.baseUrl = options.baseUrl;
    this.mobileRedirectUri = options.mobileRedirectUri;
    this.deepLink = options.deepLink;
    this.warmUpTimeoutMs = options.warmUpTimeoutMs;
  }

  /**
   * Pings the backend's health endpoint until it responds 200, to work around
   * Azure Functions Flex Consumption cold-start 404s. Without this, a fresh
   * deploy (or a scaled-to-zero instance) can return Azure's default 404 page
   * for the first 1–2 requests — including Zoho's redirect to
   * `/api/auth/zoho/mobile-callback`, which the user can't retry gracefully.
   *
   * Retries up to `maxAttempts` with exponential backoff (250ms → ~2s). Each
   * attempt is bounded by `warmUpTimeoutMs` via AbortController so a stalled
   * network never blocks the OAuth flow indefinitely. Silently gives up if
   * the worker still isn't ready — the subsequent /zoho/start call will
   * surface the real error.
   */
  private async warmUpBackend(maxAttempts = 5): Promise<void> {
    let delayMs = 250;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.warmUpTimeoutMs,
      );
      try {
        const res = await fetch(`${this.baseUrl}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        if (res.ok) {
          authLog.info(
            'data_source',
            `ZohoAuth: warm-up ok (attempt=${attempt})`,
          );
          return;
        }
        authLog.info(
          'data_source',
          `ZohoAuth: warm-up got ${res.status} (attempt=${attempt})`,
        );
      } catch (e) {
        authLog.info(
          'data_source',
          `ZohoAuth: warm-up threw (attempt=${attempt})`,
          e,
        );
      } finally {
        clearTimeout(timeoutId);
      }
      if (attempt < maxAttempts) {
        await new Promise<void>(r => setTimeout(r, delayMs));
        delayMs = Math.min(delayMs * 2, 2000);
      }
    }
    authLog.info('data_source', 'ZohoAuth: warm-up gave up, proceeding anyway');
  }

  async authenticate(): Promise<ZohoLoginResponse> {
    // 0. Warm up the Azure Functions worker before kicking off OAuth. This
    // prevents the classic cold-start 404 on /api/auth/zoho/mobile-callback
    // that Zoho's redirect would otherwise land on.
    await this.warmUpBackend();

    // 1. Start login — get signed auth URL from backend
    authLog.info('data_source', 'ZohoAuth: startLogin →');
    const startRes = await fetch(`${this.baseUrl}/api/auth/zoho/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientType: 'mobile',
        redirectUri: this.mobileRedirectUri,
      }),
    });

    if (!startRes.ok) {
      const body = await startRes.json().catch(() => null);
      authLog.error('data_source', `ZohoAuth: startLogin failed (${startRes.status})`, body);
      throw new AuthError('unknown', 'Failed to initiate Zoho login');
    }

    const { authorizationUrl, state } = (await startRes.json()) as {
      authorizationUrl: string;
      state: string;
    };
    authLog.info('data_source', 'ZohoAuth: startLogin resolved, opening browser');

    // 2. Open in-app browser — blocks until redirect or dismiss
    let callbackUrl: string;
    try {
      const result = await InAppBrowser.openAuth(
        authorizationUrl,
        this.deepLink,
        {
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          ephemeralWebSession: false,
        },
      );

      if (result.type !== 'success') {
        authLog.info('data_source', `ZohoAuth: browser closed (type=${result.type})`);
        throw new AuthError('zoho-cancelled', 'Login was cancelled');
      }

      callbackUrl = result.url;
    } catch (e) {
      if (e instanceof AuthError) throw e;
      authLog.error('data_source', 'ZohoAuth: browser threw', e);
      throw new AuthError('unknown', 'Browser error during Zoho login');
    }

    // 3. Parse code + state from callback URL
    const params = parseCallbackParams(callbackUrl);
    const code = params.code;
    const returnedState = params.state;
    const zohoError = params.error;

    if (zohoError) {
      authLog.error('data_source', `ZohoAuth: Zoho returned error=${zohoError}`);
      throw new AuthError('zoho-cancelled', `Zoho error: ${zohoError}`);
    }

    if (!code || !returnedState) {
      authLog.error('data_source', 'ZohoAuth: missing code or state in callback');
      throw new AuthError('unknown', 'Invalid Zoho callback');
    }

    authLog.info('data_source', 'ZohoAuth: exchanging code →');

    // 4. Exchange code for Firebase token via backend
    const loginRes = await fetch(`${this.baseUrl}/api/auth/zoho/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zohoCode: code,
        state: returnedState,
        redirectUri: this.mobileRedirectUri,
        clientType: 'mobile',
      }),
    });

    if (!loginRes.ok) {
      const body = (await loginRes.json().catch(() => null)) as
        | { type?: string }
        | null;
      authLog.error('data_source', `ZohoAuth: login failed (${loginRes.status})`, body);

      if (loginRes.status === 404) {
        throw new AuthError(
          'zoho-employee-not-linked',
          'No employee profile linked to this Zoho account',
        );
      }
      throw new AuthError('unknown', 'Zoho login failed');
    }

    const data = (await loginRes.json()) as ZohoLoginResponse;
    authLog.info(
      'data_source',
      `ZohoAuth: login resolved (email=${authLog.maskEmail(data.email)}, isActive=${data.isActive})`,
    );
    return data;
  }
}
