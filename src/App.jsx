import { lazy, Suspense, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Cable,
  ChevronRight,
  Cpu,
  MapPin,
  Mail,
  Phone,
  Server,
} from 'lucide-react';
import { useAuth } from './auth/AuthProvider';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PublicLessons = lazy(() => import('./components/PublicLessons'));
const SchoolProfilePage = lazy(() => import('./pages/SchoolProfilePage'));

// Ganti data dan foto masing-masing anggota setelah tersedia.
const creators = [
  { name: 'Khoir Nur Wahid', nim: '2657201073021' },
  { name: 'M Ahyar Darya', nim: '2657201310' },
  { name: 'Dina Aulia Salsabila', nim: '2657201073019' },
  { name: 'Maudi Al Avipah', nim: '2657201073007' },
  { name: 'Nisrina Sri Wiguna', nim: '2657201073008' },
].map((person, index) => ({ ...person, id: index + 1, photo: '' }));

const topics = [
  {
    id: 'perangkat',
    title: 'Komputer dan perangkat',
    description: 'Mengenali komponen, merakit, merawat, dan mendiagnosis perangkat komputer.',
    icon: Cpu,
  },
  {
    id: 'jaringan',
    title: 'Jaringan dan konektivitas',
    description: 'Memahami topologi, media transmisi, pengalamatan, dan konfigurasi jaringan.',
    icon: Cable,
  },
  {
    id: 'server',
    title: 'Server dan layanan jaringan',
    description: 'Mengenal peran server, layanan jaringan, dan dasar pengamanan infrastruktur.',
    icon: Server,
  },
];

const navigation = [
  ['#beranda', 'Beranda'],
  ['#tujuan', 'Tujuan'],
  ['#program-tkj', 'Program TKJ'],
  ['#pembelajaran', 'Pembelajaran'],
  ['#/profil-sekolah', 'Profil Sekolah'],
  ['#pembuat', 'Pembuat'],
];

function currentRoute() {
  const hash = window.location.hash;
  if (!hash.startsWith('#/')) return 'home';
  return hash.slice(2).split('?')[0] || 'home';
}

import ResponsiveSidebar from './components/ResponsiveSidebar';

