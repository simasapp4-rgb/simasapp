import React, { useState, useEffect } from 'react';
import useSWR, { SWRConfig, KeyedMutator } from 'swr';
import { User, JournalEntry, LoginData, StoredUser, UserRole } from './types';
import { getStoredUser, setStoredUser, clearStoredUser } from './utils/storage';
import LoginScreen from './components/LoginScreen';
import SplashScreen from './components/SplashScreen';
import Layout from './components/Layout';
import ErrorScreen from './components/ErrorScreen';

const API_BASE_URL = '/api';

// Universal fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorInfo = await res.json();
    console.error("API Fetch Error:", errorInfo);
    throw new Error(errorInfo.message || 'An error occurred while fetching the data.');
  }
  return res.json();
};

const App: React.FC = () => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- SWR Data Fetching ---
  const { data: users, error: usersError, mutate: mutateUsers } = useSWR<User[]>(user ? `${API_BASE_URL}/users` : null, fetcher);
  const { data: journals, error: journalsError, mutate: mutateJournals } = useSWR<JournalEntry[]>(user ? `${API_BASE_URL}/journals` : null, fetcher);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setTimeout(() => setIsLoading(false), 1200); // Simulate splash screen
  }, []);

  // --- Authentication Handlers ---
  const handleLogin = async (loginData: LoginData) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const loggedInUser = await response.json();

      if (!response.ok) {
        throw new Error(loggedInUser.error || 'Login failed');
      }

      const storedUser: StoredUser = { id: loggedInUser.id, name: loggedInUser.name, role: loggedInUser.role, avatar: loggedInUser.avatar };
      setStoredUser(storedUser);
      setUser(storedUser);

    } catch (error: any) {
      console.error(error);
      setLoginError(error.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    setUser(null);
  };

  // --- Data Mutation Handlers ---
  const handleAddUser = async (newUser: User) => {
    try {
      await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      mutateUsers(); 
    } catch (error) {
      console.error('Failed to add user:', error);
      mutateUsers();
      throw error;
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      mutateUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      mutateUsers();
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/users?id=${userId}`, {
        method: 'DELETE',
      });
      mutateUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      mutateUsers();
      throw error;
    }
  };
  
  const handleAddJournal = async (newJournal: Partial<JournalEntry>) => {
    try {
        await fetch(`${API_BASE_URL}/journals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newJournal),
        });
        mutateJournals();
    } catch (error) {
        console.error('Failed to add journal:', error);
        throw error;
    }
  };

  const handleUpdateJournal = async (updatedJournal: JournalEntry) => {
    try {
        await fetch(`${API_BASE_URL}/journals`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedJournal),
        });
        mutateJournals();
    } catch (error) {
        console.error('Failed to update journal:', error);
        throw error;
    }
  };

  const handleDeleteJournal = async (journalId: string) => {
     try {
        await fetch(`${API_BASE_URL}/journals?id=${journalId}`, { method: 'DELETE' });
        mutateJournals();
    } catch (error) {
        console.error('Failed to delete journal:', error);
        throw error;
    }
  };

  const handleResetData = async () => {
    try {
      await fetch(`${API_BASE_URL}/users?action=reset_application_data`, { method: 'DELETE' });
      mutateUsers();
      mutateJournals();
    } catch(error) {
       console.error('Failed to reset data:', error);
       throw error;
    }
  }

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  if (usersError || journalsError) {
    return <ErrorScreen error={usersError || journalsError} onRetry={() => { 
      if (usersError) mutateUsers();
      if (journalsError) mutateJournals();
    }} />;
  }

  if (!users || !journals) {
    return <SplashScreen message="Menyinkronkan data..." />;
  }

  return (
    <Layout
      user={user}
      users={users}
      journals={journals}
      onLogout={handleLogout}
      onAddUser={handleAddUser}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      onAddJournal={handleAddJournal}
      onUpdateJournal={handleUpdateJournal}
      onDeleteJournal={handleDeleteJournal}
      onResetData={handleResetData}
    />
  );
};

// Main App entry point with SWR Configuration
const AppWithSWR: React.FC = () => (
  <SWRConfig 
    value={{
      fetcher,
      // --- DEFINITIVE CACHE-BUSTING CONFIG ---
      // 1. Force revalidation on focus/reconnect.
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // 2. Disable request deduplication. This forces SWR to always re-fetch.
      dedupingInterval: 0,
      // 3. Force the app to poll for new data every 3 seconds.
      // This is the most aggressive way to ensure data is always fresh.
      refreshInterval: 3000, 
    }}
  >
    <App />
  </SWRConfig>
);

export default AppWithSWR;
