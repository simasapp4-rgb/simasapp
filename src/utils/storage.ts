import { StoredUser } from '../types';

const USER_STORAGE_KEY = 'simas_user';

/**
 * Retrieves the stored user data from localStorage.
 * @returns The stored user object or null if not found.
 */
export function getStoredUser(): StoredUser | null {
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
 * @param user The user object to save.
 */
export function setStoredUser(user: StoredUser): void {
  try {
    const serializedUser = JSON.stringify(user);
    localStorage.setItem(USER_STORAGE_KEY, serializedUser);
  } catch (err) {
    console.error("Could not save user to localStorage:", err);
  }
}

/**
 * Removes the user data from localStorage.
 */
export function clearStoredUser(): void {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error("Could not clear user from localStorage:", err);
  }
}
