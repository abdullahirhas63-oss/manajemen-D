# Website Kelas Manajemen D (v22)

Website ini sekarang berjalan dengan **server Node.js + database SQLite**. Tidak perlu `npm install` (tanpa dependensi).
Butuh **Node.js 22.13 atau lebih baru**.

## Menjalankan
```
node server.js
```
Buka http://localhost:3000. Pada **run pertama**, terminal menampilkan password awal `admin1` dan `admin2`
serta **kode kelas** (catat, password hanya tampil sekali). Untuk menentukan sendiri password awalnya:
```
ADMIN1_PASSWORD="..." ADMIN2_PASSWORD="..." node server.js
```
(`index.html` tidak bisa dibuka langsung dengan klik dua kali; harus lewat server agar database dan login bekerja.)

## Hosting: dua mode, tanpa 404
Website otomatis mendeteksi file `config.json`:
- **Hosting Node.js** (Render, Railway, VPS, dll.; start command `node server.js`): mode penuh dengan database dan keamanan server.
  Set variabel `ADMIN1_PASSWORD` dan `ADMIN2_PASSWORD` di hosting; password admin selalu mengikuti variabel itu (diganti saat restart).
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
