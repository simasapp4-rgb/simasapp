
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
  children: React.ReactNode;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case UserRole.STUDENT: return 'fa-user-graduate';
    case UserRole.TEACHER: return 'fa-chalkboard-user';
    case UserRole.PARENT: return 'fa-users';
    case UserRole.ADMIN: return 'fa-user-shield';
    default: return 'fa-user';
  }
};

const Layout: React.FC<LayoutProps> = ({ user, onLogout, toggleTheme, theme, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 h-16 shadow-sm sticky top-0 z-10">
        {/* Left side: App Title */}
        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          <i className="fas fa-book-open mr-2"></i>Jurnal Siswa
        </h1>
        
        {/* Right side: User Info & Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end">
                <i className={`fas ${getRoleIcon(user.role)} mr-1.5`}></i>
                {user.role}
              </p>
            </div>
             <img className="h-10 w-10 rounded-full object-cover ml-3" src={user.avatar} alt={user.name} />
          </div>

          <div className="h-8 border-l border-gray-200 dark:border-gray-700"></div>

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle theme">
            <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'} text-gray-600 dark:text-gray-300`}></i>
          </button>
          
          <button onClick={onLogout} className="flex items-center text-sm px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            <i className="fas fa-sign-out-alt mr-2"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>
      
      {/* Page Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
