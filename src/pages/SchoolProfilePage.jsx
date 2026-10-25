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

export default function SchoolProfilePage() {
  return <div className="page-shell"><header className="topbar"><a className="brand-wrap" href="#beranda"><img className="brand-logo" src="/LOGO_SMKN1_GARUT.jpeg" alt=""/><span className="brand-copy"><strong>SMKN 1 Garut</strong><span>Profil Sekolah</span></span></a><a className="header-cta" href="#/login">Login guru / siswa <ArrowUpRight size={16}/></a></header><main className="school-profile-page">
    <a className="school-profile-back" href="#beranda"><ArrowLeft size={16}/> Kembali ke beranda</a>
    <header className="school-profile-hero">
      <span>PROFIL SEKOLAH · GARUT</span><h1>SMK Negeri 1 Garut</h1>
      <p>Sekolah menengah kejuruan negeri di Kabupaten Garut yang menyelenggarakan pendidikan kejuruan untuk menyiapkan lulusan kompeten dan siap melanjutkan karier.</p>
      <div className="school-profile-facts"><div><School/><span>NPSN<strong>20209201</strong></span></div><div><CalendarDays/><span>Berdiri<strong>24 Juli 1959</strong></span></div><div><Award/><span>Akreditasi<strong>A · data 2022</strong></span></div></div>
    </header>
    <section className="school-profile-block"><div><span className="section-eyebrow">TENTANG SEKOLAH</span><h2>Pendidikan kejuruan untuk beragam bidang.</h2></div><p>SMKN 1 Garut merupakan sekolah negeri berbentuk SMK yang berlokasi di Kecamatan Tarogong Kidul. Data pemerintah mencatat sekolah ini berdiri pada 1959. Saat ini, sekolah memiliki program keahlian di bidang bisnis, teknologi, desain, kesehatan, dan teknik.</p></section>
    <section className="school-profile-block programs-block"><div><span className="section-eyebrow">PROGRAM KEAHLIAN</span><h2>Pilihan bidang keahlian.</h2><p>Daftar program berdasarkan data pendidikan pemerintah yang tersedia.</p></div><ol>{programs.map((program,i)=><li key={program}><span>{String(i+1).padStart(2,'0')}</span>{program}</li>)}</ol></section>
    <section className="school-profile-block contact-block"><div><span className="section-eyebrow">KUNJUNGI</span><h2>Informasi dan lokasi.</h2></div><div className="school-contact-list"><p><MapPin/><span>Jl. Cimanuk No. 309A, Pataruman, Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151</span></p><a href="tel:+62262233316"><Phone/><span>(0262) 233316</span><ArrowUpRight/></a><a href="mailto:smkn1garut@ymail.com"><Mail/><span>smkn1garut@ymail.com</span><ArrowUpRight/></a><a href="https://smknegeri1garut.sch.id/" target="_blank" rel="noreferrer"><School/><span>Website resmi sekolah</span><ArrowUpRight/></a></div></section>
    <footer className="school-profile-source">Sumber: <a href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/20209201" target="_blank" rel="noreferrer">Data Pendidikan Kemendikdasmen</a> dan <a href="https://smknegeri1garut.sch.id/" target="_blank" rel="noreferrer">situs resmi SMKN 1 Garut</a>. Informasi akreditasi mengacu pada data tahun 2022.</footer>
  </main><footer className="school-profile-footer"><a href="#beranda">Kembali ke beranda</a><span>SMKN 1 Garut · Kabupaten Garut</span></footer></div>;
}
