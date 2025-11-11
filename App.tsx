import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, JournalEntry } from './types';
import { INITIAL_JOURNAL_CATEGORIES, USERS, INITIAL_JOURNAL_ENTRIES } from './constants';
import { loadState, saveState } from './utils/storage';
import LoginScreen from './components/LoginScreen';
import StudentDashboard from './components/dashboards/StudentDashboard';
import TeacherDashboard from './components/dashboards/TeacherDashboard';
import ParentDashboard from './components/dashboards/ParentDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

const initializeJournals = (): JournalEntry[] => {
  const savedEntries = loadState<JournalEntry[]>('journalEntries', []);
  if (savedEntries.length > 0) {
    return savedEntries;
  }
  const initialEntriesWithIds = INITIAL_JOURNAL_ENTRIES.map((entry, index) => ({
    ...entry,
    id: `journal-${Date.now()}-${index}`,
  })) as JournalEntry[];
  return initialEntriesWithIds;
};

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

  useEffect(() => {
    try {
      setUsers(loadState('users', USERS));
      setJournalEntries(initializeJournals());
      setJournalCategories(loadState('journalCategories', INITIAL_JOURNAL_CATEGORIES));
      setAttendanceSettings(loadState('attendanceSettings', { startTime: '07:00', endTime: '09:00' }));
      setSchoolName(loadState('schoolName', 'SMP NEGERI 4 BALIKPAPAN'));
      setTheme(loadState('theme', 'light'));

      setTimeout(() => setIsLoading(false), 5000);
    } catch (e: any) {
      console.error("Gagal memuat data dari localStorage:", e);
      setError("Gagal memuat data aplikasi. Mungkin penyimpanan lokal Anda rusak atau tidak didukung. Coba bersihkan data situs untuk memulai kembali.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (!isLoading) saveState('users', users); }, [users, isLoading]);
  useEffect(() => { if (!isLoading) saveState('journalEntries', journalEntries); }, [journalEntries, isLoading]);
  useEffect(() => { if (!isLoading) saveState('journalCategories', journalCategories); }, [journalCategories, isLoading]);
  useEffect(() => { if (!isLoading) saveState('attendanceSettings', attendanceSettings); }, [attendanceSettings, isLoading]);
  useEffect(() => { if (!isLoading) saveState('schoolName', schoolName); }, [schoolName, isLoading]);
  useEffect(() => { if (!isLoading) saveState('theme', theme); }, [theme, isLoading]);

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
    const newJournal: JournalEntry = {
      id: `journal-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      submissionTime: new Date().toLocaleTimeString('id-ID', { hour12: false }),
      status: 'Pending',
      behaviorNote: '',
      ...newJournalData,
    } as JournalEntry;
    setJournalEntries(prev => [newJournal, ...prev]);
  };

  const handleUpdateJournal = async (updatedJournal: JournalEntry) => {
    setJournalEntries(prev => prev.map(j => j.id === updatedJournal.id ? updatedJournal : j));
  };

  const handleDeleteJournal = async (journalId: string) => {
    setJournalEntries(prev => prev.filter(j => j.id !== journalId));
  };

  const handleAddUser = async (newUser: User) => {
    setUsers(prev => [newUser, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const handleResetData = useCallback(() => {
    // The confirmation logic is now inside AdminDashboard
    localStorage.clear();
    setUsers(USERS);
    setJournalEntries(initializeJournals());
    setJournalCategories(INITIAL_JOURNAL_CATEGORIES);
    setAttendanceSettings({ startTime: '07:00', endTime: '09:00' });
    setSchoolName('SMP NEGERI 4 BALIKPAPAN');
    setTheme('light');
    setCurrentUser(null);
    // Reload is handled in the dashboard to show notification first
  }, []);

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
  }, [currentUser, journalCategories, attendanceSettings, users, journalEntries, handleResetData]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (error) {
     return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white">
        <div className="max-w-md w-full p-8 bg-gray-800 rounded-lg text-center">
          <i className="fas fa-exclamation-triangle fa-3x text-yellow-400 mb-4"></i>
          <h2 className="text-2xl font-bold mb-2 text-red-500">Gagal Memuat Aplikasi</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-3 text-center"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Coba Lagi
          </button>
        </div>
      </div>
    );
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