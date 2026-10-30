# Menyiapkan autentikasi dan portal TKJ

## Jika materi terlihat di dashboard tetapi tidak di beranda

Jalankan seluruh isi `supabase/public-lessons.sql` di SQL Editor proyek yang sama dengan website. Skrip dapat dijalankan ulang dan hanya memberikan akses baca pengunjung pada materi **terbit** beserta lampirannya. Draf tetap privat. Migrasi `id-user-migration.sql` tidak menggantikan migrasi akses publik ini.

Setelah SQL berhasil, buka beranda dalam jendela privat tanpa login, lalu cek bagian Perpustakaan TKJ dan buka salah satu lampiran. Tidak perlu membuat bucket publik atau mematikan RLS. Frontend memuat ulang daftar saat tab kembali aktif, setiap 60 detik ketika halaman terlihat, dan melalui tombol coba lagi saat gagal.

Portal memakai Supabase Auth, database, dan Supabase Storage untuk akun siswa/guru, materi TKJ, lampiran privat, kuis, hasil kuis, dan presensi. Supabase belum terhubung sampai langkah berikut dilakukan untuk proyek milik sekolah.

## Aktivasi login ID dan dashboard admin

Versi terbaru tidak meminta email kepada pengguna. Siswa, guru, dan admin masuk memakai **ID Pengguna** yang dibuat admin, misalnya `SISWA001`, `GURU001`, atau `ADMIN001`. Email internal hanya dipakai Supabase di belakang layar dan tidak ditampilkan di portal.

Untuk proyek Supabase yang sudah berjalan:

1. Jalankan seluruh isi [`supabase/id-user-migration.sql`](./supabase/id-user-migration.sql) melalui **SQL Editor**. Akun lama otomatis memperoleh ID sementara; admin dapat menggantinya dari dashboard.
2. Deploy dua Edge Function dari terminal yang sudah login ke Supabase CLI:

```powershell
supabase functions deploy login-id --no-verify-jwt
supabase functions deploy admin-users
```

`login-id` memang harus dapat dipanggil sebelum pengguna mempunyai sesi, sedangkan `admin-users` tetap memeriksa sesi dan role admin pada server. Jangan pernah menaruh service-role key di Vercel atau variabel `VITE_*`.

3. Buat akun admin pertama dari komputer pengelola:

```powershell
$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$secureKey = Read-Host "Supabase service-role key" -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password
npm run supabase:bootstrap-admin
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
Remove-Item Env:SUPABASE_URL
```

Terminal menampilkan ID `ADMIN001` dan satu password sementara. Simpan password tersebut saat muncul karena password Auth tidak dapat dibaca kembali. Setelah login, admin dapat membuat akun, mengubah ID/nama/peran/status, mengganti password, dan menghapus akun langsung dari dashboard.

Password minimal delapan karakter. Jika pengguna lupa password, admin membuka akun terkait, mengisi **Kata sandi baru**, lalu menyimpan perubahan. Password lama tidak dapat dan tidak perlu ditampilkan.

## Pratinjau lokal sebelum Supabase siap

Jalankan situs dengan `npm run dev`. Saat Supabase belum dikonfigurasi, development mode menampilkan roster lokal dari `src/auth/schoolAccounts.js` untuk pratinjau dashboard. Kata sandi `local-preview-only` hanya untuk simulasi lokal, bukan kata sandi akun Auth sekolah.

Tidak diperlukan variabel demo di `.env.local`.

Materi, kuis, hasil, dan presensi pada mode ini bersifat pratinjau dan tidak tersimpan di Supabase. Jangan gunakan mode lokal untuk data sekolah nyata.

Build produksi mengganti modul roster lokal dengan modul kosong; nama/email roster dan password pratinjau tidak dimasukkan ke bundle.

## 1. Terapkan skema database

1. Buka proyek Supabase sekolah dan pilih **SQL Editor**.
2. Jalankan seluruh isi [`supabase/schema.sql`](./supabase/schema.sql).
3. Pastikan eksekusi berakhir dengan sukses. Skrip membuat tabel, profil otomatis untuk akun Auth baru maupun akun lama, kebijakan akses, fungsi penilaian kuis, serta bucket privat `tkj-course-assets` dan kebijakan Storage.

Jalankan ulang skrip skema yang telah diperbarui pada proyek yang sebelumnya sudah memakai skema portal agar tabel lampiran, bucket privat, dan kebijakan aksesnya ikut diterapkan. Profil yang sudah ada akan dipertahankan. Akun baru selalu dibuat sebagai siswa; metadata formulir pendaftaran tidak dapat menetapkan peran guru.

Untuk proyek yang **sudah** menjalankan skema sebelumnya, jalankan hanya [`supabase/public-lessons.sql`](./supabase/public-lessons.sql) agar pengunjung tanpa login dapat membaca materi terbit dan membuka lampirannya. Jangan jalankan kedua skrip sekaligus; skema penuh sudah mencakup kebijakan akses publik ini. Draf tetap hanya dapat dibaca pemiliknya. Kuis dan presensi tetap memerlukan login. Uji di jendela privat setelah SQL diterapkan.

### Siklus materi guru

