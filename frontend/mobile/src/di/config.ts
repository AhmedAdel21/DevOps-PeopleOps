// Set to true to use the local ngrok tunnel, false to target production.
const USE_LOCAL = true;

const LOCAL_BASE_URL =
  'https://joslyn-sociologistic-demiurgically.ngrok-free.dev';
const PROD_BASE_URL =
  'https://devopsolution-c8f7andbbuc9d3hj.westeurope-01.azurewebsites.net';

const BASE_URL = USE_LOCAL ? LOCAL_BASE_URL : PROD_BASE_URL;

export const AppConfig = {
  API_BASE_URL: BASE_URL,
  USE_MOCK: true,
  MOCK_DELAY_MS: 800,
  PAGE_SIZE: 20,

  /**
   * HTTPS URL registered in the Zoho developer console as the mobile OAuth
   * redirect target. Zoho redirects the browser here on success; the backend
   * serves an HTML bounce page that `<meta refresh>`es to the
   * `devopsolution://auth/zoho/callback` deep link. Switch per environment
   * (dev / staging / prod) — never hardcode inside a data source.
   */
  ZOHO_MOBILE_REDIRECT_URI: `${BASE_URL}/api/auth/zoho/mobile-callback`,

  /** Custom URL scheme the app intercepts after the backend bounce. */
  ZOHO_DEEP_LINK: 'devopsolution://auth/zoho/callback',

  /**
   * Per-attempt timeout (ms) for the health-endpoint warm-up ping that
   * guards against Azure Functions Flex-Consumption cold-start 404s.
   * Keep short — we retry up to 5 times with exponential backoff.
   */
  WARM_UP_TIMEOUT_MS: 3000,

  // Flip to false to silence the auth logger in every layer.
  AUTH_LOGS_ENABLED: true,

  // Flip to false to silence the attendance/http logger in every layer.
  ATTENDANCE_LOGS_ENABLED: true,
} as const;
