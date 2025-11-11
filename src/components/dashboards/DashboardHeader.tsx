
import React, { useState, useEffect } from 'react';
import { User, Student, Teacher, UserRole } from '../../types';

interface DashboardHeaderProps {
  user: User;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 11) return { text: 'Pagi', icon: 'fa-cloud-sun' };
    if (hour < 15) return { text: 'Siang', icon: 'fa-sun' };
    if (hour < 18) return { text: 'Sore', icon: 'fa-cloud-sun' };
    return { text: 'Malam', icon: 'fa-moon' };
  };

  const getUserSubtitle = () => {
    if (user.role === UserRole.STUDENT) {
      return (user as Student).class;
    }
    if (user.role === UserRole.TEACHER) {
      return (user as Teacher).subject;
    }
    return user.role;
  };

  const greeting = getGreeting();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex items-center col-span-1 md:col-span-2">
        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full mr-4"/>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{user.name}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {getUserSubtitle()}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Waktu</p>
          <p className="text-2xl font-bold">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <i className="fas fa-clock text-3xl text-primary-400"></i>
      </div>
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400">{currentTime.toLocaleDateString('id-ID', { weekday: 'long' })}</p>
          <p className="text-lg font-bold">{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
         <i className={`fas ${greeting.icon} text-3xl text-yellow-400 animate-gentle-bob`}></i>
      </div>
    </div>
  );
};

export default DashboardHeader;
