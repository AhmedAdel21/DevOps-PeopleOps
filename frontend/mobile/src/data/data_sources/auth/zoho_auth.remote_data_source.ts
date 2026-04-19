import InAppBrowser from 'react-native-inappbrowser-reborn';
import { AuthError } from '@/domain/errors';
import { authLog } from '@/core/logger';

// HTTPS URL registered in Zoho + sent to backend for state validation.
// The backend bounces Zoho's redirect here → devopsolution:// deep link.
const ZOHO_MOBILE_REDIRECT_URI =
  'https://devopsolution-c8f7andbbuc9d3hj.westeurope-01.azurewebsites.net/api/auth/zoho/mobile-callback';
// Custom scheme the app intercepts after the backend bounce.
const ZOHO_DEEP_LINK = 'devopsolution://auth/zoho/callback';

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
  constructor(private readonly baseUrl: string) {}

  /**
   * Pings the backend's health endpoint until it responds 200, to work around
   * Azure Functions Flex Consumption cold-start 404s. Without this, a fresh
   * deploy (or a scaled-to-zero instance) can return Azure's default 404 page
   * for the first 1–2 requests — including Zoho's redirect to
   * `/api/auth/zoho/mobile-callback`, which the user can't retry gracefully.
   *
   * Retries up to `maxAttempts` with exponential backoff (250ms → ~2s).
   * Silently gives up if the worker still isn't ready — the subsequent
   * /zoho/start call will surface the real error.
   */
  private async warmUpBackend(maxAttempts = 5): Promise<void> {
    let delayMs = 250;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}/api/health`, {
          method: 'GET',
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
      }
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, delayMs));
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
        redirectUri: ZOHO_MOBILE_REDIRECT_URI,
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
        ZOHO_DEEP_LINK,
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
        redirectUri: ZOHO_MOBILE_REDIRECT_URI,
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
