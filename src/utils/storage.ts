import { StoredUser } from '../types';

const USER_STORAGE_KEY = 'simas_user';

// Helper function to check if we are in a browser environment
const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Retrieves the stored user data from localStorage.
 * Returns null if not in a browser environment.
 * @returns The stored user object or null if not found.
 */
export function getStoredUser(): StoredUser | null {
  if (!isBrowser()) {
    return null; // Cannot access localStorage on the server
  }
  try {
    const serializedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (serializedUser === null) {
      return null;
    }
    return JSON.parse(serializedUser);
  } catch (err) {
    console.error("Could not load user from localStorage:", err);
    return null;
  }
}

/**
 * Saves the user data to localStorage.
 * Does nothing if not in a browser environment.
 * @param user The user object to save.
 */
export function setStoredUser(user: StoredUser): void {
  if (!isBrowser()) {
    return; // Cannot access localStorage on the server
  }
  try {
    const serializedUser = JSON.stringify(user);
    localStorage.setItem(USER_STORAGE_KEY, serializedUser);
  } catch (err) {
    console.error("Could not save user to localStorage:", err);
  }
}

/**
 * Removes the user data from localStorage.
 * Does nothing if not in a browser environment.
 */
export function clearStoredUser(): void {
  if (!isBrowser()) {
    return; // Cannot access localStorage on the server
  }
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error("Could not clear user from localStorage:", err);
  }
}
