import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const demoModeAvailable = import.meta.env.DEV && !isSupabaseConfigured;

export function AuthProvider({ children }) {
  const [demoUser, setDemoUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured || demoModeAvailable);
  const [profileError, setProfileError] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const profileRequest = useRef(0);

  const refreshProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }

    const requestId = profileRequest.current + 1;
    profileRequest.current = requestId;
    setProfileError('');

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (requestId !== profileRequest.current) return;

    if (error) {
      setProfile(null);
      setProfileError(error.message);
      return;
    }

    if (!data) {
      setProfile(null);
      setProfileError(
        'Profil akun belum tersedia. Pastikan skema LMS Supabase sudah diterapkan.',
      );
      return;
    }

    setProfile(data);
  }, []);

  const signInDemo = useCallback(async (email, password) => {
    if (!demoModeAvailable || isSupabaseConfigured) {
      throw new Error('Akun sekolah hanya tersedia saat Supabase belum dikonfigurasi pada mode pengembangan.');
    }

    const { findDemoUser, persistDemoUser } = await import('./schoolAccounts');
    const user = findDemoUser(email, password);
    if (!user) {
      throw new Error('Email atau kata sandi akun sekolah tidak cocok. Periksa daftar akun lokal yang tersedia.');
    }

    persistDemoUser(user);
    setDemoUser(user);
    setSession({ user: { id: user.id, email: user.email } });
    setProfile({ id: user.id, display_name: user.display_name, role: user.role });
    setProfileError('');
  }, []);

  const signOut = useCallback(async () => {
    if (demoUser) {
      try {
        const { clearDemoUser } = await import('./schoolAccounts');
        clearDemoUser();
        setDemoUser(null);
        setSession(null);
        setProfile(null);
        setProfileError('');
        return { error: null };
      } catch (error) {
        return { error };
      }
    }

    if (!supabase) {
      return { error: new Error('Layanan autentikasi belum dikonfigurasi.') };
    }
    return supabase.auth.signOut();
  }, [demoUser]);

  useEffect(() => {
    if (!supabase) {
      let mounted = true;

      async function restoreLocalDemoSession() {
        if (demoModeAvailable) {
          try {
            const { restoreDemoUser } = await import('./schoolAccounts');
            const restoredUser = restoreDemoUser();
            if (mounted && restoredUser) {
              setDemoUser(restoredUser);
              setSession({ user: { id: restoredUser.id, email: restoredUser.email } });
              setProfile({
                id: restoredUser.id,
                display_name: restoredUser.display_name,
                role: restoredUser.role,
              });
            }
          } catch (error) {
            if (mounted) {
              setProfileError(error instanceof Error ? error.message : 'Gagal memulihkan sesi akun sekolah.');
            }
          }
        }

        if (mounted) setLoading(false);
      }

      void restoreLocalDemoSession();
      return () => {
        mounted = false;
      };
    }

    let mounted = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (!nextSession) {
          profileRequest.current += 1;
          setProfile(null);
          setProfileError('');
          setIsPasswordRecovery(false);
          return;
        }

        window.setTimeout(() => {
          if (mounted) void refreshProfile(nextSession.user.id);
        }, 0);
      },
    );

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setProfileError(error.message);
        setSession(null);
      } else {
        setSession(data.session);
        if (data.session) {
          void refreshProfile(data.session.user.id);
        }
      }
      setLoading(false);
    }).catch((error) => {
      if (!mounted) return;
      setProfileError(error instanceof Error ? error.message : 'Gagal memeriksa sesi login.');
      setSession(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const value = {
    configured: isSupabaseConfigured,
    demoModeAvailable,
    demoMode: Boolean(demoUser),
    supabase,
    session,
    profile,
    loading,
    profileError,
    isPasswordRecovery,
    clearPasswordRecovery: () => setIsPasswordRecovery(false),
    refreshProfile,
    signInDemo,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return context;
}
