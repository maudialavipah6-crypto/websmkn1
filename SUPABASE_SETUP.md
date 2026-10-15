# Menyiapkan autentikasi dan portal TKJ

Portal memakai Supabase Auth, database, dan Supabase Storage untuk akun siswa/guru, materi TKJ, lampiran privat, kuis, hasil kuis, dan presensi. Supabase belum terhubung sampai langkah berikut dilakukan untuk proyek milik sekolah.

## Mencoba akun dummy sebelum Supabase siap

Jalankan situs dengan `npm run dev`. Simpan akun pratinjau di `.env.local` (salin `.env.example`, lalu sesuaikan bila diperlukan):

| Variabel | Nilai awal |
|---|---|---|
| `VITE_DEMO_TEACHER_EMAIL` | `guru@tkj.demo` |
| `VITE_DEMO_TEACHER_PASSWORD` | Atur kata sandi lokal |
| `VITE_DEMO_STUDENT_EMAIL` | `siswa@tkj.demo` |
| `VITE_DEMO_STUDENT_PASSWORD` | Atur kata sandi lokal |

Gunakan hanya kredensial fiktif: variabel `VITE_*` dipublikasikan ke browser dan bukan tempat menyimpan rahasia akun nyata. Akun demo aktif hanya di server pengembangan saat Supabase belum dikonfigurasi. Profil, materi, hasil kuis, dan presensi yang ditampilkan adalah contoh, bukan baris `auth.users` atau database Supabase; dashboard pratinjau hanya-baca. Sesi demo hanya disimpan pada sesi browser. Setelah Supabase dikonfigurasi, login kembali dengan akun Auth yang benar; akun dummy tidak dibuat atau disalin ke database.

Saat membuat build produksi dengan `npm run build`, modul kredensial demo diganti dengan modul kosong dan tidak disertakan dalam bundle.

## 1. Terapkan skema database

1. Buka proyek Supabase sekolah dan pilih **SQL Editor**.
2. Jalankan seluruh isi [`supabase/schema.sql`](./supabase/schema.sql).
3. Pastikan eksekusi berakhir dengan sukses. Skrip membuat tabel, profil otomatis untuk akun Auth baru maupun akun lama, kebijakan akses, fungsi penilaian kuis, serta bucket privat `tkj-course-assets` dan kebijakan Storage.

Jalankan ulang skrip skema yang telah diperbarui pada proyek yang sebelumnya sudah memakai skema portal agar tabel lampiran, bucket privat, dan kebijakan aksesnya ikut diterapkan. Profil yang sudah ada akan dipertahankan. Akun baru selalu dibuat sebagai siswa; metadata formulir pendaftaran tidak dapat menetapkan peran guru.

### Siklus materi guru

- Guru dapat membuat, mengedit, menyimpan sebagai draf, menerbitkan, menarik publikasi, dan menghapus materi.
- Editor mendukung teks tebal/miring, subjudul, daftar, kutipan, tautan, gambar di dalam materi, serta berkas gambar/PDF sebagai lampiran.
- Tipe berkas yang diterima: JPEG, PNG, WebP, PDF; maksimal 10 MB per berkas dan 15 lampiran per materi.
- HTML materi dibersihkan sebelum disimpan dan kembali dibersihkan sebelum ditampilkan. File disimpan di bucket privat, bukan URL publik; siswa hanya memperoleh signed URL untuk lampiran pada materi terbit.
- Saat menghapus materi atau lampiran, aplikasi juga meminta penghapusan objek di Storage. Jika pembersihan Storage gagal, dashboard menampilkan pesan agar admin memeriksa berkas yatim di bucket.

### Alur siswa

- Siswa hanya melihat materi dan kuis terbit. Materi dapat dibuka dengan gambar tersemat serta tautan unduh PDF/gambar.
- Siswa dapat mengerjakan kuis yang tersedia dan menerima nilai hasil penilaian database, serta menandai kehadiran pada sesi presensi terbuka.
- Data belajar nyata memerlukan akun Supabase Auth yang terdaftar. Akun demo lokal tetap hanya-baca dan tidak menyimpan materi, kuis, hasil, presensi, atau lampiran.

## 2. Konfigurasikan variabel lokal

Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan **publishable key** dari pengaturan API proyek. Pertahankan variabel akun demo hanya jika diperlukan untuk pratinjau lokal:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
```

Jangan menaruh `service_role` key di variabel `VITE_*`, browser, repositori, atau pesan. Publishable key memang digunakan pada aplikasi browser; otorisasi data tetap ditegakkan oleh Row Level Security. Setelah mengubah file lingkungan, mulai ulang server Vite.

## 3. Atur tautan Auth

Di **Authentication → URL Configuration**, atur **Site URL** ke origin situs yang digunakan. Tambahkan URL lokal dan URL situs produksi sebagai **Redirect URLs**, misalnya:

- `http://localhost:5173/**`
- `https://alamat-situs-sekolah/**`

Ganti contoh URL produksi dengan domain yang benar. Aktifkan konfirmasi email untuk pendaftaran bila kebijakan sekolah mengharuskannya dan pastikan email Auth dapat dikirim. Tautan konfirmasi dan pemulihan kata sandi diarahkan kembali ke halaman aplikasi.

## 4. Provision akun guru dan siswa

Daftar nama dan email berada di `src/auth/schoolAccounts.js`, yang sengaja tidak diunggah ke GitHub. Jalankan provisioning hanya dari komputer admin setelah schema berhasil diterapkan. Script membuat kata sandi acak untuk akun baru dan menetapkan profil/role yang sesuai. Akun yang sudah ada tidak akan di-reset; kata sandinya tidak dapat dibaca kembali dan akan ditandai demikian di file hasil.

Di PowerShell, masukkan URL proyek dan service-role key secara lokal. Jangan tempelkan service-role key ke chat, browser, `.env.example`, atau variabel `VITE_*`:

```powershell
$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$secureKey = Read-Host "Supabase service-role key" -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password
npm run supabase:provision
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
Remove-Item Env:SUPABASE_URL
```

Script memerlukan `public.profiles` dan trigger dari schema di atas. Kredensial hasil dibuat di `supabase/school-account-credentials.json`; file tersebut diabaikan Git dan hanya berisi password yang baru dibuat. Simpan dan bagikan file itu melalui kanal privat sekolah, lalu minta pengguna mengganti password melalui alur pemulihan akun. Untuk akun yang sudah ada, admin perlu mengatur atau memulihkan password lewat Supabase Auth.

Setelah provisioning, periksa daftar user pada **Authentication → Users** dan pastikan profil guru memiliki role `teacher`. Jangan pernah memberikan service-role key kepada guru atau siswa.

## 5. Jalankan dan uji

```powershell
npm run dev
```

Uji satu akun guru dan satu akun siswa: terbitkan materi/kuis dan buka sesi presensi sebagai guru, lalu pastikan akun siswa dapat melihat konten yang sama, mengirim jawaban, dan mencatat kehadiran. Hasil serta presensi tiap siswa hanya terlihat oleh siswa terkait dan guru yang memiliki sesi/kuis.

Untuk menguji CMS, buat materi draf, tambahkan format dan gambar/PDF, simpan, lalu edit dan terbitkan. Pastikan siswa tidak dapat melihat draf, dapat melihat materi terbit, gambar, serta membuka lampiran; setelah materi ditarik atau dihapus, tautan penyimpanannya tidak lagi diberikan oleh portal.
