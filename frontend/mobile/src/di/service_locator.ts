export class ServiceLocator {
  private static registry = new Map<string, unknown>();

  static initialize(): void {
    ServiceLocator.registry.clear();
    // Use case registrations will be added here as domain modules are built.
  }

  static register<T>(key: string, instance: T): void {
    ServiceLocator.registry.set(key, instance);
  }

  static get<T>(key: string): T {
    const instance = ServiceLocator.registry.get(key);
    if (instance === undefined) {
      throw new Error(`ServiceLocator: No instance registered for key "${key}"`);
    }
    return instance as T;
  }

  static reset(): void {
    ServiceLocator.registry.clear();
  }
}
