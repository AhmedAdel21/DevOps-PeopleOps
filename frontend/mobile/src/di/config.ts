export const AppConfig = {
  API_BASE_URL: 'http://10.0.2.2:7071',
  USE_MOCK: true,
  MOCK_DELAY_MS: 800,
  PAGE_SIZE: 20,

  // Flip to false to silence the auth logger in every layer.
  AUTH_LOGS_ENABLED: true,

  // Flip to false to silence the attendance/http logger in every layer.
  ATTENDANCE_LOGS_ENABLED: true,
} as const;