- Guru dapat membuat, mengedit, menyimpan sebagai draf, menerbitkan, menarik publikasi, dan menghapus materi.
- Editor mendukung teks tebal/miring, subjudul, daftar, kutipan, tautan, gambar di dalam materi, serta berkas gambar/PDF sebagai lampiran.
- Tipe berkas yang diterima: JPEG, PNG, WebP, PDF; maksimal 10 MB per berkas dan 15 lampiran per materi.
- HTML materi dibersihkan sebelum disimpan dan kembali dibersihkan sebelum ditampilkan. File disimpan di bucket privat, bukan URL publik; siswa hanya memperoleh signed URL untuk lampiran pada materi terbit.
- Saat menghapus materi atau lampiran, aplikasi juga meminta penghapusan objek di Storage. Jika pembersihan Storage gagal, dashboard menampilkan pesan agar admin memeriksa berkas yatim di bucket.

### Alur siswa

- Siswa hanya melihat materi dan kuis terbit. Materi dapat dibuka dengan gambar tersemat serta tautan unduh PDF/gambar.
- Siswa dapat mengerjakan kuis yang tersedia dan menerima nilai hasil penilaian database, serta menandai kehadiran pada sesi presensi terbuka.
- Data belajar nyata memerlukan akun Supabase Auth yang terdaftar. Mode pratinjau lokal hanya-baca dan tidak menyimpan materi, kuis, hasil, presensi, atau lampiran.

## 2. Konfigurasikan variabel lokal

Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan **publishable key** dari pengaturan API proyek:

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

Daftar nama dan email berada di `src/auth/schoolAccounts.js`, yang sengaja tidak diunggah ke GitHub. Jalankan provisioning hanya dari komputer admin setelah schema berhasil diterapkan. Script membuat kata sandi acak untuk akun baru dan mengatur ulang password akun roster yang sudah ada agar seluruh kredensial tercatat. Profil/role akan disesuaikan dengan roster.

Di PowerShell, masukkan URL proyek dan service-role key secara lokal. Jangan tempelkan service-role key ke chat, browser, `.env.example`, atau variabel `VITE_*`:

```powershell
$env:SUPABASE_URL = "https://your-project-ref.supabase.co"
$secureKey = Read-Host "Supabase service-role key" -AsSecureString
$env:SUPABASE_SERVICE_ROLE_KEY = [System.Net.NetworkCredential]::new("", $secureKey).Password
npm run supabase:provision
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
Remove-Item Env:SUPABASE_URL
```

Script memerlukan `public.profiles` dan trigger dari schema di atas. Kredensial hasil dibuat di `supabase/school-account-credentials.json`; file tersebut diabaikan Git dan berisi password acak akun baru maupun akun roster yang diatur ulang. Simpan file itu secara aman dan bagikan melalui kanal privat sekolah, lalu minta pengguna mengganti password melalui alur pemulihan akun.

Pastikan domain email roster merupakan domain yang disetujui sekolah. Akun dibuat dengan email terkonfirmasi tanpa mengirim email; jika alamat itu bukan mailbox yang bisa menerima email, pemulihan password otomatis melalui email tidak akan tersedia.

Setelah provisioning, periksa daftar user pada **Authentication → Users** dan pastikan profil guru memiliki role `teacher`. Jangan pernah memberikan service-role key kepada guru atau siswa.

### Provisioning manual lewat Dashboard

Daftar email/password lokal ada di `supabase/school-account-credentials.json` dan tidak boleh diunggah ke GitHub. Pada **Authentication → Users**, pilih **Add user → Create new user** untuk tiap baris berstatus `create-user`; gunakan email dan password persis dari file, lalu biarkan **Auto confirm user** aktif.

Akun AJENG NANDINI RIDWAN sudah ada. Buka detail akun itu, pilih **Send password recovery**, lalu tetapkan password dari daftar kredensial saat membuka tautan pemulihan. Jika mailbox email roster tidak dapat menerima email pemulihan, gunakan provisioning server-side di atas sebagai gantinya.

Setelah seluruh akun dibuat atau diatur ulang, jalankan [`supabase/seed-school-accounts.sql`](./supabase/seed-school-accounts.sql) di SQL Editor. Seed mencocokkan email Auth yang ada untuk menyetel nama dan role (`teacher` untuk guru, `student` untuk siswa); ia tidak membuat akun Auth.

## 5. Jalankan dan uji

```powershell
npm run dev
```

Uji satu akun guru dan satu akun siswa: terbitkan materi/kuis dan buka sesi presensi sebagai guru, lalu pastikan akun siswa dapat melihat konten yang sama, mengirim jawaban, dan mencatat kehadiran. Hasil serta presensi tiap siswa hanya terlihat oleh siswa terkait dan guru yang memiliki sesi/kuis.

Untuk menguji CMS, buat materi draf, tambahkan format dan gambar/PDF, simpan, lalu edit dan terbitkan. Pastikan siswa tidak dapat melihat draf, dapat melihat materi terbit, gambar, serta membuka lampiran; setelah materi ditarik atau dihapus, tautan penyimpanannya tidak lagi diberikan oleh portal.
