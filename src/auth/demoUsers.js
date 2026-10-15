export const demoUsers = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    email: import.meta.env.VITE_DEMO_TEACHER_EMAIL || '',
    password: import.meta.env.VITE_DEMO_TEACHER_PASSWORD || '',
    display_name: 'Guru Demo TKJ',
    role: 'teacher',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    email: import.meta.env.VITE_DEMO_STUDENT_EMAIL || '',
    password: import.meta.env.VITE_DEMO_STUDENT_PASSWORD || '',
    display_name: 'Siswa Demo TKJ',
    role: 'student',
  },
].filter((user) => user.email && user.password);

const demoSessionKey = 'tkj-portal-demo-user';

export function findDemoUser(email, password) {
  return demoUsers.find(
    (user) => user.email === email.trim().toLowerCase() && user.password === password,
  ) || null;
}

export function restoreDemoUser() {
  if (!import.meta.env.DEV) return null;

  try {
    const storedId = window.sessionStorage.getItem(demoSessionKey);
    return demoUsers.find((user) => user.id === storedId) || null;
  } catch {
    return null;
  }
}

export function persistDemoUser(user) {
  if (!import.meta.env.DEV) {
    throw new Error('Akun demo hanya tersedia di server pengembangan.');
  }

  try {
    window.sessionStorage.setItem(demoSessionKey, user.id);
  } catch {
    throw new Error('Sesi demo tidak dapat disimpan di browser ini.');
  }
}

export function clearDemoUser() {
  try {
    window.sessionStorage.removeItem(demoSessionKey);
  } catch {
    throw new Error('Sesi demo tidak dapat dihapus dari browser ini.');
  }
}
