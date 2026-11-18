import { useEffect } from 'react';
import { ArrowLeft, ArrowUpRight, MapPin, Phone, Mail, School, CalendarDays, Award } from 'lucide-react';
import ResponsiveSidebar from '../components/ResponsiveSidebar';
import { activities, goals, history, missions, rules } from './schoolProfileContent';

const profileSections = [
  ['sejarah', 'Sejarah'],
  ['visi-misi', 'Visi dan misi'],
  ['tujuan', 'Tujuan'],
  ['motto', 'Motto'],
  ['kepala', 'Kepala sekolah'],
  ['guru', 'Tenaga pendidik'],
  ['program', 'Program keahlian'],
  ['tata-tertib', 'Tata tertib'],
  ['kegiatan', 'Kegiatan siswa'],
  ['kontak', 'Kontak'],
];

function ProfilePoints({ points }) {
  return <ul className="school-profile-points">{points.map(([title, description]) => (
    <li key={title}><h3>{title}</h3><p>{description}</p></li>
  ))}</ul>;
}

function ProfileTopics({ topics }) {
  return <div className="school-profile-topics">{topics.map(([title, items]) => (
    <details key={title}>
      <summary>{title}</summary>
      <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </details>
  ))}</div>;
}

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
  useEffect(() => {
    function scrollToSection() {
      const [route, section] = window.location.hash.split('?');
      if (route === '#/profil-sekolah' && profileSections.some(([id]) => id === section)) {
        document.getElementById(`${section}-sekolah`)?.scrollIntoView();
      }
    }

    scrollToSection();
    window.addEventListener('hashchange', scrollToSection);
    return () => window.removeEventListener('hashchange', scrollToSection);
  }, []);

  return <div className="page-shell"><header className="topbar"><a className="brand-wrap" href="#beranda"><img className="brand-logo" src="/LOGO_SMKN1_GARUT.jpeg" alt=""/><span className="brand-copy"><strong>SMKN 1 Garut</strong><span>Profil Sekolah</span></span></a><a className="header-cta" href="#/login">Login guru / siswa <ArrowUpRight size={16}/></a><ResponsiveSidebar className="site-navigation" label="SMKN 1 Garut"><nav className="nav" aria-label="Navigasi sekolah"><a href="#beranda">Beranda</a><a href="#pembelajaran">Materi TKJ</a><a href="#/dashboard">Dashboard</a></nav></ResponsiveSidebar></header><main className="school-profile-page">
    <a className="school-profile-back" href="#beranda"><ArrowLeft size={16}/> Kembali ke beranda</a>
    <header className="school-profile-hero">
      <h1>SMK Negeri 1 Garut</h1>
      <p>Sejarah, arah pendidikan, dan kehidupan siswa di SMK Negeri 1 Garut.</p>
      <div className="school-profile-facts"><div><School/><span>NPSN<strong>20209201</strong></span></div><div><CalendarDays/><span>Tanggal SK pendirian<strong>24 Juli 1959</strong></span></div><div><Award/><span>Akreditasi<strong>A · data 2022</strong></span></div></div>
    </header>
    <nav className="school-section-nav" aria-label="Bagian profil sekolah">
      {profileSections.map(([id, title]) => (
        <a key={id} href={`#/profil-sekolah?${id}`} onClick={() => {
          if (window.location.hash === `#/profil-sekolah?${id}`) {
            document.getElementById(`${id}-sekolah`)?.scrollIntoView();
          }
        }}>{title}</a>
      ))}
    </nav>
    <section className="school-profile-content" id="sejarah-sekolah">
      <h2>Sejarah sekolah</h2>
      <p>SMK Negeri 1 Garut didirikan pada 1 Agustus 1959 dengan nama Sekolah Menengah Ekonomi Atas Negeri (SMEAN) Garut, berdasarkan SK Menteri Pendidikan, Pengajaran, dan Kebudayaan tanggal 24 Juli 1959 No. 897/B.3/Pedj.</p>
      <ol className="school-history">
        {history.map(([year, title, description]) => (
          <li key={year}>
            <time dateTime={String(year)}>{year}</time>
            <div><h3>{title}</h3><p>{description}</p></div>
          </li>
        ))}
      </ol>
    </section>
    <section className="school-profile-content" id="visi-misi-sekolah">
      <h2>Visi dan misi</h2>
      <h3>Visi</h3>
      <p>Menjadi lembaga pendidikan kejuruan yang unggul dalam menghasilkan lulusan yang kompeten, berkarakter, berakhlak mulia, dan berdaya saing global. Visi ini selaras dengan semangat Jabar Masagi dan Pancawaluya untuk mewujudkan peserta didik yang unggul lahir dan batin melalui inovasi dan kolaborasi.</p>
      <h3 className="school-mission-heading">Misi</h3>
      <ProfilePoints points={missions} />
    </section>
    <section className="school-profile-content" id="tujuan-sekolah">
      <h2>Tujuan sekolah</h2>
      <ProfilePoints points={goals} />
    </section>
    <section className="school-profile-content" id="motto-sekolah">
      <h2>Motto sekolah</h2>
      <p><strong>“SMKN 1 Garut Melesat”</strong> dan <strong>“Manusia Unggulan”</strong> (Sekolah Maung: Unggul, Disiplin, Kreatif, dan Berprestasi).</p>
      <p>Semangat pendidikan vokasi: “SMK Bisa, SMK Hebat” dan “SMK Jabar Istimewa”.</p>
    </section>
    <section className="school-leadership" id="kepala-sekolah" aria-labelledby="principal-heading">
      <img src="/staff/asep-rudiana.jpg" alt="Dr. Asep Rudiana, M.Pd." width="932" height="1536" />
      <div><h2 id="principal-heading">Kepala sekolah</h2><h3>Dr. Asep Rudiana, M.Pd.</h3><p>SMK Negeri 1 Garut</p><a className="school-contact-link" href="#/profil-sekolah?kontak" onClick={() => document.getElementById('kontak-sekolah')?.scrollIntoView()}>Hubungi sekolah <ArrowUpRight size={16}/></a></div>
    </section>
    <section className="school-teachers" id="guru-sekolah" aria-labelledby="teachers-heading"><h2 id="teachers-heading">Tenaga pendidik</h2><div className="staff-grid">{teachers.map(teacher => <article className="staff-profile" key={teacher.nip}><img src={`/staff/${teacher.photo}`} alt={teacher.name} loading="lazy" width="400" height="600"/><h3>{teacher.name}</h3><p>{teacher.role}</p><dl><div><dt>NIP</dt><dd>{teacher.nip}</dd></div><div><dt>Pangkat/Gol.</dt><dd>{teacher.grade}</dd></div></dl></article>)}</div></section>
    <section className="school-profile-block programs-block" id="program-sekolah"><div><h2>Program keahlian</h2><p>Daftar program berdasarkan data pendidikan pemerintah yang tersedia.</p></div><ol>{programs.map((program,i)=><li key={program}><span>{String(i+1).padStart(2,'0')}</span>{program}</li>)}</ol></section>
    <section className="school-profile-content" id="tata-tertib-sekolah">
      <h2>Tata tertib sekolah</h2>
      <p>Seluruh siswa wajib mematuhi tata tertib untuk menjaga lingkungan belajar yang aman, nyaman, dan disiplin.</p>
      <ProfileTopics topics={rules} />
      <h3>Sanksi pelanggaran</h3>
      <p>Siswa yang melanggar tata tertib mendapatkan pembinaan dan sanksi sesuai jenis serta tingkat pelanggaran berdasarkan ketentuan sekolah.</p>
    </section>
    <section className="school-profile-content" id="kegiatan-sekolah">
      <h2>Ekstrakurikuler dan kegiatan sekolah</h2>
      <p>Organisasi dan kegiatan sekolah membantu siswa mengembangkan minat, bakat, kreativitas, keterampilan, dan jiwa kepemimpinan.</p>
      <ProfileTopics topics={activities} />
    </section>
    <section className="school-profile-block contact-block" id="kontak-sekolah"><div><h2>Kontak dan lokasi</h2></div><div className="school-contact-list"><p><MapPin/><span>Jl. Cimanuk No. 309A, Pataruman, Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151</span></p><a href="tel:+62262233316"><Phone/><span>(0262) 233316</span><ArrowUpRight/></a><a href="mailto:smkn1garut@ymail.com"><Mail/><span>smkn1garut@ymail.com</span><ArrowUpRight/></a><a href="https://smknegeri1garut.sch.id/" target="_blank" rel="noreferrer"><School/><span>Website resmi sekolah</span><ArrowUpRight/></a></div></section>
    <footer className="school-profile-source">Sumber: <a href="https://referensi.data.kemendikdasmen.go.id/pendidikan/npsn/20209201" target="_blank" rel="noreferrer">Data Pendidikan Kemendikdasmen</a> dan <a href="https://smknegeri1garut.sch.id/" target="_blank" rel="noreferrer">situs resmi SMKN 1 Garut</a>. Informasi akreditasi mengacu pada data tahun 2022.</footer>
  </main><footer className="school-profile-footer"><a href="#beranda">Kembali ke beranda</a><span>SMKN 1 Garut · Kabupaten Garut</span></footer></div>;
}
