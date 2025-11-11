import { User, Student, Teacher, Parent, UserRole, JournalEntry, Mood, Admin } from './types';

// USERS

// == AKUN DEMO ==
// Peran    | ID (NISN/NIP/NIK) | Sandi
// -------------------------------------
// Siswa    | demo              | demo
// Guru     | demo              | demo
// Orang Tua| demo              | demo
// Admin    | demo              | demo
// =====================================
export const STUDENTS: Student[] = [
  { id: 'student-demo', name: 'Siswa Demo', nisn: 'demo', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=studentdemo', email: 'demo@sekolah.id', password: 'demo', class: 'Kelas Demo', teacherId: 'teacher-demo', parentId: 'parent-demo' },
  { id: 'student-1', name: 'Budi Santoso', nisn: '001', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=student1', email: 'budi@sekolah.id', password: 'password123', class: 'Kelas 5A', teacherId: 'teacher-1', parentId: 'parent-1' },
  { id: 'student-2', name: 'Citra Lestari', nisn: '002', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=student2', email: 'citra@sekolah.id', password: 'password123', class: 'Kelas 5A', teacherId: 'teacher-1', parentId: 'parent-2' },
  { id: 'student-3', name: 'Andi Pratama', nisn: '003', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=student3', email: 'andi@sekolah.id', password: 'password123', class: 'Kelas 5A', teacherId: 'teacher-1', parentId: 'parent-3' },
  { id: 'student-4', name: 'Eka Yuliana', nisn: '004', role: UserRole.STUDENT, avatar: 'https://i.pravatar.cc/150?u=student4', email: 'eka@sekolah.id', password: 'password123', class: 'Kelas 5A', teacherId: 'teacher-1', parentId: 'parent-4' },
];

export const TEACHERS: Teacher[] = [
  { id: 'teacher-demo', name: 'Guru Demo', nip: 'demo', role: UserRole.TEACHER, avatar: 'https://i.pravatar.cc/150?u=teacherdemo', email: 'demoguru@sekolah.id', password: 'demo', class: 'Kelas Demo', subject: 'Guru Kelas' },
  { id: 'teacher-1', name: 'Ibu Guru Anisa', nip: '198501012010012001', role: UserRole.TEACHER, avatar: 'https://i.pravatar.cc/150?u=teacher1', email: 'anisa@sekolah.id', password: 'password123', class: 'Kelas 5A', subject: 'Guru Kelas' },
  { id: 'teacher-2', name: 'Bapak Guru Budi', nip: '198602022011021002', role: UserRole.TEACHER, avatar: 'https://i.pravatar.cc/150?u=teacher2', email: 'gurubudi@sekolah.id', password: 'password123', class: 'Kelas 5B', subject: 'Matematika' },
];

export const PARENTS: Parent[] = [
  { id: 'parent-demo', name: 'Orang Tua Demo', role: UserRole.PARENT, avatar: 'https://i.pravatar.cc/150?u=parentdemo', email: 'demoortu@email.com', password: 'demo', nik: 'demo', childId: 'student-demo' },
  { id: 'parent-1', name: 'Ayah Budi', role: UserRole.PARENT, avatar: 'https://i.pravatar.cc/150?u=parent1', email: 'ayahbudi@email.com', password: 'password123', nik: '3301011010800001', childId: 'student-1' },
  { id: 'parent-2', name: 'Ibu Citra', role: UserRole.PARENT, avatar: 'https://i.pravatar.cc/150?u=parent2', email: 'ibucitra@email.com', password: 'password123', nik: '3301015010820002', childId: 'student-2' },
  { id: 'parent-3', name: 'Bapak Andi', role: UserRole.PARENT, avatar: 'https://i.pravatar.cc/150?u=parent3', email: 'bapakandi@email.com', password: 'password123', nik: '3301011010850003', childId: 'student-3' },
  { id: 'parent-4', name: 'Ibu Eka', role: UserRole.PARENT, avatar: 'https://i.pravatar.cc/150?u=parent4', email: 'ibueka@email.com', password: 'password123', nik: '3301015010900004', childId: 'student-4' },
];

export const ADMINS: Admin[] = [
  { id: 'admin-demo', name: 'Admin Demo', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admindemo', email: 'demoadmin@sekolah.id', password: 'demo', nip: 'demo' },
  { id: 'admin-1', name: 'Admin Sekolah', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin1', email: 'admin@sekolah.id', password: 'password123', nip: 'ADMIN001' },
  { id: 'admin-2', name: 'Kepala Sekolah', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin2', email: 'kepsek@sekolah.id', password: 'password123', nip: 'ADMIN002' },
];

export const USERS: User[] = [...STUDENTS, ...TEACHERS, ...PARENTS, ...ADMINS];

// INITIAL DYNAMIC DATA
export const INITIAL_JOURNAL_CATEGORIES: string[] = [
  'Kegiatan Pembelajaran',
  'Kegiatan Ekstrakurikuler',
  'Kegiatan Organisasi',
  'Kegiatan Ibadah',
  'Kegiatan Literasi',
];

export const INITIAL_JOURNAL_ENTRIES: Omit<JournalEntry, 'id'>[] = [
  {
    studentId: 'student-1',
    date: '2024-07-28',
    submissionTime: '08:15:30',
    category: 'Kegiatan Pembelajaran',
    activity: 'Belajar Matematika tentang pecahan.',
    attendance: 'Hadir',
    behaviorNote: '',
    mood: Mood.NEUTRAL,
    reflection: 'Agak sulit memahami, tapi aku akan terus mencoba.',
    teacherComment: 'Bagus Budi, jangan menyerah! Coba kerjakan latihan tambahan ya.',
    status: 'Approved',
  },
  {
    studentId: 'student-1',
    date: '2024-07-29',
    submissionTime: '09:00:12',
    category: 'Kegiatan Ekstrakurikuler',
    activity: 'Latihan sepak bola bersama teman-teman.',
    attendance: 'Hadir',
    behaviorNote: '',
    mood: Mood.EXCITED,
    reflection: 'Sangat menyenangkan bisa mencetak gol hari ini!',
    status: 'Pending',
  },
  {
    studentId: 'student-2',
    date: '2024-07-29',
    submissionTime: '08:30:00',
    category: 'Kegiatan Pembelajaran',
    activity: 'Membaca buku cerita di perpustakaan.',
    attendance: 'Hadir',
    behaviorNote: '',
    mood: Mood.HAPPY,
    reflection: 'Buku ceritanya sangat menarik dan menginspirasi.',
    teacherComment: 'Wah, bagus sekali Citra! Terus tingkatkan minat membacamu ya.',
    status: 'Approved',
  }
];