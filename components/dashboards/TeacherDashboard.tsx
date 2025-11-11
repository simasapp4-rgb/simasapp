
import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { User, Student, JournalEntry, Mood, Teacher, UserRole } from '../../types';
import Card from '../Card';
import DashboardHeader from './DashboardHeader';

interface TeacherDashboardProps {
  user: User;
  journals: JournalEntry[];
  onUpdateJournal: (entry: JournalEntry) => Promise<void>;
  users: User[];
}

const ITEMS_PER_PAGE = 4;
type NotificationType = 'success' | 'info' | 'error';

const moodOptions = [
  { mood: Mood.HAPPY, icon: 'fa-laugh-beam', color: 'text-green-500' },
  { mood: Mood.GRATEFUL, icon: 'fa-pray', color: 'text-yellow-500' },
  { mood: Mood.NEUTRAL, icon: 'fa-meh', color: 'text-gray-500' },
  { mood: Mood.SAD, icon: 'fa-sad-tear', color: 'text-blue-500' },
  { mood: Mood.ANGRY, icon: 'fa-angry', color: 'text-red-500' },
  { mood: Mood.EXCITED, icon: 'fa-bolt', color: 'text-orange-500' },
];

const getMoodDetails = (mood: Mood) => {
    return moodOptions.find(opt => opt.mood === mood) || { icon: 'fa-question-circle', color: 'text-gray-400'};
}

