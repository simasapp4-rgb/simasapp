// This file is no longer needed as primary data is handled by the Supabase backend.
// Keeping it for settings that are not yet migrated to a server-side table.

export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const serializedState = localStorage.getItem(key);
    if (serializedState === null) {
      // Simpan nilai default untuk penggunaan selanjutnya
      saveState(key, defaultValue);
      return defaultValue;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from localStorage for key:", key, err);
    return defaultValue;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    const serializedState = JSON.stringify(value);
    localStorage.setItem(key, serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage for key:", key, err);
  }
}
