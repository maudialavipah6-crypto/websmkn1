import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const validId = (value: unknown) => /^[A-Z0-9._-]{3,32}$/.test(String(value || '').trim().toUpperCase());

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Metode tidak didukung.' }, 405);
  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return json({ error: 'Sesi admin tidak valid.' }, 401);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user) return json({ error: 'Sesi admin tidak valid.' }, 401);
  const { data: callerProfile } = await admin.from('profiles').select('role, active').eq('id', caller.user.id).single();
  if (callerProfile?.role !== 'admin' || !callerProfile.active) return json({ error: 'Akses hanya untuk admin.' }, 403);

  try {
    const body = request.method === 'GET' ? {} : await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Data permintaan tidak valid.' }, 400);
    const action = body.action || 'list';
    if (action === 'list') {
      const { data, error } = await admin.from('profiles').select('id, user_id, display_name, role, active, created_at').order('created_at');
      if (error) throw error;
      return json({ users: data });
    }
    const userId = String(body.userId || '').trim().toUpperCase();
    const displayName = String(body.displayName || '').trim();
    if (action === 'create') {
      if (typeof body.userId !== 'string' || typeof body.displayName !== 'string' || !validId(userId) || !displayName || displayName.length > 80 || typeof body.password !== 'string' || body.password.length < 8 || !['student', 'teacher', 'admin'].includes(body.role)) {
        return json({ error: 'Lengkapi ID, nama, role, dan password minimal 8 karakter.' }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email: `${userId.toLowerCase()}@login.smkn1garut.internal`,
        password: body.password,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      });
      if (error) throw error;
      const { error: profileError } = await admin.from('profiles').upsert({
        id: data.user.id, user_id: userId, display_name: displayName, role: body.role, active: true,
      });
      if (profileError) { await admin.auth.admin.deleteUser(data.user.id); throw profileError; }
      return json({ success: true });
    }
    if (typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) return json({ error: 'Akun tidak ditemukan.' }, 400);
    if (action === 'update') {
      if (body.id === caller.user.id && (body.role !== 'admin' || body.active !== true)) return json({ error: 'Admin tidak dapat menonaktifkan atau menurunkan perannya sendiri.' }, 400);
      if (typeof body.userId !== 'string' || typeof body.displayName !== 'string' || !validId(userId) || !displayName || displayName.length > 80 || typeof body.active !== 'boolean' || !['student', 'teacher', 'admin'].includes(body.role)) return json({ error: 'Data akun tidak valid.' }, 400);
      const { error } = await admin.from('profiles').update({ user_id: userId, display_name: displayName, role: body.role, active: Boolean(body.active) }).eq('id', body.id);
      if (error) throw error;
      return json({ success: true });
    }
    if (action === 'password') {
      if (typeof body.password !== 'string' || body.password.length < 8) return json({ error: 'Password minimal 8 karakter.' }, 400);
      const { error } = await admin.auth.admin.updateUserById(body.id, { password: body.password });
      if (error) throw error;
      return json({ success: true });
    }
    if (action === 'delete') {
      if (body.id === caller.user.id) return json({ error: 'Admin tidak dapat menghapus akunnya sendiri.' }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) throw error;
      return json({ success: true });
    }
    return json({ error: 'Aksi tidak dikenal.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Permintaan gagal.' }, 400);
  }
});
