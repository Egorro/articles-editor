import { Injectable } from '@angular/core';
/**Сервис работы с localStorage */
@Injectable({ providedIn: 'root' })
export class StorageService {
get<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    console.warn(`Invalid JSON in localStorage for key: ${key}`);
    return null;
  }
}

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
