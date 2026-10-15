import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Router,
  ShieldCheck,
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
    isPasswordRecovery,
    clearPasswordRecovery,
    refreshProfile,
    signInDemo,
  } = useAuth();
  const [mode, setMode] = useState('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);

  useEffect(() => {
    if (!demoModeAvailable) return undefined;

    let mounted = true;
    import('../auth/schoolAccounts')
      .then(({ demoUsers: accounts }) => {
        if (mounted) setDemoUsers(accounts);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Akun sekolah tidak dapat dimuat.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [demoModeAvailable]);

  const recoveryMode = isPasswordRecovery || mode === 'recovery';

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage('');
    setErrorMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setErrorMessage('');

    try {
      if (mode === 'signin' && !recoveryMode && demoModeAvailable) {
        await signInDemo(email, password);
        window.location.hash = '#/dashboard';
        return;
      }

      if (!configured || !supabase) {
        throw new Error('Pendaftaran dan autentikasi nyata memerlukan konfigurasi Supabase.');
      }

      if (recoveryMode) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          throw new Error(`Kata sandi sudah diperbarui, tetapi sesi belum dapat ditutup: ${signOutError.message}`);
        }
        clearPasswordRecovery();
        setPassword('');
        setMode('signin');
        setMessage('Kata sandi diperbarui. Silakan masuk dengan kata sandi baru.');
        return;
      }

      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Masukkan nama lengkap sebelum membuat akun siswa.');
        }
        const redirectTo = `${window.location.origin}${window.location.pathname}`;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: redirectTo,
          },
        });
        if (error) throw error;
        if (data.session) {
          window.location.hash = '#/dashboard';
          return;
        }
        setMessage('Jika alamat email dapat didaftarkan, instruksi konfirmasi akan dikirim. Periksa kotak masuk email Anda.');
        setMode('signin');
        setPassword('');
        return;
      }

      if (mode === 'reset') {
        const redirectTo = `${window.location.origin}${window.location.pathname}`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
        if (error) throw error;
        setMessage('Jika akun dengan email tersebut tersedia, instruksi pemulihan akan dikirim.');
        setMode('signin');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      if (data.user) {
        await refreshProfile(data.user.id);
        window.location.hash = '#/dashboard';
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  const formTitle = recoveryMode
    ? 'Buat kata sandi baru'
    : mode === 'signup'
      ? 'Buat akun siswa'
      : mode === 'reset'
        ? 'Pulihkan akses akun'
        : 'Masuk ke ruang TKJ';

  const passwordLabel = recoveryMode ? 'Kata sandi baru' : 'Kata sandi';

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
          {session && profile && !recoveryMode && !demoMode && (
            <div className="auth-session-notice" role="status">
              Anda masuk sebagai {profile.role === 'teacher' ? 'guru' : 'siswa'}.
              <a href="#/dashboard">Buka dashboard <ArrowRight size={14} /></a>
            </div>
          )}
          {session && profileError && !recoveryMode && (
            <div className="form-alert is-error" role="alert">{profileError}</div>
          )}
          {demoMode && !recoveryMode && (
            <div className="form-alert is-info" role="status">
              Anda sedang masuk dengan daftar akun sekolah lokal untuk pengujian awal.
              <a href="#/dashboard">Buka dashboard <ArrowRight size={14} /></a>
            </div>
          )}
          <h2>{formTitle}</h2>
          <p className="auth-form-intro">
            {recoveryMode
              ? 'Gunakan kata sandi baru yang kuat untuk akun Anda.'
              : mode === 'signup'
                ? 'Pendaftaran mandiri hanya tersedia untuk siswa. Akun guru disiapkan oleh admin sekolah.'
                : mode === 'reset'
                  ? 'Masukkan email akun. Kami akan mengirim tautan pemulihan jika akun tersedia.'
                  : 'Masuk dengan akun guru atau siswa yang terdaftar.'}
          </p>

          {configured && !recoveryMode && (
            <div className="auth-mode-switch" role="tablist" aria-label="Jenis akses akun">
              <button
                type="button"
                role="tab"
                aria-selected={mode !== 'signup'}
                className={mode !== 'signup' ? 'is-active' : ''}
                onClick={() => switchMode('signin')}
              >
                Masuk
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'is-active' : ''}
                onClick={() => switchMode('signup')}
              >
                Daftar siswa
              </button>
            </div>
          )}

          {!configured && !demoModeAvailable && (
            <div className="form-alert is-warning" role="status">
              Supabase belum terhubung. Nyalakan koneksi ke Supabase atau gunakan akun sekolah yang sudah dibuat di Auth.
            </div>
          )}
          {demoModeAvailable && mode === 'signin' && !recoveryMode && (
            <section className="demo-account-list" aria-labelledby="demo-account-heading">
              <div className="demo-account-heading">
                <strong id="demo-account-heading">Akun sekolah siap dipakai</strong>
                <span>Daftar ini sesuai roster guru dan siswa SMKN 1 Garut untuk pengujian awal.</span>
              </div>
              {demoUsers.length === 0 && (
                <p className="demo-account-empty" role="status">
                  Daftar akun sekolah belum tersedia. Periksa file <code>src/auth/schoolAccounts.js</code>.
                </p>
              )}
              {demoUsers.map((user) => (
                <button
                  className="demo-account-option"
                  key={user.id}
                  onClick={() => {
                    setEmail(user.email);
                    setPassword(user.password);
                    setErrorMessage('');
                    setMessage('');
                  }}
                  type="button"
                >
                  <span className="demo-account-avatar">
                    {user.role === 'teacher' ? <Router size={17} /> : <BookOpen size={17} />}
                  </span>
                  <span className="demo-account-copy">
                    <strong>{user.display_name}</strong>
                    <small>{user.email}</small>
                  </span>
                  <span className="demo-account-use">Pilih akun <ArrowRight size={14} /></span>
                </button>
              ))}
            </section>
          )}
          {message && <div className="form-alert is-success" role="status">{message}</div>}
          {errorMessage && <div className="form-alert is-error" role="alert">{errorMessage}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && !recoveryMode && (
              <label>
                Nama lengkap
                <span className="auth-input-wrap">
                  <input
                    autoComplete="name"
                    maxLength={80}
                    name="display-name"
                    placeholder="Nama yang ditampilkan"
                    required
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                  />
                </span>
              </label>
            )}

            {!recoveryMode && (
              <label>
                Email
                <span className="auth-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    autoComplete="email"
                    name="email"
                    placeholder="nama@email.com"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </span>
              </label>
            )}

            {mode !== 'reset' && (
              <label>
                {passwordLabel}
                <span className="auth-input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input
                    autoComplete={demoModeAvailable ? 'off' : recoveryMode ? 'new-password' : mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={8}
                    name="password"
                    placeholder={recoveryMode || mode === 'signup' ? 'Minimal 8 karakter' : 'Masukkan kata sandi'}
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
            )}

            {configured && mode === 'signin' && !recoveryMode && (
              <button className="auth-forgot-link" type="button" onClick={() => switchMode('reset')}>
                Lupa kata sandi?
              </button>
            )}

            <button className="auth-submit button button-navy" type="submit" disabled={busy || (!configured && (mode !== 'signin' || !demoModeAvailable))}>
              {busy ? 'Memproses…' : recoveryMode ? 'Simpan kata sandi baru' : mode === 'signup' ? 'Daftar sebagai siswa' : mode === 'reset' ? 'Kirim tautan pemulihan' : 'Masuk ke dashboard'}
              {!busy && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="teacher-account-note">
              Guru belum punya akses? Minta admin sekolah membuat akun dan memberi peran guru melalui Supabase.
            </p>
          )}
          <p className="auth-footnote">
            {recoveryMode
              ? <button type="button" onClick={() => { clearPasswordRecovery(); switchMode('signin'); }}>Kembali ke masuk</button>
              : 'Akun guru dan siswa membuka dashboard serta fitur yang berbeda sesuai peran.'}
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
