export class LocalStorageService {
  static set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static get<T>(key: string, value: T | null = null): T | null {
    try {
      const item = JSON.parse(<string>localStorage.getItem(key));
      if (item !== null) {
        return item;
      }
    } catch (err) {
      // Noop.
    }

    return value;
  }

  static has(key: string): boolean {
    return localStorage.hasOwnProperty(key);
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}
