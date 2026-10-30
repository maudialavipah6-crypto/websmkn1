import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleAlert, KeyRound, Pencil, Plus, RefreshCw, Trash2, UserRound, X } from 'lucide-react';

const emptyForm = {
  id: '',
  userId: '',
  displayName: '',
  role: 'student',
  active: true,
  password: '',
};

const roleLabels = {
  admin: 'Admin',
  teacher: 'Guru',
  student: 'Siswa',
};

function errorMessage(error, fallback = 'Permintaan gagal. Silakan coba kembali.') {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminAccounts({ supabase, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const editing = Boolean(form.id);
  const counts = useMemo(() => ({
    all: users.length,
    student: users.filter((user) => user.role === 'student').length,
    teacher: users.filter((user) => user.role === 'teacher').length,
    admin: users.filter((user) => user.role === 'admin').length,
  }), [users]);

  const invoke = useCallback(async (body) => {
    const { data, error: functionError } = await supabase.functions.invoke('admin-users', { body });
    if (functionError) throw new Error(data?.error || 'Layanan admin tidak dapat dihubungi.');
    if (data?.error) throw new Error(data.error);
    return data;
  }, [supabase]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await invoke({ action: 'list' });
      setUsers(data.users || []);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function beginEdit(user) {
    setForm({
      id: user.id,
      userId: user.user_id || '',
      displayName: user.display_name || '',
      role: user.role,
      active: user.active,
      password: '',
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(emptyForm);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy('save');
    setError('');
    setSuccess('');
    try {
      if (editing) {
        await invoke({
          action: 'update',
          id: form.id,
          userId: form.userId,
          displayName: form.displayName,
          role: form.role,
          active: form.active,
        });
        if (form.password) {
          await invoke({ action: 'password', id: form.id, password: form.password });
        }
        setSuccess(form.password ? 'Data akun dan kata sandi berhasil diperbarui.' : 'Data akun berhasil diperbarui.');
      } else {
        await invoke({
          action: 'create',
          userId: form.userId,
          displayName: form.displayName,
          role: form.role,
          password: form.password,
        });
        setSuccess('Akun baru berhasil dibuat. Catat ID dan kata sandinya sebelum meninggalkan halaman.');
      }
      setForm(emptyForm);
      await loadUsers();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Hapus akun ${user.user_id} (${user.display_name}) secara permanen?`)) return;
    setBusy(`delete-${user.id}`);
    setError('');
    setSuccess('');
    try {
      await invoke({ action: 'delete', id: user.id });
      setSuccess(`Akun ${user.user_id} berhasil dihapus.`);
      if (form.id === user.id) setForm(emptyForm);
      await loadUsers();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="admin-accounts">
      <div className="admin-account-stats" aria-label="Ringkasan akun">
        <span><strong>{counts.all}</strong> Total akun</span>
        <span><strong>{counts.student}</strong> Siswa</span>
        <span><strong>{counts.teacher}</strong> Guru</span>
        <span><strong>{counts.admin}</strong> Admin</span>
      </div>

      {error && <div className="dashboard-notice is-error" role="alert"><CircleAlert size={18} /><span>{error}</span></div>}
      {success && <div className="dashboard-notice is-success" role="status"><span>{success}</span></div>}

      <section className="dashboard-panel admin-account-form-panel">
        <div className="panel-heading-row">
          <div>
            <p className="dashboard-overline">AKSES PORTAL</p>
            <h2>{editing ? `Edit ${form.userId}` : 'Buat akun baru'}</h2>
          </div>
          {editing && <button className="panel-action" type="button" onClick={resetForm}><X size={15} /> Batal edit</button>}
        </div>

        <form className="admin-account-form" onSubmit={submit}>
          <label>
            ID Pengguna
            <input
              autoCapitalize="characters"
              maxLength={32}
              pattern="[A-Za-z0-9._-]{3,32}"
              placeholder="Contoh: SISWA001"
              required
              value={form.userId}
              onChange={(event) => updateField('userId', event.target.value.toUpperCase())}
            />
          </label>
          <label>
            Nama lengkap
            <input maxLength={80} placeholder="Nama pengguna" required value={form.displayName} onChange={(event) => updateField('displayName', event.target.value)} />
          </label>
          <label>
            Peran
            <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
              <option value="student">Siswa</option>
              <option value="teacher">Guru</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label>
            {editing ? 'Kata sandi baru (opsional)' : 'Kata sandi awal'}
            <input
              autoComplete="new-password"
              minLength={8}
              placeholder={editing ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
              required={!editing}
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
          </label>
          {editing && (
            <label className="admin-active-toggle">
              <input checked={form.active} type="checkbox" onChange={(event) => updateField('active', event.target.checked)} />
              Akun aktif dan boleh masuk
            </label>
          )}
          <button className="button button-navy admin-save-button" disabled={busy === 'save'} type="submit">
            {editing ? <KeyRound size={17} /> : <Plus size={17} />}
            {busy === 'save' ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Buat akun'}
          </button>
        </form>
      </section>

      <section className="dashboard-panel admin-account-list-panel">
        <div className="panel-heading-row">
          <div>
            <p className="dashboard-overline">DAFTAR PENGGUNA</p>
            <h2>Akun portal TKJ</h2>
          </div>
          <button className="panel-action" disabled={loading} type="button" onClick={() => void loadUsers()}>
            <RefreshCw className={loading ? 'is-spinning' : ''} size={15} /> Muat ulang
          </button>
        </div>

        {loading ? (
          <p className="admin-account-empty">Memuat akun…</p>
        ) : users.length === 0 ? (
          <p className="admin-account-empty">Belum ada akun yang dapat ditampilkan.</p>
        ) : (
          <div className="admin-account-list">
            {users.map((user) => (
              <article className={`admin-account-row${user.active ? '' : ' is-inactive'}`} key={user.id}>
                <span className="admin-account-avatar"><UserRound size={18} /></span>
                <span className="admin-account-identity">
                  <strong>{user.display_name}</strong>
                  <small>{user.user_id}</small>
                </span>
                <span className={`admin-role-badge is-${user.role}`}>{roleLabels[user.role]}</span>
                <span className={`admin-status-badge${user.active ? ' is-active' : ''}`}>{user.active ? 'Aktif' : 'Nonaktif'}</span>
                <span className="admin-account-actions">
                  <button aria-label={`Edit ${user.display_name}`} type="button" onClick={() => beginEdit(user)}><Pencil size={16} /></button>
                  <button
                    aria-label={`Hapus ${user.display_name}`}
                    className="is-danger"
                    disabled={user.id === currentUserId || busy === `delete-${user.id}`}
                    title={user.id === currentUserId ? 'Akun yang sedang dipakai tidak dapat dihapus' : 'Hapus akun'}
                    type="button"
                    onClick={() => void removeUser(user)}
                  ><Trash2 size={16} /></button>
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