function App() {
  const reduceMotion = useReducedMotion();
  const { session, profile, loading: authLoading, isPasswordRecovery } = useAuth();
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const updateRoute = () => {
      setRoute(currentRoute());
    };
    window.addEventListener('hashchange', updateRoute);
    return () => window.removeEventListener('hashchange', updateRoute);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('has-dashboard', route === 'dashboard');
    return () => document.body.classList.remove('has-dashboard');
  }, [route]);

  if (route === 'login' || isPasswordRecovery) {
    return (
      <Suspense fallback={<div className="route-loading" role="status">Memuat halaman login…</div>}>
        <LoginPage />
      </Suspense>
    );
  }

  if (route === 'profil-sekolah') {
    return <Suspense fallback={<div className="route-loading" role="status">Memuat profil sekolah…</div>}><SchoolProfilePage /></Suspense>;
  }

  if (route === 'dashboard') {
    if (authLoading) {
      return <div className="route-loading" role="status">Memeriksa sesi akun…</div>;
    }
    if (!session || !profile) {
      return <Suspense fallback={<div className="route-loading" role="status">Memuat halaman login…</div>}><LoginPage /></Suspense>;
    }
    return (
      <Suspense fallback={<div className="route-loading" role="status">Memuat dashboard…</div>}>
        <DashboardPage />
      </Suspense>
    );
  }

  const loggedIn = Boolean(session && profile);
  const accountHref = loggedIn ? '#/dashboard' : '#/login';
  const accountLabel = loggedIn ? 'Dashboard' : 'Login guru / siswa';
  const mapQuery = encodeURIComponent(
    'Jl. Cimanuk No. 309A, Pataruman, Tarogong Kidul, Kabupaten Garut, Jawa Barat',
  );

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand-wrap" href="#beranda" aria-label="SMKN 1 Garut, kembali ke beranda">
          <img className="brand-logo" src="/LOGO_SMKN1_GARUT.jpeg" alt="Logo SMKN 1 Garut" />
          <span className="brand-copy">
            <strong>SMKN 1 Garut</strong>
            <span>Teknik Komputer dan Jaringan</span>
          </span>
        </a>

        <ResponsiveSidebar className="site-navigation" label="SMKN 1 Garut">
        <nav className="nav" id="main-navigation" aria-label="Navigasi utama">
          {navigation.map(([href, label]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
        <a className="drawer-account-link" href={accountHref}>{accountLabel}<ArrowUpRight size={16} /></a>
        </ResponsiveSidebar>

        <a className="header-cta" href={accountHref}>
          {accountLabel}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </header>

      <main>
        <section className="hero" id="beranda">
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1>Belajar TKJ di SMKN 1 Garut.</h1>
            <p className="hero-description">
              Materi komputer dan jaringan, kuis, serta presensi kelas dalam satu portal.
            </p>
            <div className="hero-actions">
              <a className="button button-bright" href="#pembelajaran">
                Buka materi
                <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="button button-quiet" href={accountHref}>
                {loggedIn ? 'Buka dashboard' : 'Login guru dan siswa'}
              </a>
            </div>
            <div className="hero-tags" aria-label="Bidang pembelajaran TKJ">
              <span>Komputer</span>
              <span>Jaringan</span>
              <span>Server</span>
            </div>
          </motion.div>

          <nav className="hero-resources" aria-label="Akses pembelajaran">
            <h2>Ruang belajar TKJ</h2>
            <a href="#pembelajaran"><span>Materi pembelajaran<small>Baca modul tanpa login</small></span><ArrowUpRight size={22}/></a>
            <a href={accountHref}><span>Kuis dan presensi<small>Masuk dengan ID pengguna</small></span><ArrowUpRight size={22}/></a>
            <a href="#/profil-sekolah"><span>Profil sekolah<small>Kepala sekolah dan tenaga pendidik</small></span><ArrowUpRight size={22}/></a>
          </nav>
        </section>

        <section className="section purpose-section" id="tujuan">
          <div className="section-heading">
            <div><h2>Belajar TKJ, dari materi sampai evaluasi.</h2></div>
            <p className="section-intro">Web pembelajaran ini membantu siswa mengakses materi TKJ dan mengikuti aktivitas kelas. Guru dapat menerbitkan materi serta mengelola kuis dan presensi dari ruang kerja mereka.</p>
          </div>
          <div className="purpose-grid">
            <div><h3>Materi terbuka</h3><p>Modul yang telah diterbitkan bisa dibaca siapa saja tanpa akun.</p></div>
            <div><h3>Evaluasi terarah</h3><p>Siswa yang masuk dapat mengerjakan kuis dan melihat hasilnya.</p></div>
            <div><h3>Aktivitas tercatat</h3><p>Guru mengelola materi dan sesi presensi melalui dashboard.</p></div>
          </div>
        </section>

        <section className="section program-section" id="program-tkj">
          <div className="section-heading">
            <div><h2>Belajar memahami cara perangkat saling terhubung.</h2></div>
            <p className="section-intro">
              Teknik Komputer dan Jaringan memadukan pemahaman perangkat dengan keterampilan
              merancang, mengonfigurasi, dan merawat jaringan.
            </p>
          </div>
          <div className="topic-list">
            {topics.map(({ id, title, description, icon: Icon }, index) => (
              <article className="topic-row" key={id}>
                <span className="topic-number">0{index + 1}</span>
                <Icon className="topic-icon" size={23} strokeWidth={1.7} aria-hidden="true" />
                <div className="topic-copy"><h3>{title}</h3><p>{description}</p></div>
                <span className="topic-link-icon" aria-hidden="true"><ArrowUpRight size={18} /></span>
              </article>
            ))}
          </div>
        </section>

        <section className="section learning-section" id="pembelajaran">
          <div className="section-heading learning-heading">
            <div><h2>Materi yang bisa dibaca kapan saja.</h2></div>
            <p className="section-intro">
              Baca modul yang diterbitkan guru tanpa login. Untuk mengerjakan kuis dan mencatat presensi, masuk ke dashboard siswa.
            </p>
          </div>
          <Suspense fallback={<p className="public-state" role="status">Menyiapkan daftar materi…</p>}><PublicLessons /></Suspense>
          <div className="learning-footnote">Kuis dan presensi khusus akun siswa. <a href={accountHref}>{accountLabel} <ArrowRight size={15} /></a></div>
        </section>

        <section className="section school-section" id="profil-sekolah"><div className="section-heading"><div><h2>Kenali SMKN 1 Garut.</h2></div><p className="section-intro">Lihat identitas, sejarah singkat, program keahlian, dan informasi resmi sekolah.</p></div><a className="inline-link" href="#/profil-sekolah">Lihat profil lengkap <ArrowRight size={16}/></a></section>

        <section className="section vision-section vision-profile-section" id="visi-misi">
          <div className="vision-copy">
            <h2>Terwujudnya sekolah kejuruan juara lahir dan batin.</h2>
          </div>
          <div className="mission-copy">
            <h3>Visi &amp; Misi</h3>
            <p>
              Menyelenggarakan pembelajaran Teknik Komputer dan Jaringan yang kuat dalam teori,
              terampil dalam praktik, serta membentuk lulusan yang berkarakter dan siap menghadapi
              perkembangan teknologi.
            </p>
          </div>
          <a className="vision-link" href="#kontak" aria-label="Lanjut ke kontak SMKN 1 Garut"><ArrowUpRight size={22} /></a>
        </section>

        <section className="section creators-section" id="pembuat">
          <div className="section-heading"><div><h2>Profil pembuat.</h2></div><p className="section-intro">Lima anggota dari Program Studi Sistem Informasi, Institut Pendidikan Indonesia Garut. Profil anggota tim pengembang web pembelajaran.</p></div>
          <div className="creator-grid">{creators.map((creator) => <article className="creator-card" key={creator.id}>
            <div className="creator-photo">{creator.photo ? <img src={creator.photo} alt={`Foto ${creator.name}`} loading="lazy" /> : <span aria-label="Foto belum tersedia">FOTO<br />ANGGOTA {String(creator.id).padStart(2, '0')}</span>}</div>
            <div className="creator-info"><small>ANGGOTA {String(creator.id).padStart(2, '0')}</small><h3>{creator.name}</h3><p>{creator.nim}</p><p>Sistem Informasi<br />Institut Pendidikan Indonesia Garut</p></div>
          </article>)}</div>
        </section>

        <section className="section contact-section" id="kontak">
          <div className="section-heading">
            <div><h2>Informasi SMKN 1 Garut.</h2></div>
            <p className="section-intro">Hubungi sekolah untuk informasi lebih lanjut tentang program TKJ.</p>
          </div>
          <div className="contact-layout">
            <div className="contact-address">
              <MapPin size={21} aria-hidden="true" />
              <div>
                <span>Alamat sekolah</span>
                <address>Jl. Cimanuk No. 309A, Pataruman, Tarogong Kidul, Kabupaten Garut, Jawa Barat.</address>
                <a
                  className="inline-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cari lokasi di Google Maps <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
            <div className="contact-details">
              <a href="tel:+62262233316"><Phone className="contact-detail-icon" size={19} aria-hidden="true" /><span><small>Telepon / Fax</small>(0262) 233316</span><ArrowUpRight size={15} className="contact-arrow" aria-hidden="true" /></a>
              <a href="mailto:smkn1garut@ymail.com"><Mail className="contact-detail-icon" size={19} aria-hidden="true" /><span><small>Email sekolah</small>smkn1garut@ymail.com</span><ArrowUpRight size={15} className="contact-arrow" aria-hidden="true" /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#beranda">
          <img src="/LOGO_SMKN1_GARUT.jpeg" alt="" />
          <span><strong>SMKN 1 Garut</strong><small>Program Teknik Komputer dan Jaringan</small></span>
        </a>
        <div className="footer-nav">
          <a href="#tujuan">Tujuan web</a>
          <a href="#program-tkj">Program TKJ</a>
          <a href="#pembelajaran">Pembelajaran</a>
          <a href="#profil-sekolah">Profil sekolah</a>
          <a href="#pembuat">Pembuat</a>
          <a href="#kontak">Kontak</a>
        </div>
        <a className="back-to-top" href={accountHref}>{loggedIn ? 'Dashboard' : 'Login guru / siswa'} <ChevronRight size={15} /></a>
      </footer>
    </div>
  );
}

export default App;
