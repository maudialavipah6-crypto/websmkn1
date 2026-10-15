export const demoUsers = [];
export const schoolUserAccounts = [];

export function findDemoUser() {
  return null;
}

export function findSchoolUser() {
  return null;
}

export function restoreDemoUser() {
  return null;
}

export function persistDemoUser() {
  throw new Error('Akun sekolah lokal hanya tersedia pada mode pengembangan.');
}

export function clearDemoUser() {
  throw new Error('Akun sekolah lokal hanya tersedia pada mode pengembangan.');
}
