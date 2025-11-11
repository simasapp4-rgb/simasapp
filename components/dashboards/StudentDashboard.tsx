
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Mood, JournalEntry, Student } from '../../types';
import Card from '../Card';
import DashboardHeader from './DashboardHeader';

const moodOptions = [
  { mood: Mood.HAPPY, icon: 'fa-laugh-beam', color: 'text-green-500' },
  { mood: Mood.GRATEFUL, icon: 'fa-pray', color: 'text-yellow-500' },
  { mood: Mood.NEUTRAL, icon: 'fa-meh', color: 'text-gray-500' },
  { mood: Mood.SAD, icon: 'fa-sad-tear', color: 'text-blue-500' },
  { mood: Mood.ANGRY, icon: 'fa-angry', color: 'text-red-500' },
];

const ITEMS_PER_PAGE = 3;

type NotificationType = 'success' | 'info' | 'error';

interface StudentDashboardProps {
  user: User;
  journalCategories: string[];
  attendanceSettings: {
    startTime: string;
    endTime: string;
  };
  journals: JournalEntry[];
  onAddJournal: (entry: Partial<JournalEntry>) => Promise<void>;
  onUpdateJournal: (entry: JournalEntry) => Promise<void>;
  onDeleteJournal: (journalId: string) => Promise<void>;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, journalCategories, attendanceSettings, journals, onAddJournal, onUpdateJournal, onDeleteJournal }) => {
  const studentJournals = useMemo(() => 
    journals
      .filter(j => j.studentId === user.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.submissionTime.localeCompare(a.submissionTime)),
    [journals, user.id]
  );

  const [attendance, setAttendance] = useState<'Hadir' | 'Izin' | 'Sakit' | null>(null);
  const [reason, setReason] = useState('');
  
  // State for the journal form
  const [activity, setActivity] = useState('');
  const [reflection, setReflection] = useState('');
  const [category, setCategory] = useState<string>(journalCategories[0] || '');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const journalFormRef = useRef<HTMLDivElement>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      const isOpen = currentTime >= attendanceSettings.startTime && currentTime <= attendanceSettings.endTime;
      if (isOpen !== isAttendanceOpen) {
        setIsAttendanceOpen(isOpen);
      }
    };

    checkTime();
    const intervalId = setInterval(checkTime, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [attendanceSettings, isAttendanceOpen]);

  const displayNotification = (message: string, type: NotificationType, duration: number = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const paginatedJournals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return studentJournals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [studentJournals, currentPage]);

  const totalPages = Math.ceil(studentJournals.length / ITEMS_PER_PAGE);

  const handleAttendanceSelect = async (status: 'Hadir' | 'Izin' | 'Sakit') => {
    setAttendance(status);
    if (status === 'Hadir') {
      setIsSubmitting(true);
      const newEntry: Partial<JournalEntry> = {
        studentId: user.id,
        category: journalCategories[0] || 'Lainnya',
        activity: 'Mencatat kehadiran.',
        attendance: 'Hadir',
        behaviorNote: '',
        mood: Mood.HAPPY,
        reflection: 'Siap untuk belajar hari ini.',
      };
      await onAddJournal(newEntry);
      displayNotification('Absensi "Hadir" berhasil dicatat!', 'success');
      setAttendance(null);
      setIsSubmitting(false);
    }
  };

  const handleAttendanceSubmit = () => {
    displayNotification(`Absensi "${attendance}" dengan alasan "${reason}" telah dikirim.`, 'info');
    setReason('');
    setAttendance(null);
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity || !reflection || !selectedMood) {
      displayNotification('Mohon lengkapi semua isian jurnal dan pilih mood Anda.', 'error');
      return;
    }
    
    setIsSubmitting(true);

    if (editingJournalId) {
      const originalJournal = journals.find(j => j.id === editingJournalId);
      if (!originalJournal) {
          displayNotification('Jurnal yang akan diedit tidak ditemukan.', 'error');
          setIsSubmitting(false);
          return;
      };

      const updatedJournal: JournalEntry = {
        ...originalJournal,
        category,
        activity,
        reflection,
        mood: selectedMood,
        status: 'Pending', // Reset status on edit
      };
      await onUpdateJournal(updatedJournal);
      displayNotification('Jurnal berhasil diperbarui!', 'success');
    } else {
      const newEntry: Partial<JournalEntry> = {
        studentId: user.id,
        category,
        activity,
        attendance: 'Hadir',
        behaviorNote: '',
        mood: selectedMood,
        reflection,
      };
      await onAddJournal(newEntry);
      displayNotification('Jurnal baru berhasil dikirim!', 'success');
    }
    
    // Reset form
    handleCancelEdit();
    setIsSubmitting(false);
  };

  const handleEditJournal = (entry: JournalEntry) => {
    setEditingJournalId(entry.id);
    setCategory(entry.category);
    setActivity(entry.activity);
    setReflection(entry.reflection);
    setSelectedMood(entry.mood);
    journalFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingJournalId(null);
    setActivity('');
    setReflection('');
    setCategory(journalCategories[0] || '');
    setSelectedMood(null);
  };

  const handleDeleteRequest = (journalId: string) => {
    setJournalToDelete(journalId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (journalToDelete) {
      await onDeleteJournal(journalToDelete);
      displayNotification('Jurnal berhasil dihapus.', 'info');
    }
    setJournalToDelete(null);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = () => {
    setJournalToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleDownloadExcel = () => {
    if (studentJournals.length === 0) {
      displayNotification('Tidak ada data jurnal untuk diunduh.', 'info');
      return;
    }
    const headers = ['Tanggal', 'Waktu Kirim', 'Kategori', 'Uraian Kegiatan', 'Refleksi', 'Mood', 'Status', 'Komentar Guru'];
    const rows = studentJournals.map(j => [
      new Date(j.date).toLocaleDateString('id-ID'),
      j.submissionTime,
      j.category,
      `"${(j.activity || '').replace(/"/g, '""')}"`,
      `"${(j.reflection || '').replace(/"/g, '""')}"`,
      j.mood,
      j.status,
      `"${(j.teacherComment || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jurnal_${user.name.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    displayNotification('Unduhan Excel (CSV) telah dimulai.', 'success');
  };

  const handleDownloadPdf = () => {
    if (studentJournals.length === 0) {
      displayNotification('Tidak ada data jurnal untuk diunduh.', 'info');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      displayNotification('Gagal membuka jendela baru. Mohon izinkan pop-up.', 'error');
      return;
    }

    const journalHtml = studentJournals.map(entry => `
      <div style="border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; page-break-inside: avoid;">
        <p><strong>Tanggal:</strong> ${new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p><strong>Waktu Kirim:</strong> ${entry.submissionTime}</p>
        <p><strong>Kategori:</strong> ${entry.category}</p>
        <p><strong>Kegiatan:</strong> ${entry.activity}</p>
        <p><strong>Refleksi:</strong> ${entry.reflection}</p>
        <p><strong>Mood:</strong> ${entry.mood}</p>
        <p><strong>Status:</strong> ${entry.status}</p>
        ${entry.teacherComment ? `<p><strong>Komentar Guru:</strong> ${entry.teacherComment}</p>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Jurnal Siswa - ${user.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            h1, h2 { color: #0056b3; }
            h1 { font-size: 24px; }
            h2 { font-size: 20px; border-bottom: 2px solid #0056b3; padding-bottom: 5px; }
            p { margin: 0.5rem 0; }
            strong { color: #333; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>Riwayat Jurnal & Refleksi</h1>
          <h2>${user.name} - ${(user as Student).class}</h2>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 1rem 0;" />
          ${journalHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        try {
            printWindow.print();
            printWindow.close();
        } catch (e) {
            console.error("Printing failed", e);
            displayNotification('Gagal membuka dialog cetak.', 'error');
        }
    }, 500);
    displayNotification('Mempersiapkan dokumen PDF...', 'info');
  };


  return (
    <div className="space-y-6">
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
              Konfirmasi Penghapusan
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus entri jurnal ini? Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed top-20 right-6 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 flex items-center
            ${notification.type === 'success' && 'bg-green-500'}
            ${notification.type === 'info' && 'bg-blue-500'}
            ${notification.type === 'error' && 'bg-red-500'}
        `}>
            <i className={`fas ${
                notification.type === 'success' ? 'fa-check-circle' :
                notification.type === 'info' ? 'fa-info-circle' :
                'fa-exclamation-circle'
            } mr-3`}></i>
            <span>{notification.message}</span>
        </div>
      )}

      <DashboardHeader user={user as Student} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4"><i className="fas fa-user-check mr-2 text-primary-500"></i>Absensi Harian</h3>
            {isAttendanceOpen ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleAttendanceSelect('Hadir')} disabled={isSubmitting} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all border-gray-300 dark:border-gray-600 hover:border-green-400 disabled:opacity-50`}>
                    <i className="fas fa-check-circle fa-2x text-green-500"></i>
                    <span className="text-sm mt-1">Hadir</span>
                  </button>
                  <button onClick={() => handleAttendanceSelect('Izin')} disabled={isSubmitting} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${attendance === 'Izin' ? 'border-yellow-500 bg-yellow-100 dark:bg-yellow-900' : 'border-gray-300 dark:border-gray-600 hover:border-yellow-400'}`}>
                    <i className="fas fa-file-alt fa-2x text-yellow-500"></i>
                    <span className="text-sm mt-1">Izin</span>
                  </button>
                  <button onClick={() => handleAttendanceSelect('Sakit')} disabled={isSubmitting} className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${attendance === 'Sakit' ? 'border-red-500 bg-red-100 dark:bg-red-900' : 'border-gray-300 dark:border-gray-600 hover:border-red-400'}`}>
                    <i className="fas fa-briefcase-medical fa-2x text-red-500"></i>
                    <span className="text-sm mt-1">Sakit</span>
                  </button>
                </div>
                {(attendance === 'Izin' || attendance === 'Sakit') && (
                  <div className="mt-4 space-y-2 animate-fade-in">
                    <label className="block text-sm font-medium">Keterangan</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"></textarea>
                    <button onClick={handleAttendanceSubmit} className="w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5">
                      Kirim Absensi
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">Absensi Ditutup</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  Absensi hanya dibuka dari pukul {attendanceSettings.startTime} hingga {attendanceSettings.endTime}.
                </p>
              </div>
            )}
          </Card>

          <Card ref={journalFormRef}>
            <h3 className="text-xl font-semibold mb-4"><i className="fas fa-pencil-alt mr-2 text-primary-500"></i>{editingJournalId ? 'Edit Jurnal' : 'Isi Jurnal & Refleksi'}</h3>
            <form onSubmit={handleJournalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Kategori Kegiatan</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500">
                  {journalCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Uraian Kegiatan</label>
                <textarea value={activity} onChange={e => setActivity(e.target.value)} rows={3} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium">Refleksi Hari Ini</label>
                <textarea value={reflection} onChange={e => setReflection(e.target.value)} rows={3} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bagaimana Perasaanmu?</label>
                <div className="flex justify-around">
                  {moodOptions.map(({ mood, icon, color }) => (
                    <button type="button" key={mood} onClick={() => setSelectedMood(mood)} className={`flex flex-col items-center p-2 rounded-lg transition-transform transform ${selectedMood === mood ? 'scale-125' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}>
                      <i className={`fas ${icon} fa-2x ${color}`}></i>
                      <span className="text-xs mt-1">{mood}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {editingJournalId && (
                  <button type="button" onClick={handleCancelEdit} className="w-full text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-medium rounded-lg text-sm px-5 py-2.5">
                    Batal
                  </button>
                )}
                <button type="submit" disabled={isSubmitting} className="w-full text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-primary-400 disabled:cursor-wait">
                  {isSubmitting ? 'Mengirim...' : (editingJournalId ? 'Perbarui Jurnal' : 'Kirim Jurnal')}
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
              <h3 className="text-xl font-semibold"><i className="fas fa-history mr-2 text-primary-500"></i>Riwayat Jurnal & Refleksi</h3>
              <div className="space-x-2">
                <button onClick={handleDownloadExcel} className="px-3 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-md hover:bg-green-300 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"><i className="fas fa-file-excel mr-1"></i>Excel</button>
                <button onClick={handleDownloadPdf} className="px-3 py-1 text-xs font-medium text-red-800 bg-red-200 rounded-md hover:bg-red-300 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"><i className="fas fa-file-pdf mr-1"></i>PDF</button>
              </div>
            </div>
            <div className="space-y-4 min-h-[450px]">
              {paginatedJournals.length > 0 ? paginatedJournals.map(entry => (
                <div key={entry.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Dikirim pukul {entry.submissionTime}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => handleEditJournal(entry)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"><i className="fas fa-edit"></i></button>
                      <button onClick={() => handleDeleteRequest(entry.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><i className="fas fa-trash"></i></button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <p><strong className="font-medium text-gray-800 dark:text-gray-100">Kegiatan:</strong> {entry.activity}</p>
                    <p><strong className="font-medium text-gray-800 dark:text-gray-100">Refleksi:</strong> {entry.reflection}</p>
                  </div>
                   {entry.status === 'Approved' && entry.teacherComment && (
                    <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/40 rounded-md border-l-4 border-primary-500">
                      <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">
                        <i className="fas fa-chalkboard-user mr-2"></i>Komentar Guru:
                      </p>
                      <p className="text-sm text-primary-700 dark:text-primary-300 pl-5">{entry.teacherComment}</p>
                    </div>
                  )}
                </div>
              )) : (
                 <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-folder-open fa-3x mb-3"></i>
                    <p>Belum ada riwayat jurnal.</p>
                 </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                  Sebelumnya
                </button>
                <span className="text-sm">Halaman {currentPage} dari {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
                  Selanjutnya
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
