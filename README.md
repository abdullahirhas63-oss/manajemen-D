# Website Kelas Manajemen D (v22)

Website ini sekarang berjalan dengan **server Node.js + database SQLite**. Tidak perlu `npm install` (tanpa dependensi).
Butuh **Node.js 22.13 atau lebih baru**.

## Menjalankan
```
node server.js
```
Buka http://localhost:3000. Pada **run pertama**, terminal menampilkan password awal `siswa` dan `editor`
serta **kode kelas** (catat, password hanya tampil sekali). Untuk menentukan sendiri password awalnya:
```
SISWA_PASSWORD="..." EDITOR_PASSWORD="..." node server.js
```
(`index.html` tidak bisa dibuka langsung dengan klik dua kali; harus lewat server agar database dan login bekerja.)

## Hosting: dua mode, tanpa 404
Website otomatis mendeteksi file `config.json`:
- **Hosting Node.js** (Render, Railway, VPS, dll.; start command `node server.js`): mode penuh dengan database dan keamanan server.
  Set variabel `SISWA_PASSWORD` dan `EDITOR_PASSWORD` di hosting; password admin selalu mengikuti variabel itu (diganti saat restart).
  Pakai disk persisten untuk folder `data/` (atau set `DATA_DIR`) agar database tidak hilang saat deploy ulang. Cek kesehatan: `/healthz`.
- **Hosting statis** (GitHub Pages, Netlify, Vercel, dll.; unggah `index.html`, `config.json`, folder `img/`): mode tanpa server.
  Login admin 1 dan admin 2 tetap bisa (password lama, kini disimpan sebagai hash), tetapi data hanya di browser dan keamanannya terbatas.
  Ganti password mode ini: `node server.js static-hash`, lalu tempel `s:'…',h:'…'` ke `ADM` di `index.html`.
Alamat tak dikenal (`/login`, `/kelas`, `/favicon.ico`) tidak lagi 404: dialihkan ke halaman utama atau dilayani.

## Database
File `data/kelas.db` (SQLite) menyimpan: Mahasiswa, Informasi (UTS/UAS/Tugas), Pengumuman, Buku Kenangan, Struktur kelas,
akun login, sesi, dan **log audit** (siapa mengubah apa dan kapan).
- Setiap perubahan admin 2 langsung tersimpan ke database dan terlihat di semua perangkat.
- Cadangan otomatis tiap 6 jam di `data/backup/` (14 terakhir). Folder `data/` **wajib ikut dipertahankan saat update/pindah hosting**.
- Data lama di browser admin 2 otomatis diunggah ke database saat admin 2 login pertama kali.

## Keamanan
- Login dicek di **server**; password di-hash (scrypt + salt). Tidak ada password di kode website.
- Sesi memakai cookie `HttpOnly` + `SameSite=Strict` (+ `Secure` bila HTTPS), kedaluwarsa 12 jam.
- Hanya **admin 2** yang bisa mengubah data; ditegakkan server (bukan hanya tombol yang disembunyikan). Semua data butuh login untuk dibaca.
- Batas percobaan login (5 gagal = kunci 10 menit per akun+IP), batas pendaftaran, ukuran data dibatasi, kunci data di-whitelist.
- Pembuatan akun mahasiswa butuh **kode kelas** + nama harus ada di daftar mahasiswa. Password minimal 8 karakter.
- Perlindungan CSRF (header khusus + cek Origin), CSP ketat (skrip berbasis hash, tanpa koneksi ke domain lain),
  HSTS, anti-iframe, nosniff, Referrer-Policy, Permissions-Policy. Hanya `index.html` dan `img/` yang disajikan.
- Panel **Audit Keamanan** (admin 2) menampilkan status, kode kelas, dan log aktivitas.

**Pasang di HTTPS** (hosting seperti Render/Railway/VPS + Caddy/Nginx). Jika di belakang proxy HTTPS, set `TRUST_PROXY=1`
agar cookie bertanda Secure dan alamat IP terbaca benar. Opsi lain: `PORT`, `HOST`, `DATA_DIR`, `KODE_KELAS`.

## Perintah admin (terminal)
```
node server.js set-password admin2        ganti password (juga untuk admin1 / nama mahasiswa)
node server.js delete-user "Nama Lengkap" hapus akun mahasiswa (mis. lupa password), bisa daftar ulang
node server.js set-code KODE123           ganti kode kelas
node server.js list-users                 daftar akun
```

## Catatan
- Akun mahasiswa lama (tersimpan di browser) tidak terbawa; mahasiswa perlu **Buat akun** lagi sekali.
- Daftar nama mahasiswa bawaan tetap ada di kode halaman (bukan rahasia); data yang diedit admin hanya ada di database dan butuh login.
- Menu "Buka Claude" sudah dihapus.

## Jarvis AI (Gemini)
Panel **J.A.R.V.I.S.** (tombol bulat kanan bawah, admin 2) menawarkan dua pilihan: **Mengobrol** (Google Gemini) atau **Pelaporan masalah**. Kunci API hanya ada di server.
1. Buat kunci di https://aistudio.google.com ("Get API key").
2. Salin `.env.example` menjadi `.env`, isi `GEMINI_API_KEY`. Di hosting Node.js, isi sebagai variabel lingkungan.
3. Jalankan `node server.js`. Opsional: `GEMINI_MODEL` untuk mengganti model (bawaan `gemini-3.8-flash`).
Tanpa kunci, mode Mengobrol menampilkan pesan bahwa kunci belum diisi. Batas 20 pertanyaan per 10 menit.

