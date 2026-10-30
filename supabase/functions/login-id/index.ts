import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { userId, password } = await request.json();
    const normalizedId = String(userId || '').trim().toUpperCase();
    if (!/^[A-Z0-9._-]{3,32}$/.test(normalizedId) || String(password || '').length < 8) {
      return json({ error: 'ID Pengguna atau kata sandi tidak valid.' }, 400);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: profile } = await admin.from('profiles').select('id, active').eq('user_id', normalizedId).maybeSingle();
    if (!profile || !profile.active) return json({ error: 'ID Pengguna atau kata sandi salah.' }, 401);

    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !authUser.user?.email) return json({ error: 'Akun belum siap. Hubungi admin.' }, 401);
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error } = await client.auth.signInWithPassword({ email: authUser.user.email, password });
    if (error || !data.session) return json({ error: 'ID Pengguna atau kata sandi salah.' }, 401);
    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch {
    return json({ error: 'Layanan login sedang bermasalah.' }, 500);
  }
});
