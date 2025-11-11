import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { User, UserRole, Student, Teacher, Parent, Admin, JournalEntry } from '../../types';
import Card from '../Card';
import DashboardHeader from './DashboardHeader';

type ActiveTab = 'Siswa' | 'Guru' | 'Orang Tua' | 'Admin';
type NotificationType = 'success' | 'error' | 'info';

const initialFormData = {
  id: '', name: '', password: '', email: '', nisn: '', class: '',
  nip: '', subject: '', nik: '', childId: '', childName: '', childNisn: '', childClass: '', avatar: ''
};

interface AdminDashboardProps {
  user: User;
  users: User[];
  onAddUser: (user: User) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  journalCategories: string[];
  onJournalCategoriesChange: (categories: string[]) => void;
  attendanceSettings: { startTime: string; endTime: string };
  onAttendanceSettingsChange: (settings: { startTime: string; endTime: string }) => void;
  journals: JournalEntry[];
  onResetData: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  journalCategories,
  onJournalCategoriesChange,
  attendanceSettings,
  onAttendanceSettingsChange,
  journals,
  onResetData,
}) => {
  const students = useMemo(() => users.filter(u => u.role === UserRole.STUDENT) as Student[], [users]);
  const teachers = useMemo(() => users.filter(u => u.role === UserRole.TEACHER) as Teacher[], [users]);
  const parents = useMemo(() => users.filter(u => u.role === UserRole.PARENT) as Parent[], [users]);
  const admins = useMemo(() => users.filter(u => u.role === UserRole.ADMIN) as Admin[], [users]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('Siswa');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [formData, setFormData] = useState(initialFormData);
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);


  // New states for settings
  const [localAttendanceSettings, setLocalAttendanceSettings] = useState(attendanceSettings);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ original: string; current: string } | null>(null);
  const [isCategoryDeleteConfirmOpen, setIsCategoryDeleteConfirmOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const displayNotification = (message: string, type: NotificationType, duration: number = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  useEffect(() => {
    if (isModalOpen) {
      if (editingUser) {
        setNewUserRole(editingUser.role);
        setFormData({ ...initialFormData, ...editingUser, password: '' }); // Clear password on edit
      } else {
        setNewUserRole(UserRole.STUDENT);
        setFormData(initialFormData);
      }
    }
  }, [isModalOpen, editingUser]);

  useEffect(() => {
    setLocalAttendanceSettings(attendanceSettings);
  }, [attendanceSettings]);

  // Lock body scroll when any modal is open to improve mobile stability
  useEffect(() => {
    const modalsAreOpen = isModalOpen || isDeleteConfirmOpen || isCategoryModalOpen || isCategoryDeleteConfirmOpen || isResetModalOpen;
    if (modalsAreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen, isDeleteConfirmOpen, isCategoryModalOpen, isCategoryDeleteConfirmOpen, isResetModalOpen]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const generateRandomPassword = () => {
    const token = Math.random().toString(36).substring(2, 10);
    setFormData(prev => ({ ...prev, password: token }));
    displayNotification('Sandi baru telah dibuat.', 'info', 2000);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const passwordToSave = formData.password || editingUser.password;
        const updatedUser = { ...editingUser, ...formData, password: passwordToSave };
        await onUpdateUser(updatedUser);
        displayNotification('Pengguna berhasil diperbarui!', 'success');
      } else {
        const newId = `${newUserRole.toLowerCase().replace(/\s/g, '')}-${Date.now()}`;
        const passwordToSave = formData.password || Math.random().toString(36).substring(2, 10);
        
        const baseData = {
          id: newId,
          name: formData.name,
          email: formData.email,
          password: passwordToSave,
          avatar: formData.avatar || `https://i.pravatar.cc/150?u=${newId}`,
        };
        
        let userPayload: User;

        switch (newUserRole) {
            case UserRole.STUDENT:
                userPayload = { ...baseData, role: UserRole.STUDENT, nisn: formData.nisn, class: formData.class, teacherId: '', parentId: '' } as Student;
                break;
            case UserRole.TEACHER:
                userPayload = { ...baseData, role: UserRole.TEACHER, nip: formData.nip, class: '', subject: formData.subject } as Teacher;
                break;
            case UserRole.PARENT:
                userPayload = { ...baseData, role: UserRole.PARENT, nik: formData.nik, childId: formData.childId } as Parent;
                break;
            case UserRole.ADMIN:
                userPayload = { ...baseData, role: UserRole.ADMIN, nip: formData.nip } as Admin;
                break;
            default:
                throw new Error("Invalid user role");
        }
        
        await onAddUser(userPayload);
        displayNotification('Pengguna baru berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error("Failed to save user:", error);
      displayNotification(error.message || 'Gagal menyimpan pengguna. Silakan coba lagi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEditClick = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setIsModalOpen(true);
  };
  
  const handleDeleteClick = (userToDelete: User) => {
    setDeletingUser(userToDelete);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await onDeleteUser(deletingUser.id);
      displayNotification('Pengguna berhasil dihapus.', 'info');
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      displayNotification(error.message || 'Gagal menghapus pengguna.', 'error');
    } finally {
      setIsSubmitting(false);
      setIsDeleteConfirmOpen(false);
      setDeletingUser(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDeletingUser(null);
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            displayNotification('Pratinjau foto berhasil dimuat.', 'info', 2000);
        };
        reader.readAsDataURL(file);
    } else if (file) {
        displayNotification('Harap pilih file gambar (JPG, PNG).', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target?.result as string;
            if (!text) throw new Error("File CSV kosong.");

            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) throw new Error("CSV harus memiliki header dan setidaknya satu baris data.");

            const header = lines[0].split(',').map(h => h.trim());
            const rows = lines.slice(1);
            
            const roleMap: Record<ActiveTab, UserRole> = { 'Siswa': UserRole.STUDENT, 'Guru': UserRole.TEACHER, 'Orang Tua': UserRole.PARENT, 'Admin': UserRole.ADMIN };
            
            const newUsersData = rows.map(line => {
                const values = line.split(',');
                const userObject: any = { role: roleMap[activeTab] };
                header.forEach((key, index) => {
                    userObject[key] = values[index]?.trim() || '';
                });
                const newId = userObject.id || `${userObject.role.toLowerCase().replace(/\s/g, '')}-${Date.now()}-${Math.random()}`;
                userObject.id = newId;
                userObject.avatar = userObject.avatar || `https://i.pravatar.cc/150?u=${newId}`;
                userObject.password = userObject.password || Math.random().toString(36).substring(2, 10);
                return userObject as User;
            });
            
            let successCount = 0;
            for (const newUser of newUsersData) {
                try {
                    await onAddUser(newUser);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to import user ${newUser.name}:`, err);
                }
            }

            if (successCount > 0) displayNotification(`${successCount} dari ${newUsersData.length} pengguna berhasil diimpor!`, 'success');
            if (successCount < newUsersData.length) displayNotification(`Gagal mengimpor ${newUsersData.length - successCount} pengguna.`, 'error');

        } catch (error: any) {
            displayNotification(error.message || 'Gagal mengimpor file CSV.', 'error');
        } finally {
            if (event.target) event.target.value = '';
        }
    };
    reader.onerror = () => {
        displayNotification('Gagal membaca file.', 'error');
        if (event.target) event.target.value = '';
    };
    reader.readAsText(file);
  };
  
  const handleBackupData = () => {
    const backupData = { users, journals };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `backup_jurnal_siswa_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    link.remove();
    displayNotification('Backup semua data telah dimulai.', 'info');
  };

  const handleDownload = (format: 'csv' | 'pdf') => {
    let data: User[], headers: string[], columns: string[], title: string;

    switch (activeTab) {
      case 'Siswa': data = students; columns = ['name', 'email', 'nisn', 'class']; headers = ['Nama', 'Email', 'NISN', 'Kelas']; title = "Data Siswa"; break;
      case 'Guru': data = teachers; columns = ['name', 'email', 'nip', 'subject']; headers = ['Nama', 'Email', 'NIP', 'Mapel']; title = "Data Guru"; break;
      case 'Orang Tua': data = parents; columns = ['name', 'email', 'nik', 'childId']; headers = ['Nama', 'Email', 'NIK', 'ID Anak']; title = "Data Orang Tua"; break;
      case 'Admin': data = admins; columns = ['name', 'email', 'nip']; headers = ['Nama', 'Email', 'NIP']; title = "Data Admin"; break;
      default: return;
    }

    if (data.length === 0) {
      displayNotification(`Tidak ada data ${activeTab} untuk diunduh.`, 'info');
      return;
    }

    if (format === 'csv') {
      const csvRows = [headers.join(','), ...data.map(row => columns.map(col => `"${(row as any)[col]}"`).join(','))];
      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${title.replace(/\s/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return displayNotification('Gagal membuka jendela baru. Mohon izinkan pop-up.', 'error');
      const tableHtml = `
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <thead><tr>${headers.map(h => `<th style="padding: 8px;">${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${data.map(row => `<tr>${columns.map(col => `<td style="padding: 8px;">${(row as any)[col] || ''}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      `;
      printWindow.document.write(`<html><head><title>${title}</title></head><body><h1>${title}</h1>${tableHtml}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }
  };

  const handleAttendanceSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAttendanceSettingsChange(localAttendanceSettings);
    displayNotification('Pengaturan absensi berhasil disimpan!', 'success');
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const { original, current } = editingCategory;
    if (!current.trim()) {
      displayNotification('Nama kategori tidak boleh kosong.', 'error');
      return;
    }
    if (journalCategories.includes(current.trim()) && current.trim() !== original) {
      displayNotification('Nama kategori sudah ada.', 'error');
      return;
    }
    
    if (original) { // Editing existing
      onJournalCategoriesChange(journalCategories.map(cat => cat === original ? current.trim() : cat));
      displayNotification('Kategori berhasil diperbarui.', 'success');
    } else { // Adding new
      onJournalCategoriesChange([...journalCategories, current.trim()]);
      displayNotification('Kategori baru berhasil ditambahkan.', 'success');
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };
  
  const handleEditCategory = (category: string) => {
    setEditingCategory({ original: category, current: category });
    setIsCategoryModalOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory({ original: '', current: '' });
    setIsCategoryModalOpen(true);
  };
  
  const handleDeleteCategory = (category: string) => {
    setDeletingCategory(category);
    setIsCategoryDeleteConfirmOpen(true);
  };

  const confirmDeleteCategory = () => {
    if (deletingCategory) {
      onJournalCategoriesChange(journalCategories.filter(cat => cat !== deletingCategory));
      displayNotification('Kategori berhasil dihapus.', 'info');
    }
    setIsCategoryDeleteConfirmOpen(false);
    setDeletingCategory(null);
  };
  
  const handleResetData = async () => {
    setIsSubmitting(true);
    try {
        onResetData();
        displayNotification('Data aplikasi berhasil direset! Halaman akan dimuat ulang.', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
        displayNotification(error.message || "Gagal mereset data.", 'error');
        setIsSubmitting(false);
    }
  };

  const activityData = useMemo(() => {
    const activitiesByDay: { [key: string]: number } = {};
    journals.forEach(entry => {
      const day = new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'short' });
      activitiesByDay[day] = (activitiesByDay[day] || 0) + 1;
    });
    const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return weekDays.map(day => ({ name: day, Jurnal: activitiesByDay[day] || 0 }));
  }, [journals]);

  const renderUserTable = () => {
    let data: User[] = [];
    let columns: { key: string, label: string }[] = [];

    switch (activeTab) {
      case 'Siswa':
        data = students;
        columns = [{ key: 'name', label: 'Nama' }, { key: 'email', label: 'Email' }, { key: 'nisn', label: 'NISN' }, { key: 'class', label: 'Kelas' }];
        break;
      case 'Guru':
        data = teachers;
        columns = [{ key: 'name', label: 'Nama' }, { key: 'email', label: 'Email' }, { key: 'nip', label: 'NIP' }, { key: 'subject', label: 'Mapel' }];
        break;
      case 'Orang Tua':
        data = parents;
        columns = [{ key: 'name', label: 'Nama' }, { key: 'email', label: 'Email' }, { key: 'nik', label: 'NIK' }, { key: 'childId', label: 'ID Anak' }];
        break;
      case 'Admin':
        data = admins;
        columns = [{ key: 'name', label: 'Nama' }, { key: 'email', label: 'Email' }, { key: 'nip', label: 'NIP' }];
        break;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              {columns.map(col => <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>)}
              <th scope="col" className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map(item => (
              <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                {columns.map(col => <td key={col.key} className="px-6 py-4">{(item as any)[col.key]}</td>)}
                <td className="px-6 py-4 flex space-x-2">
                  <button onClick={() => handleEditClick(item)} className="text-blue-500 hover:text-blue-700"><i className="fas fa-edit"></i></button>
                  <button onClick={() => handleDeleteClick(item)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={columns.length + 2} className="text-center py-10 text-gray-500 dark:text-gray-400">
                        Tidak ada data {activeTab}.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
       {notification && (
        <div className={`fixed top-20 right-6 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50 flex items-center
            ${notification.type === 'success' && 'bg-green-500'}
            ${notification.type === 'info' && 'bg-blue-500'}
            ${notification.type === 'error' && 'bg-red-500'}
        `}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} mr-3`}></i>
          <span>{notification.message}</span>
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-6 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
              {!editingUser && (
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="mt-2 w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              )}
            </div>
            <form id="user-form" onSubmit={handleUserSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center space-x-4">
                  <img src={formData.avatar || `https://i.pravatar.cc/150`} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" />
                  <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foto Profil</p>
                      <button type="button" onClick={handleAvatarClick} className="w-full text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 font-medium rounded-lg px-4 py-2">
                          <i className="fas fa-upload mr-2"></i>Ganti Foto
                      </button>
                      <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gunakan foto asli untuk identifikasi yang lebih baik.</p>
                  </div>
              </div>
              
              <input type="text" name="name" placeholder="Nama Lengkap" value={formData.name} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sandi</label>
                <div className="flex gap-2">
                    <input type="text" name="password" placeholder={editingUser ? "Kosongkan jika tidak berubah" : "Kosongkan untuk auto-generate"} value={formData.password} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" />
                    <button type="button" onClick={generateRandomPassword} className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        <i className="fas fa-sync-alt"></i>
                    </button>
                </div>
              </div>
              
              {newUserRole === UserRole.STUDENT && (<>
                <input type="text" name="nisn" placeholder="NISN" value={formData.nisn} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />
                <input type="text" name="class" placeholder="Kelas" value={formData.class} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />
              </>)}
              {(newUserRole === UserRole.TEACHER || newUserRole === UserRole.ADMIN) && (<>
                <input type="text" name="nip" placeholder="NIP" value={formData.nip} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />
                 {newUserRole === UserRole.TEACHER && <input type="text" name="subject" placeholder="Mata Pelajaran" value={formData.subject} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />}
              </>)}
              {newUserRole === UserRole.PARENT && (<>
                 <input type="text" name="nik" placeholder="NIK" value={formData.nik} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required />
                <select name="childId" value={formData.childId} onChange={handleInputChange} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" required>
                  <option value="">-- Pilih Anak --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.nisn})</option>)}
                </select>
              </>)}
            </form>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 flex justify-end space-x-3">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Batal</button>
              <button type="submit" form="user-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-wait">{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white"><i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>Konfirmasi Penghapusan</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Anda yakin ingin menghapus <strong>{deletingUser?.name}</strong>? Tindakan ini tidak dapat diurungkan.</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={cancelDelete} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Batal</button>
                    <button onClick={confirmDelete} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait">{isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}</button>
                </div>
            </div>
        </div>
      )}
      
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white"><i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>Konfirmasi Reset Data</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Apakah Anda benar-benar yakin? Tindakan ini akan **menghapus semua data pengguna dan jurnal** di database dan mengembalikannya ke kondisi awal.
                    <br/><br/>
                    Tindakan ini tidak dapat diurungkan.
                </p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => setIsResetModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Batal</button>
                    <button onClick={handleResetData} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-wait">{isSubmitting ? 'Mereset...' : 'Ya, Reset Data'}</button>
                </div>
            </div>
        </div>
       )}
      
      <DashboardHeader user={user} />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><h5 className="text-gray-500 dark:text-gray-400">Total Siswa</h5><p className="text-3xl font-bold">{students.length}</p></Card>
        <Card><h5 className="text-gray-500 dark:text-gray-400">Total Guru</h5><p className="text-3xl font-bold">{teachers.length}</p></Card>
        <Card><h5 className="text-gray-500 dark:text-gray-400">Total Orang Tua</h5><p className="text-3xl font-bold">{parents.length}</p></Card>
        <Card><h5 className="text-gray-500 dark:text-gray-400">Total Admin</h5><p className="text-3xl font-bold">{admins.length}</p></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <h3 className="text-xl font-semibold mb-4"><i className="fas fa-cogs mr-2 text-primary-500"></i>Pengaturan Aplikasi</h3>
                <div className="space-y-4">
                    <form onSubmit={handleAttendanceSettingsSubmit}>
                        <h4 className="font-semibold text-md mb-2">Jam Absensi</h4>
                        <div className="flex items-center space-x-2">
                            <input type="time" value={localAttendanceSettings.startTime} onChange={e => setLocalAttendanceSettings(p => ({...p, startTime: e.target.value}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" />
                            <span>-</span>
                            <input type="time" value={localAttendanceSettings.endTime} onChange={e => setLocalAttendanceSettings(p => ({...p, endTime: e.target.value}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" />
                        </div>
                        <button type="submit" className="w-full mt-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-sm px-5 py-2">Simpan Jam</button>
                    </form>
                    <div>
                      <h4 className="font-semibold text-md mb-2">Kategori Jurnal</h4>
                      <div className="space-y-2">
                        {journalCategories.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                <span>{cat}</span>
                                <div className="space-x-2">
                                    <button onClick={() => handleEditCategory(cat)} className="text-blue-500"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => handleDeleteCategory(cat)} className="text-red-500"><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))}
                      </div>
                      <button onClick={handleAddCategory} className="w-full mt-2 text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2"><i className="fas fa-plus mr-2"></i>Tambah Kategori</button>
                    </div>
                </div>
            </Card>
             <Card>
                <h3 className="text-xl font-semibold mb-4"><i className="fas fa-database mr-2 text-primary-500"></i>Manajemen Data</h3>
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gunakan tombol ini untuk mengatur ulang semua data (pengguna dan jurnal) ke kondisi awal.
                    <strong className="text-yellow-600 dark:text-yellow-400 block mt-1">Hati-hati, tindakan ini akan menghapus semua entri yang ada di database.</strong>
                    </p>
                    <button onClick={() => setIsResetModalOpen(true)} className="w-full text-white bg-yellow-500 hover:bg-yellow-600 font-medium rounded-lg text-sm px-5 py-2.5">
                    <i className="fas fa-sync-alt mr-2"></i>Reset Data Aplikasi
                    </button>
                </div>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <h3 className="text-xl font-semibold mb-4">Aktivitas Jurnal Mingguan</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={activityData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Jurnal" fill="#3b82f6" /></BarChart>
                </ResponsiveContainer>
            </Card>
        </div>
      </div>

      <Card>
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {(['Siswa', 'Guru', 'Orang Tua', 'Admin'] as ActiveTab[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`${activeTab === tab ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Manajemen Pengguna: {activeTab}</h3>
            <div className="flex items-center space-x-2">
                <button onClick={() => setIsModalOpen(true)} className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"><i className="fas fa-plus mr-1"></i>Tambah</button>
                <button onClick={handleImportClick} className="px-3 py-1.5 text-xs font-medium text-green-800 bg-green-200 rounded-md hover:bg-green-300 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"><i className="fas fa-file-csv mr-1"></i>Import</button>
                <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                <button onClick={() => handleDownload('csv')} className="px-3 py-1.5 text-xs font-medium text-green-800 bg-green-200 rounded-md hover:bg-green-300 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"><i className="fas fa-file-excel mr-1"></i>Unduh CSV</button>
                <button onClick={() => handleDownload('pdf')} className="px-3 py-1.5 text-xs font-medium text-red-800 bg-red-200 rounded-md hover:bg-red-300 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"><i className="fas fa-file-pdf mr-1"></i>Unduh PDF</button>
                <button onClick={handleBackupData} className="px-3 py-1.5 text-xs font-medium text-yellow-800 bg-yellow-200 rounded-md hover:bg-yellow-300 dark:bg-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-600"><i className="fas fa-save mr-1"></i>Backup Data</button>
            </div>
          </div>
          {renderUserTable()}
      </Card>
       {/* Category Edit/Add Modal */}
       {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold">{editingCategory?.original ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <form onSubmit={handleCategorySubmit} className="mt-4">
                    <input type="text" value={editingCategory?.current || ''} onChange={e => setEditingCategory(p => p ? { ...p, current: e.target.value } : null)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" placeholder="Nama Kategori" required />
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Batal</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700">Simpan</button>
                    </div>
                </form>
              </div>
          </div>
       )}
       {/* Category Delete Confirmation */}
       {isCategoryDeleteConfirmOpen && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                   <h3 className="text-lg font-bold"><i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>Konfirmasi</h3>
                   <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Anda yakin ingin menghapus kategori <strong>"{deletingCategory}"</strong>?</p>
                   <div className="mt-6 flex justify-end space-x-3">
                       <button onClick={() => setIsCategoryDeleteConfirmOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Batal</button>
                       <button onClick={confirmDeleteCategory} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Ya, Hapus</button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminDashboard;
