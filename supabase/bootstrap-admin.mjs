import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di terminal.');
const client = createClient(url, key, { auth: { persistSession: false } });
const userId = 'ADMIN001';
const password = `Adm!${randomBytes(9).toString('base64url')}`;
const email = `${userId.toLowerCase()}@login.smkn1garut.internal`;

const { data: existing } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
let user = existing.users.find((item) => item.email === email);
if (!user) {
  const result = await client.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: 'Admin Sekolah' } });
  if (result.error) throw result.error;
  user = result.data.user;
} else {
  const result = await client.auth.admin.updateUserById(user.id, { password });
  if (result.error) throw result.error;
}
const { error } = await client.from('profiles').upsert({ id: user.id, user_id: userId, display_name: 'Admin Sekolah', role: 'admin', active: true });
if (error) throw error;
console.log('ID Pengguna:', userId);
console.log('Password sementara:', password);
console.log('Simpan kredensial ini. Password tidak dapat dilihat kembali.');
