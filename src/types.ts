export enum UserRole {
  STUDENT = 'Siswa',
  TEACHER = 'Guru',
  PARENT = 'Orang Tua',
  ADMIN = 'Admin',
}

export enum Mood {
  HAPPY = 'Senang',
  GRATEFUL = 'Bersyukur',
  NEUTRAL = 'Biasa Saja',
  SAD = 'Sedih',
  ANGRY = 'Marah',
  EXCITED = 'Semangat',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  password: string; 
}

export interface Student extends User {
  nisn: string;
  class: string;
  teacherId: string;
  parentId:string;
}

export interface Teacher extends User {
  nip: string;
  class: string;
  subject: string;
}

export interface Parent extends User {
  nik: string;
  childId: string;
}

export interface Admin extends User {
  nip: string;
}

export interface JournalEntry {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  submissionTime: string; // HH:mm:ss
  category: string;
  activity: string;
  attendance: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  behaviorNote: string;
  mood: Mood;
  reflection: string;
  teacherComment?: string;
  status: 'Pending' | 'Approved' | 'Revision Needed';
}