## Supaya hasil edit selalu tersimpan (wajib baca)
Edit hanya masuk database bila website dijalankan lewat `node server.js` **dan** folder data ada di disk persisten.
- Hosting statis (GitHub Pages/Netlify/Vercel) = tanpa database; data hanya di browser. Jangan dipakai untuk admin 2.
- Render: unggah proyek ke GitHub, buat "Blueprint" dari `render.yaml`, isi `SISWA_PASSWORD` dan `EDITOR_PASSWORD`. Disk `/var/data` menyimpan `kelas.db`.
- Railway/Fly.io/VPS: pasang Volume lalu set `DATA_DIR` ke folder volume itu (contoh `/data`). `Dockerfile` sudah disediakan.
- Cek: login admin 2, ubah pengumuman, deploy ulang; data harus tetap ada. Chip di pojok menampilkan "Tersimpan di database".

## Vercel (Jarvis AI lewat fungsi serverless)
Vercel tidak menjalankan `node server.js`, jadi chat Jarvis memakai fungsi di folder `api/` (`chat.js`, `jarvis-login.js`).
Di Vercel → Project → Settings → Environment Variables, isi (lalu **Redeploy**):
- `GEMINI_API_KEY` : kunci dari https://aistudio.google.com
- `EDITOR_PASSWORD` : sama persis dengan password login admin 2 di website
- `GEMINI_MODEL` (opsional, bawaan `gemini-3.8-flash`)

`vercel.json` menyalin hanya `index.html`, `config.json`, dan `img/` ke folder `public/` saat build, sehingga `server.js`, README, dll. tidak ikut tampil di internet.
Catatan: di Vercel website tetap mode statis (data admin hanya di browser). Untuk database bersama gunakan Render/Railway/VPS (lihat bagian atas).

## v27: Jarvis → Gemini & visualisasi spreadsheet
- **Mengobrol dengan Jarvis**: setiap pesan yang dikirim akan otomatis membawa Anda ke https://gemini.google.com/app dengan animasi portal (±4 detik, ada tombol **Batal**/Esc). Pesan disalin ke clipboard, tinggal ditempel (Ctrl+V) di Gemini karena Gemini tidak menerima pesan lewat URL. Perintah "buka tiktok/youtube/…" tetap membuka aplikasi seperti biasa.
  Untuk kembali memakai chat Gemini bawaan di dalam website (lewat API), ubah `var GEMINI=true` menjadi `false` di `index.html`.
- **Rekapan kas → Visualisasi Spreadsheet**: tempel link Google Spreadsheet (dibagikan "siapa saja dengan link"), tekan **Visualisasikan**. Kolom pertama dibaca sebagai label, kolom angka dibuat grafik total dan peringkat. Tombol **Kembali ke kas** memulihkan rekap kas.

## v28: tampilan sheet tanpa server + tombol Kembali
- Link spreadsheet di menu Rekapan kini ditampilkan **langsung dari Google** (iframe, tanpa lewat server) lewat tab **Tampilan Sheet**; tab **Grafik & Tabel** tetap tersedia.
- Tombol **← Kembali** di pojok kiri atas Rekapan (juga tombol Back browser/HP dan Esc) kembali ke halaman awal.
- Server mode: CSP `frame-src` kini mengizinkan `docs.google.com`.

## v29: akun, struktur kaca, Rekapan Kas, hosting cPanel
- **Username login**: `siswa` (hanya lihat, dulu admin1) dan `editor` (bisa edit, dulu admin2). Password **tidak berubah**: database lama otomatis
  diganti nama saat server pertama kali dijalankan. Variabel lama `ADMIN1_PASSWORD`/`ADMIN2_PASSWORD` tetap dikenali.
- **Jarvis**: akun siswa dipanggil "Teman Manajemen D"; editor tetap "Boss Stark Abdullah".
- **Struktur**: Dosen Wali tampil terpisah di atas, anggota lain di carousel kaca (glassy).
- **Menu Rekapan Kas** di sidebar membuka rekap langsung (data diambil lewat server, perlu hosting Node.js).

### Pasang di cPanel (Setup Node.js App)
1. Upload semua isi folder ke mis. `/home/USER/kelas` (BUKAN ke public_html), pastikan folder `img/` ikut.
2. cPanel > **Setup Node.js App** > Create Application: pilih **Node.js 22.13+** (wajib, karena memakai SQLite bawaan Node),
   Application root `kelas`, Application URL = domain Anda, Startup file **`app.js`**.
3. Tambahkan Environment variables: `EDITOR_PASSWORD`, `SISWA_PASSWORD`, `TRUST_PROXY=1`, opsional `GEMINI_API_KEY`, `KODE_KELAS`.
4. Klik **Run JS install** (boleh dilewati, tanpa dependensi) lalu **Restart**. Buka domain: jangan lewat file statis di public_html agar database aktif.
5. Folder `data/` (kelas.db + backup) ada di folder aplikasi; ikut dibackup lewat cPanel.
