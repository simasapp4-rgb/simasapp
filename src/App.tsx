import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User, UserRole, JournalEntry } from './types';
import { INITIAL_JOURNAL_CATEGORIES } from './constants';
import { loadState, saveState } from './utils/storage';
import LoginScreen from './components/LoginScreen';
import StudentDashboard from './components/dashboards/StudentDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import ParentDashboard from './components/dashboards/ParentDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import ErrorScreen from './components/ErrorScreen';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  
  const [journalCategories, setJournalCategories] = useState<string[]>([]);
  const [attendanceSettings, setAttendanceSettings] = useState({ startTime: '07:00', endTime: '09:00' });
  const [schoolName, setSchoolName] = useState('SMP NEGERI 4 BALIKPAPAN');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async () => {
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      // The vercel.json file now handles API cache-busting, but we keep this for local/other environments.
      const cacheBuster = `?t=${new Date().getTime()}`;
      const [usersResponse, journalsResponse] = await Promise.all([
        fetch(`/api/users${cacheBuster}`),
        fetch(`/api/journals${cacheBuster}`)
      ]);

      if (!usersResponse.ok || !journalsResponse.ok) {
        throw new Error('Gagal mengambil data dari server. Pastikan API berjalan.');
      }

      const usersData = await usersResponse.json();
      const journalsData = await journalsResponse.json();

      setUsers(usersData);
      setJournalEntries(journalsData);

      if (isInitialLoad.current) {
        setJournalCategories(loadState('journalCategories', INITIAL_JOURNAL_CATEGORIES));
        setAttendanceSettings(loadState('attendanceSettings', { startTime: '07:00', endTime: '09:00' }));
        setSchoolName(loadState('schoolName', 'SMP NEGERI 4 BALIKPAPAN'));
        setTheme(loadState('theme', 'light'));
      }

    } catch (e: any) {
      console.error("Gagal mengambil data dari API:", e);
      setError("Gagal terhubung ke server. Silakan coba lagi nanti.");
    } finally {
      if (isInitialLoad.current) {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch data when the app becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('App became visible, refetching data...');
        fetchData();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchData]);
  
  // Save settings to localStorage
  useEffect(() => { if (!isInitialLoad.current) saveState('journalCategories', journalCategories); }, [journalCategories]);
  useEffect(() => { if (!isInitialLoad.current) saveState('attendanceSettings', attendanceSettings); }, [attendanceSettings]);
  useEffect(() => { if (!isInitialLoad.current) saveState('schoolName', schoolName); }, [schoolName]);
  useEffect(() => { if (!isInitialLoad.current) saveState('theme', theme); }, [theme]);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        if (JSON.stringify(currentUser) !== JSON.stringify(updatedUser)) {
          setCurrentUser(updatedUser);
        }
      } else {
        setCurrentUser(null);
      }
    }
  }, [users, currentUser]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddJournal = async (newJournalData: Partial<JournalEntry>) => {
    const response = await fetch('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJournalData),
    });
    if (!response.ok) throw new Error("Gagal menambahkan jurnal.");
    await fetchData(); 
  };

  const handleUpdateJournal = async (updatedJournal: JournalEntry) => {
    const response = await fetch('/api/journals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedJournal),
    });
    if (!response.ok) throw new Error("Gagal memperbarui jurnal.");
    await fetchData();
  };

  const handleDeleteJournal = async (journalId: string) => {
    const response = await fetch(`/api/journals?id=${journalId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Gagal menghapus jurnal.");
    await fetchData();
  };

  const handleAddUser = async (newUser: User) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    if (!response.ok) throw new Error("Gagal menambahkan pengguna.");
    await fetchData();
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });
    if (!response.ok) throw new Error("Gagal memperbarui pengguna.");
    await fetchData();
  };

  const handleDeleteUser = async (userId: string) => {
     const response = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Gagal menghapus pengguna.");
    await fetchData();
  };
  
  const handleResetData = useCallback(async () => {
    const response = await fetch('/api/users?action=reset_application_data', { method: 'DELETE' });
    if (!response.ok) throw new Error("Gagal mereset data aplikasi.");
    await fetchData();
  }, [fetchData]);

  const DashboardComponent = useMemo(() => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case UserRole.STUDENT:
        return <StudentDashboard 
                  user={currentUser}
                  journalCategories={journalCategories}
                  attendanceSettings={attendanceSettings}
                  journals={journalEntries}
                  onAddJournal={handleAddJournal}
                  onUpdateJournal={handleUpdateJournal}
                  onDeleteJournal={handleDeleteJournal}
                />;
      case UserRole.TEACHER:
        return <TeacherDashboard 
                  user={currentUser} 
                  journals={journalEntries}
                  onUpdateJournal={handleUpdateJournal}
                  users={users}
                />;
      case UserRole.PARENT:
        return <ParentDashboard 
                  user={currentUser} 
                  journals={journalEntries}
                  users={users}
                />;
      case UserRole.ADMIN:
        return <AdminDashboard 
                  user={currentUser}
                  users={users}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  journalCategories={journalCategories}
                  onJournalCategoriesChange={setJournalCategories}
                  attendanceSettings={attendanceSettings}
                  onAttendanceSettingsChange={setAttendanceSettings}
                  journals={journalEntries}
                  onResetData={handleResetData}
                />;
      default:
        return <div>Invalid user role</div>;
    }
  }, [currentUser, journalCategories, attendanceSettings, users, journalEntries, handleResetData, handleAddUser, handleUpdateUser, handleDeleteUser, handleAddJournal, handleUpdateJournal, handleDeleteJournal]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={fetchData} />;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout} toggleTheme={toggleTheme} theme={theme}>
      {DashboardComponent}
    </Layout>
  );
};

export default App;
