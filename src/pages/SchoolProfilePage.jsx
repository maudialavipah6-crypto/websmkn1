import { ArrowLeft, ArrowUpRight, MapPin, Phone, Mail, School, CalendarDays, Award } from 'lucide-react';

const programs = [
  'Akuntansi dan Keuangan Lembaga',
  'Desain Komunikasi Visual',
  'Manajemen Perkantoran dan Layanan Bisnis',
  'Pemasaran',
  'Pengembangan Perangkat Lunak dan Gim',
  'Teknik Energi Terbarukan',
  'Teknik Jaringan Komputer dan Telekomunikasi',
  'Teknik Laboratorium Medik',
  'Teknik Logistik',
  'Teknologi Farmasi',
];

const teachers = [
  { name: 'Azis Jaenal Mutaqin, S.Kom', photo: 'azis-jaenal-mutaqin.jpg', nip: '199511182022211005', grade: 'IX', role: 'Guru Ahli Pertama' },
  { name: 'Nunung Nurhayati, ST', photo: 'nunung-nurhayati.jpg', nip: '197811072010012007', grade: 'Penata, III/c', role: 'Guru Ahli Muda' },
  { name: 'Erma Rahmawati, S.Pd', photo: 'erma-rahmawati.jpg', nip: '198810242020122010', grade: 'Penata Muda Tk. I, III/b', role: 'Guru Ahli Pertama' },
];

export default function SchoolProfilePage() {
  return <div className="page-shell"><header className="topbar"><a className="brand-wrap" href="#beranda"><img className="brand-logo" src="/LOGO_SMKN1_GARUT.jpeg" alt=""/><span className="brand-copy"><strong>SMKN 1 Garut</strong><span>Profil Sekolah</span></span></a><a className="header-cta" href="#/login">Login guru / siswa <ArrowUpRight size={16}/></a><ResponsiveSidebar className="site-navigation" label="SMKN 1 Garut"><nav className="nav" aria-label="Navigasi sekolah"><a href="#beranda">Beranda</a><a href="#pembelajaran">Materi TKJ</a><a href="#/dashboard">Dashboard</a></nav></ResponsiveSidebar></header><main className="school-profile-page">
    <a className="school-profile-back" href="#beranda"><ArrowLeft size={16}/> Kembali ke beranda</a>
    <header className="school-profile-hero">
      <h1>SMK Negeri 1 Garut</h1>
      <p>Identitas sekolah, kepala sekolah, dan tenaga pendidik.</p>
      <div className="school-profile-facts"><div><School/><span>NPSN<strong>20209201</strong></span></div><div><CalendarDays/><span>Berdiri<strong>24 Juli 1959</strong></span></div><div><Award/><span>Akreditasi<strong>A · data 2022</strong></span></div></div>
    </header>
    <nav className="school-section-nav" aria-label="Bagian profil sekolah"><a href="#/profil-sekolah?kepala" onClick={() => document.getElementById('kepala-sekolah')?.scrollIntoView()}>Kepala sekolah</a><a href="#/profil-sekolah?guru" onClick={() => document.getElementById('guru-sekolah')?.scrollIntoView()}>Tenaga pendidik</a><a href="#/profil-sekolah?program" onClick={() => document.getElementById('program-sekolah')?.scrollIntoView()}>Program keahlian</a><a href="#/profil-sekolah?kontak" onClick={() => document.getElementById('kontak-sekolah')?.scrollIntoView()}>Kontak</a></nav>
    <section className="school-leadership" id="kepala-sekolah" aria-labelledby="principal-heading">
      <img src="/staff/asep-rudiana.jpg" alt="Dr. Asep Rudiana, M.Pd." width="932" height="1536" />
      <div><h2 id="principal-heading">Kepala sekolah</h2><h3>Dr. Asep Rudiana, M.Pd.</h3><p>SMK Negeri 1 Garut</p><a className="school-contact-link" href="#/profil-sekolah?kontak" onClick={() => document.getElementById('kontak-sekolah')?.scrollIntoView()}>Hubungi sekolah <ArrowUpRight size={16}/></a></div>
    </section>
    <section className="school-teachers" id="guru-sekolah" aria-labelledby="teachers-heading"><h2 id="teachers-heading">Tenaga pendidik</h2><div className="staff-grid">{teachers.map(teacher => <article className="staff-profile" key={teacher.nip}><img src={`/staff/${teacher.photo}`} alt={teacher.name} loading="lazy" width="400" height="600"/><h3>{teacher.name}</h3><p>{teacher.role}</p><dl><div><dt>NIP</dt><dd>{teacher.nip}</dd></div><div><dt>Pangkat/Gol.</dt><dd>{teacher.grade}</dd></div></dl></article>)}</div></section>
    <section className="school-profile-block programs-block" id="program-sekolah"><div><h2>Program keahlian</h2><p>Daftar program berdasarkan data pendidikan pemerintah yang tersedia.</p></div><ol>{programs.map((program,i)=><li key={program}><span>{String(i+1).padStart(2,'0')}</span>{program}</li>)}</ol></section>
    <section className="school-profile-block contact-block" id="kontak-sekolah"><div><h2>Kontak dan lokasi</h2></div><div className="school-contact-list"><p><MapPin/><span>Jl. Cimanuk No. 309A, Pataruman, Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151</span></p><a href="tel:+62262233316"><Phone/><span>(0262) 233316</span><ArrowUpRight/></a><a href="mailto:smkn1garut@ymail.com"><Mail/><span>smkn1garut@ymail.com</span><ArrowUpRight/></a><a href="https://smknegeri1garut.sch.id/" target="_blank" rel="noreferrer"><School/><span>Website resmi sekolah</span><ArrowUpRight/></a></div></section>
    <footer className="school-profile-source">Sumber: <a href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/20209201" target="_blank" rel="noreferrer">Data Pendidikan Kemendikdasmen</a> dan <a href="https://smknegeri1garut.sch.id/" target="_blank" rel="noreferrer">situs resmi SMKN 1 Garut</a>. Informasi akreditasi mengacu pada data tahun 2022.</footer>
  </main><footer className="school-profile-footer"><a href="#beranda">Kembali ke beranda</a><span>SMKN 1 Garut · Kabupaten Garut</span></footer></div>;
}
import ResponsiveSidebar from '../components/ResponsiveSidebar';
