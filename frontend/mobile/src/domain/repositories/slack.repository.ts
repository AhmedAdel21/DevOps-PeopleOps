export interface SlackRepository {
  getAuthorizationUrl(): Promise<string>;
  getConnectionStatus(): Promise<boolean>;
  disconnect(): Promise<void>;
}
