import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Router,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';

function LoginPage() {
  const {
    configured,
    demoModeAvailable,
    demoMode,
    supabase,
    session,
    profile,
    profileError,
    refreshProfile,
    signInDemo,
  } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage('');

    try {
      if (demoModeAvailable) {
        await signInDemo(userId, password);
        window.location.hash = '#/dashboard';
        return;
      }

      if (!configured || !supabase) {
        throw new Error('Layanan login belum terhubung. Hubungi admin sekolah.');
      }

      const normalizedId = userId.trim().toUpperCase();
      const { data, error } = await supabase.functions.invoke('login-id', {
        body: { userId: normalizedId, password },
      });
      if (error) throw new Error(data?.error || 'ID Pengguna atau kata sandi salah.');
      if (data?.error) throw new Error(data.error);
      if (!data?.access_token || !data?.refresh_token) {
        throw new Error('Sesi login tidak dapat dibuat. Hubungi admin sekolah.');
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) throw sessionError;
      if (sessionData.user) await refreshProfile(sessionData.user.id);
      window.location.hash = '#/dashboard';
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login gagal. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = profile?.role === 'admin' ? 'admin' : profile?.role === 'teacher' ? 'guru' : 'siswa';

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <a className="auth-back-link" href="#beranda"><ArrowLeft size={16} /> Kembali ke situs TKJ</a>
        <div className="auth-brand-content">
          <img className="auth-logo" src="/LOGO_SMKN1_GARUT.jpeg" alt="Logo SMKN 1 Garut" />
          <p className="auth-school-name">SMKN 1 Garut</p>
          <h1>Ruang belajar Teknik Komputer dan Jaringan.</h1>
          <p className="auth-brand-description">
            Satu ruang untuk materi, latihan, dan aktivitas kelas TKJ—terhubung untuk guru dan siswa.
          </p>
          <div className="auth-connection-art" aria-hidden="true">
            <div className="auth-art-line art-line-one" />
            <div className="auth-art-line art-line-two" />
            <div className="auth-art-node art-node-router"><Router size={21} /></div>
            <div className="auth-art-node art-node-book"><BookOpen size={18} /></div>
            <div className="auth-art-node art-node-lock"><LockKeyhole size={17} /></div>
            <span className="auth-art-caption">TKJ / LEARNING NETWORK</span>
          </div>
        </div>
        <p className="auth-panel-footer"><ShieldCheck size={15} /> Akses sesuai peran akun Anda</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <a className="auth-mobile-back" href="#beranda"><ArrowLeft size={15} /> Situs TKJ</a>
          {session && profile && !demoMode && (
            <div className="auth-session-notice" role="status">
              Anda sudah masuk sebagai {roleLabel}.
              <a href="#/dashboard">Buka dashboard <ArrowRight size={14} /></a>
            </div>
          )}
          {session && profileError && <div className="form-alert is-error" role="alert">{profileError}</div>}
          {demoMode && (
            <div className="form-alert is-info" role="status">
              Anda sedang memakai mode pratinjau lokal.
              <a href="#/dashboard">Buka dashboard <ArrowRight size={14} /></a>
            </div>
          )}

          <h2>Masuk ke ruang TKJ</h2>
          <p className="auth-form-intro">
            Gunakan ID Pengguna dan kata sandi yang diberikan oleh admin sekolah.
          </p>

          {!configured && !demoModeAvailable && (
            <div className="form-alert is-warning" role="status">
              Supabase belum terhubung. Hubungi pengelola situs.
            </div>
          )}
          {errorMessage && <div className="form-alert is-error" role="alert">{errorMessage}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              ID Pengguna
              <span className="auth-input-wrap">
                <UserRound size={17} aria-hidden="true" />
                <input
                  autoCapitalize="characters"
                  autoComplete="username"
                  maxLength={32}
                  name="user-id"
                  pattern="[A-Za-z0-9._-]{3,32}"
                  placeholder="Contoh: SISWA001"
                  required
                  type="text"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value.toUpperCase())}
                />
              </span>
            </label>

            <label>
              Kata sandi
              <span className="auth-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  autoComplete={demoModeAvailable ? 'off' : 'current-password'}
                  minLength={8}
                  name="password"
                  placeholder="Minimal 8 karakter"
                  required
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="password-visibility"
                  type="button"
                  aria-label={passwordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <button className="auth-submit button button-navy" type="submit" disabled={busy || (!configured && !demoModeAvailable)}>
              {busy ? 'Memproses…' : 'Masuk ke dashboard'}
              {!busy && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="teacher-account-note">
            Lupa kata sandi? Minta admin sekolah mengatur kata sandi baru dari dashboard admin.
          </p>
          <p className="auth-footnote">Akses materi, kuis, presensi, dan pengelolaan akun mengikuti peran pengguna.</p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
