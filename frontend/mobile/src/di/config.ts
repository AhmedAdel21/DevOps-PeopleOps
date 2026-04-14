export const AppConfig = {
  API_BASE_URL: 'https://api.devopsolution.com',
  USE_MOCK: true,
  MOCK_DELAY_MS: 800,
  PAGE_SIZE: 20,

  // Flip to false to silence the auth logger in every layer.
  AUTH_LOGS_ENABLED: true,
} as const;