const getStatusBadge = (status: 'Pending' | 'Approved' | 'Revision Needed') => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Revision Needed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, journals, onUpdateJournal, users }) => {
  const allStudents = useMemo(() => users.filter(u => u.role === UserRole.STUDENT) as Student[], [users]);
  const myStudents = useMemo(() => allStudents.filter(s => s.teacherId === user.id), [allStudents, user.id]);
  const availableClasses = useMemo(() => [...new Set(myStudents.map(s => s.class))], [myStudents]);

  const [filters, setFilters] = useState({ class: 'all', studentId: 'all', date: '' });
  const [sortOption, setSortOption] = useState('newest');
  const [showCompleted, setShowCompleted] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [teacherComment, setTeacherComment] = useState('');
  const [newStatus, setNewStatus] = useState<'Approved' | 'Revision Needed'>('Approved');
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('');
  
  const getStudent = (studentId: string) => allStudents.find(s => s.id === studentId);

  const reportInfo = useMemo(() => {
    if (!selectedStudentForReport) {
        return { count: 0, studentName: '', summaryText: null };
    }
    const student = getStudent(selectedStudentForReport);
    if (!student) {
        return { count: 0, studentName: '', summaryText: null };
    }
    const journalCount = journals.filter(j => j.studentId === selectedStudentForReport).length;
    
    const summaryText = journalCount === 0 
        ? `Tidak ada entri jurnal yang ditemukan untuk ${student.name}.`
        : `Ditemukan ${journalCount} entri jurnal untuk ${student.name}.`;

    return { count: journalCount, studentName: student.name, summaryText };
  }, [selectedStudentForReport, journals]);

  const displayNotification = (message: string, type: NotificationType, duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const studentsInSelectedClass = useMemo(() => {
    if (filters.class === 'all') return myStudents;
    return myStudents.filter(s => s.class === filters.class);
  }, [filters.class, myStudents]);

  const filteredJournals = useMemo(() => {
    const statusPriority = {
        'Pending': 1,
        'Revision Needed': 2,
        'Approved': 3
    };

    return journals
      .filter(j => studentsInSelectedClass.some(s => s.id === j.studentId)) 
      .filter(j => filters.studentId === 'all' || j.studentId === filters.studentId)
      .filter(j => !filters.date || j.date === filters.date)
      .filter(j => showCompleted || j.status !== 'Approved')
      .sort((a, b) => {
        switch (sortOption) {
            case 'oldest':
                return new Date(`${a.date}T${a.submissionTime}`).getTime() - new Date(`${b.date}T${b.submissionTime}`).getTime();
            case 'status':
                const priorityA = statusPriority[a.status];
                const priorityB = statusPriority[b.status];
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                // if status is same, sort by newest
                return new Date(`${b.date}T${b.submissionTime}`).getTime() - new Date(`${a.date}T${a.submissionTime}`).getTime();
            case 'newest':
            default:
                return new Date(`${b.date}T${b.submissionTime}`).getTime() - new Date(`${a.date}T${a.submissionTime}`).getTime();
        }
      });
  }, [filters, sortOption, journals, studentsInSelectedClass, showCompleted]);

  const paginatedJournals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJournals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredJournals, currentPage]);

  const totalPages = Math.ceil(filteredJournals.length / ITEMS_PER_PAGE);

  const moodChartData = useMemo(() => {
      const dataByDate = filteredJournals.reduce((acc, entry) => {
          const date = new Date(entry.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
          if (!acc[date]) {
              acc[date] = { date, [Mood.HAPPY]: 0, [Mood.GRATEFUL]: 0, [Mood.NEUTRAL]: 0, [Mood.SAD]: 0, [Mood.ANGRY]: 0, [Mood.EXCITED]: 0 };
          }
          acc[date][entry.mood]++;
          return acc;
      }, {} as any);
      return Object.values(dataByDate).sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredJournals]);

  const openResponseModal = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    setTeacherComment(journal.teacherComment || '');
    setNewStatus(journal.status === 'Revision Needed' ? 'Revision Needed' : 'Approved');
    setIsResponseModalOpen(true);
  };

  const handleResponseSubmit = async () => {
    if (!selectedJournal) return;
    const updatedJournal = { ...selectedJournal, teacherComment, status: newStatus };
    await onUpdateJournal(updatedJournal);
    setIsResponseModalOpen(false);
    setSelectedJournal(null);
    displayNotification('Respon berhasil dikirim!', 'success');
  };
  
  const handleDownload = (format: 'csv' | 'pdf') => {
      if (filteredJournals.length === 0) {
        displayNotification('Tidak ada data untuk diunduh.', 'info');
        return;
      }
      if (format === 'csv') handleDownloadExcel();
      else handleDownloadPdf();
  };

  const handleDownloadExcel = () => {
    const headers = ['Nama Siswa', 'Kelas', 'Tanggal', 'Waktu Kirim', 'Absensi', 'Kategori', 'Uraian Kegiatan', 'Refleksi', 'Mood', 'Status', 'Komentar Guru'];
    const rows = filteredJournals.map(j => {
        const student = getStudent(j.studentId);
        return [
            student?.name || 'N/A', student?.class || 'N/A', new Date(j.date).toLocaleDateString('id-ID'), j.submissionTime, j.attendance,
            j.category, `"${(j.activity || '').replace(/"/g, '""')}"`, `"${(j.reflection || '').replace(/"/g, '""')}"`,
            j.mood, j.status, `"${(j.teacherComment || '').replace(/"/g, '""')}"`
        ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_jurnal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      displayNotification('Gagal membuka jendela baru. Mohon izinkan pop-up.', 'error');
      return;
    }
    const journalHtml = filteredJournals.map(entry => {
        const student = getStudent(entry.studentId);
        return `
        <div style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; page-break-inside: avoid;">
            <p><strong>Siswa:</strong> ${student?.name || 'N/A'} (${student?.class || 'N/A'})</p>
            <p><strong>Tanggal:</strong> ${new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - ${entry.submissionTime}</p>
            <p><strong>Absensi:</strong> ${entry.attendance}</p>
            <p><strong>Kegiatan:</strong> ${entry.activity}</p>
            <p><strong>Refleksi:</strong> ${entry.reflection}</p>
            <p><strong>Mood:</strong> ${entry.mood}</p>
            <p><strong>Status:</strong> ${entry.status}</p>
            ${entry.teacherComment ? `<p><strong>Komentar Anda:</strong> ${entry.teacherComment}</p>` : ''}
        </div>
        `;
    }).join('');

    printWindow.document.write(`
        <html><head><title>Laporan Jurnal Siswa</title>
        <style>body { font-family: sans-serif; } h1, h2 { color: #1d4ed8; } div { margin-bottom: 1rem; }</style>
        </head><body><h1>Laporan Jurnal Siswa</h1>${journalHtml}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };
  
  const handleFullReportDownload = (format: 'csv' | 'pdf') => {
    if (!selectedStudentForReport) {
        displayNotification('Silakan pilih siswa terlebih dahulu.', 'info');
        return;
    }

    const studentToReport = getStudent(selectedStudentForReport);
    if (!studentToReport) {
        displayNotification('Data siswa tidak ditemukan.', 'error');
        return;
    }
    
    // Get ALL journals for the selected student, ignoring page filters
    const studentJournals = journals
        .filter(j => j.studentId === selectedStudentForReport)
        .sort((a, b) => new Date(`${a.date}T${a.submissionTime}`).getTime() - new Date(`${b.date}T${b.submissionTime}`).getTime()); // Sort from oldest to newest

    if (studentJournals.length === 0) {
        displayNotification('Siswa ini belum memiliki jurnal untuk diunduh.', 'info');
        return;
    }

    if (format === 'csv') {
        const headers = ['Nama Siswa', 'Kelas', 'Tanggal', 'Waktu Kirim', 'Absensi', 'Kategori', 'Uraian Kegiatan', 'Refleksi', 'Mood', 'Status', 'Komentar Guru'];
        const rows = studentJournals.map(j => {
            const student = getStudent(j.studentId);
            return [
                student?.name || 'N/A', student?.class || 'N/A', new Date(j.date).toLocaleDateString('id-ID'), j.submissionTime, j.attendance,
                j.category, `"${(j.activity || '').replace(/"/g, '""')}"`, `"${(j.reflection || '').replace(/"/g, '""')}"`,
                j.mood, j.status, `"${(j.teacherComment || '').replace(/"/g, '""')}"`
            ];
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_jurnal_lengkap_${studentToReport.name.replace(/\s/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        displayNotification('Unduhan CSV laporan lengkap telah dimulai.', 'success');
    } else { // PDF
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            displayNotification('Gagal membuka jendela baru. Mohon izinkan pop-up.', 'error');
            return;
        }
        const journalHtml = studentJournals.map(entry => {
            return `
            <div style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; page-break-inside: avoid;">
                <p><strong>Tanggal:</strong> ${new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - ${entry.submissionTime}</p>
                <p><strong>Absensi:</strong> ${entry.attendance}</p>
                <p><strong>Kegiatan:</strong> ${entry.activity}</p>
                <p><strong>Refleksi:</strong> ${entry.reflection}</p>
                <p><strong>Mood:</strong> ${entry.mood}</p>
                <p><strong>Status:</strong> ${entry.status}</p>
                ${entry.teacherComment ? `<p><strong>Komentar Guru:</strong> ${entry.teacherComment}</p>` : ''}
            </div>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Laporan Jurnal Lengkap - ${studentToReport.name}</title>
                <style>body { font-family: sans-serif; } h1, h2 { color: #1d4ed8; } div { margin-bottom: 1rem; }</style>
            </head>
            <body>
                <h1>Laporan Jurnal Lengkap</h1>
                <h2>${studentToReport.name} - ${studentToReport.class}</h2>
                <hr style="border: none; border-top: 1px solid #ccc; margin: 1rem 0;" />
                ${journalHtml}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
        displayNotification('Mempersiapkan PDF laporan lengkap...', 'info');
    }
  };

  const pendingReviews = journals.filter(j => myStudents.some(s => s.id === j.studentId) && j.status === 'Pending').length;
  const submissionsToday = journals.filter(j => myStudents.some(s => s.id === j.studentId) && j.date === new Date().toISOString().split('T')[0]).length;
  
  useEffect(() => {
     if(filters.class !== 'all') {
         setFilters(f => ({...f, studentId: 'all' }));
     }
  }, [filters.class]);

  return (
    <div className="space-y-6">
       {notification && (
        <div className={`fixed top-20 right-6 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 flex items-center
            ${notification.type === 'success' && 'bg-green-500'}
            ${notification.type === 'info' && 'bg-blue-500'}
            ${notification.type === 'error' && 'bg-red-500'}
        `}>
            <i className={`fas ${ notification.type === 'success' ? 'fa-check-circle' : 'fa-info-circle' } mr-3`}></i>
            <span>{notification.message}</span>
        </div>
      )}

      {isResponseModalOpen && selectedJournal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Beri Respon Jurnal</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Untuk: {getStudent(selectedJournal.studentId)?.name} - {new Date(selectedJournal.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="p-6 space-y-4 overflow-y-auto">
                    <div><span className="font-semibold">Mood:</span> {selectedJournal.mood}</div>
                    <div><span className="font-semibold">Kehadiran:</span> {selectedJournal.attendance}</div>
                    <p><strong className="font-medium">Kegiatan:</strong> {selectedJournal.activity}</p>
                    <p><strong className="font-medium">Refleksi Siswa:</strong> {selectedJournal.reflection}</p>
                    <hr className="dark:border-gray-600"/>
                    <div>
                        <label className="block text-sm font-medium mb-2">Catatan / Umpan Balik Anda</label>
                        <textarea value={teacherComment} onChange={e => setTeacherComment(e.target.value)} rows={4} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-2">Ubah Status</label>
                        <div className="flex gap-2">
                            <button onClick={() => setNewStatus('Approved')} className={`flex-1 py-2 text-sm rounded-md border-2 ${newStatus === 'Approved' ? 'border-green-500 bg-green-100 dark:bg-green-900' : 'border-gray-300 dark:border-gray-600'}`}>Setujui</button>
                            <button onClick={() => setNewStatus('Revision Needed')} className={`flex-1 py-2 text-sm rounded-md border-2 ${newStatus === 'Revision Needed' ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900' : 'border-gray-300 dark:border-gray-600'}`}>Perlu Revisi</button>
                        </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-3">
                      <button onClick={() => setIsResponseModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Batal</button>
                      <button onClick={handleResponseSubmit} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Simpan & Kirim</button>
                  </div>
              </div>
          </div>
      )}

      <DashboardHeader user={user as Teacher} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><h5 className="text-gray-500 dark:text-gray-400">Total Siswa</h5><p className="text-3xl font-bold">{myStudents.length}</p></Card>
        <Card><h5 className="text-gray-500 dark:text-gray-400">Jurnal Perlu Diperiksa</h5><p className="text-3xl font-bold text-yellow-500">{pendingReviews}</p></Card>
        <Card><h5 className="text-gray-500 dark:text-gray-400">Entri Hari Ini</h5><p className="text-3xl font-bold">{submissionsToday}</p></Card>
        <Card><h5 className="text-gray-500 dark:text-gray-400">Kehadiran Hari Ini</h5><p className="text-3xl font-bold">100%</p></Card>
      </div>

      <Card>
          <h3 className="text-xl font-semibold mb-4">Laporan Mood Siswa (Mingguan)</h3>
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moodChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey={Mood.HAPPY} stroke="#10B981" name="Senang" /><Line type="monotone" dataKey={Mood.GRATEFUL} stroke="#F59E0B" name="Bersyukur"/><Line type="monotone" dataKey={Mood.NEUTRAL} stroke="#6B7280" name="Biasa"/><Line type="monotone" dataKey={Mood.SAD} stroke="#3B82F6" name="Sedih"/><Line type="monotone" dataKey={Mood.ANGRY} stroke="#EF4444" name="Marah"/></LineChart>
          </ResponsiveContainer>
      </Card>
      
      <Card>
        <h3 className="text-xl font-semibold mb-4"><i className="fas fa-user-clock mr-2 text-primary-500"></i>Laporan Lengkap per Siswa</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Unduh seluruh riwayat jurnal untuk siswa tertentu. Pilihan ini akan mengabaikan filter yang sedang aktif di laporan utama.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <select 
                value={selectedStudentForReport} 
                onChange={e => setSelectedStudentForReport(e.target.value)} 
                className="flex-grow w-full sm:w-auto rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Pilih Siswa --</option>
                {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleFullReportDownload('csv')} 
                  disabled={!selectedStudentForReport || reportInfo.count === 0}
                  className="flex-1 sm:w-auto px-4 py-2 text-sm font-medium text-green-800 bg-green-200 rounded-md hover:bg-green-300 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-file-excel mr-1"></i>Unduh CSV
                </button>
                <button 
                  onClick={() => handleFullReportDownload('pdf')} 
                  disabled={!selectedStudentForReport || reportInfo.count === 0}
                  className="flex-1 sm:w-auto px-4 py-2 text-sm font-medium text-red-800 bg-red-200 rounded-md hover:bg-red-300 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-file-pdf mr-1"></i>Unduh PDF
                </button>
              </div>
            </div>
            {reportInfo.summaryText && (
                <p className="text-sm text-center sm:text-left text-gray-600 dark:text-gray-400 animate-fade-in pt-2">
                    <i className="fas fa-info-circle mr-2"></i>{reportInfo.summaryText}
                </p>
            )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Laporan Jurnal & Absen Siswa</h3>
          <div className="flex items-center space-x-2">
            <button onClick={() => handleDownload('csv')} className="px-3 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-md hover:bg-green-300 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"><i className="fas fa-file-excel mr-1"></i>Excel</button>
            <button onClick={() => handleDownload('pdf')} className="px-3 py-1 text-xs font-medium text-red-800 bg-red-200 rounded-md hover:bg-red-300 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"><i className="fas fa-file-pdf mr-1"></i>PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
           <select value={filters.class} onChange={e => { setFilters({...filters, class: e.target.value}); setCurrentPage(1); }} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-primary-500 focus:border-primary-500">
            <option value="all">Semua Kelas</option>
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.studentId} onChange={e => { setFilters({...filters, studentId: e.target.value}); setCurrentPage(1); }} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-primary-500 focus:border-primary-500">
            <option value="all">Semua Siswa</option>
            {studentsInSelectedClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={filters.date} onChange={e => { setFilters({...filters, date: e.target.value}); setCurrentPage(1); }} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
          <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus:ring-primary-500 focus:border-primary-500">
            <option value="newest">Urutkan: Terbaru</option>
            <option value="oldest">Urutkan: Terlama</option>
            <option value="status">Urutkan: Status</option>
          </select>
          <button onClick={() => setShowCompleted(prev => !prev)} className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 transition-colors">
              {showCompleted ? (
                  <span><i className="fas fa-broom mr-2"></i>Bersihkan Laporan Selesai</span>
              ) : (
                  <span><i className="fas fa-eye mr-2"></i>Tampilkan Semua Laporan</span>
              )}
          </button>
          <button onClick={() => { setFilters({class: 'all', studentId: 'all', date: ''}); setSortOption('newest'); setCurrentPage(1); setShowCompleted(true); }} className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Reset Filter</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[400px]">
          {paginatedJournals.length > 0 ? paginatedJournals.map(entry => {
            const student = getStudent(entry.studentId);
            const mood = getMoodDetails(entry.mood);
            if (!student) return null;
            return (
              <div key={entry.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full mr-3" />
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-white">{student.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - {entry.submissionTime}</p>
                        </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusBadge(entry.status)}`}>{entry.status}</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                     <p><i title={entry.mood} className={`fas ${mood.icon} ${mood.color} mr-2`}></i><strong className="font-medium text-gray-800 dark:text-gray-100">Kegiatan:</strong> {entry.activity}</p>
                     <p><strong className="font-medium text-gray-800 dark:text-gray-100">Refleksi:</strong> {entry.reflection}</p>
                  </div>
                </div>
                <button onClick={() => openResponseModal(entry)} className="mt-4 w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors">
                  <i className="fas fa-pen-to-square mr-2"></i>Beri Respon
                </button>
              </div>
            )
          }) : (
            <div className="col-span-1 lg:col-span-2 text-center py-10 text-gray-500 dark:text-gray-400">
                <i className="fas fa-folder-open fa-3x mb-3"></i>
                <p>Tidak ada jurnal yang sesuai dengan filter.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Sebelumnya</button>
             <span className="text-sm">Halaman {currentPage} dari {totalPages}</span>
             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Selanjutnya</button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherDashboard;
