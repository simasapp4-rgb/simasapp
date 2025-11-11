
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { User, Parent, Student, JournalEntry, Mood, UserRole } from '../../types';
import Card from '../Card';

interface ParentDashboardProps {
  user: User;
  journals: JournalEntry[];
  users: User[];
}

const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Revision Needed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
};

const COLORS = {
  [Mood.HAPPY]: '#10B981',
  [Mood.GRATEFUL]: '#facc15',
  [Mood.NEUTRAL]: '#6B7280',
  [Mood.SAD]: '#3B82F6',
  [Mood.ANGRY]: '#EF4444',
  [Mood.EXCITED]: '#F59E0B'
};

const ParentDashboard: React.FC<ParentDashboardProps> = ({ user, journals, users }) => {
  const parentUser = user as Parent;
  const allStudents = useMemo(() => users.filter(u => u.role === UserRole.STUDENT) as Student[], [users]);
  const child = useMemo(() => allStudents.find(s => s.id === parentUser.childId), [parentUser.childId, allStudents]);
  
  const [hiddenJournalIds, setHiddenJournalIds] = useState<string[]>([]);
  
  const childJournals = useMemo(() => {
    if (!child) return [];
    return journals
      .filter(j => j.studentId === child.id && j.status === 'Approved')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [child, journals]);

  const visibleJournals = useMemo(() => {
    return childJournals.filter(j => !hiddenJournalIds.includes(j.id));
  }, [childJournals, hiddenJournalIds]);

  const handleCleanAllVisible = () => {
    const idsToHide = visibleJournals.map(j => j.id);
    setHiddenJournalIds(prev => [...new Set([...prev, ...idsToHide])]);
  };

  const moodData = useMemo(() => {
    const moodCounts = childJournals.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<Mood, number>);
    return Object.entries(moodCounts).map(([name, value]) => ({ name, value }));
  }, [childJournals]);
  
  const attendanceData = useMemo(() => {
    const attendanceCounts = childJournals.reduce((acc, entry) => {
      acc[entry.attendance] = (acc[entry.attendance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(attendanceCounts).map(([name, value]) => ({ name, value }));
  }, [childJournals]);

  if (!child) return <Card>Data anak tidak ditemukan.</Card>;

  return (
    <div className="space-y-6">
      {/* 1. Child Info Header */}
      <Card className="flex items-center">
          <img src={child.avatar} alt={child.name} className="w-20 h-20 rounded-full mr-6" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{child.name}</h3>
            <p className="text-gray-500 dark:text-gray-400">{child.class}</p>
          </div>
      </Card>

      {/* 2. Journal Summary (Main Content) */}
      <Card>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              <i className="fas fa-book-reader mr-2 text-primary-500"></i>Ringkasan Jurnal Anak
            </h3>
            <div className="flex items-center space-x-4">
                {visibleJournals.length > 0 && (
                    <button
                        onClick={handleCleanAllVisible}
                        className="text-sm font-medium text-yellow-600 hover:text-yellow-500"
                    >
                        <i className="fas fa-broom mr-1"></i>Bersihkan Laporan Terbaca
                    </button>
                )}
                {hiddenJournalIds.length > 0 && (
                    <button 
                        onClick={() => setHiddenJournalIds([])} 
                        className="text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
                    >
                        Tampilkan {hiddenJournalIds.length} jurnal tersembunyi
                    </button>
                )}
            </div>
        </div>
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
           {childJournals.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-folder-open fa-3x mb-3"></i>
                    <p>Belum ada jurnal yang disetujui untuk ditampilkan.</p>
                </div>
           ) : visibleJournals.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-check-circle fa-3x mb-3"></i>
                    <p>Semua jurnal telah disembunyikan.</p>
                    <button 
                        onClick={() => setHiddenJournalIds([])} 
                        className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
                    >
                        Tampilkan lagi
                    </button>
                </div>
           ) : visibleJournals.map(entry => (
            <div key={entry.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-gray-800 dark:text-white">{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div className="flex items-center">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadge(entry.status)}`}>{entry.status}</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <p><strong className="font-medium text-gray-600 dark:text-gray-300">Aktivitas:</strong> <span className="text-gray-500 dark:text-gray-400">{entry.activity}</span></p>
                 <p><strong className="font-medium text-gray-600 dark:text-gray-300">Refleksi Anak:</strong> <span className="text-gray-500 dark:text-gray-400">{entry.reflection}</span></p>
                {entry.teacherComment && (
                   <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/40 rounded-md border-l-4 border-primary-500">
                      <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">Catatan dari Guru:</p>
                      <p className="text-sm text-primary-700 dark:text-primary-300">{entry.teacherComment}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Charts (Supporting Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h4 className="text-lg font-semibold mb-4">Grafik Mood</h4>
           <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie data={moodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                        {moodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as Mood]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Card>
         <Card>
          <h4 className="text-lg font-semibold mb-4">Grafik Kehadiran</h4>
           <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Jumlah Hari" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;
