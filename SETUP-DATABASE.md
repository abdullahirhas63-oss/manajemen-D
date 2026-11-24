# Setup database (Supabase, gratis)
1. Buat project di supabase.com.
2. Authentication → Users → Add user: email + password admin 2 (password inilah yang dipakai login `admin2`). Authentication → Sign In / Providers: matikan "Allow new users to sign up".
3. SQL Editor: tempel isi `supabase-setup.sql` (ganti `GANTI_EMAIL_ADMIN2`), Run.
4. Project Settings → API: salin Project URL dan anon key ke `db-config.js`, isi `adminEmail`.
5. Upload ulang semua file ke hosting. Login admin 2 pertama akan otomatis mengunggah data yang sudah ada di browser itu.
Catatan: saat database aktif, login admin2 diverifikasi Supabase (password admin2 di index.html tidak dipakai lagi; hapus nilainya). Data dapat dibaca publik lewat API; hanya admin2 yang bisa menulis. Konflik: perubahan terakhir menang.


## v17
- Mahasiswa kini bisa diberi foto (admin 2: ✏️ → Pilih foto). Foto dikecilkan otomatis dan disimpan bersama data mahasiswa.
- Perubahan tersimpan otomatis. Dengan database aktif, data ada di Supabase sehingga upload ulang file ke hosting TIDAK menimpa data. Tanpa database, data hanya ada di browser tiap perangkat.
- Tombol ⬇️ Cadangkan / ⬆️ Pulihkan (di bagian Mahasiswa) untuk backup manual.

## v20
- Halaman login punya tab **Masuk** dan **Buat akun**. Akun hanya bisa dibuat untuk nama yang ada di daftar Mahasiswa (nama lengkap, huruf besar/kecil dan spasi ganda tidak masalah). Satu nama = satu akun, password minimal 6 karakter.
- Akun mahasiswa hanya bisa melihat (sama seperti Admin 1). Login memakai nama lengkap + password. Admin 1 dan Admin 2 tidak berubah.
- Password disimpan sebagai hash PBKDF2-SHA256 + salt (bukan teks asli) di browser perangkat itu (kunci `mgmtD-akun-v1`). Akun TIDAK ikut tersinkron ke Supabase, jadi dibuat dan dipakai di perangkat yang sama. Jika nama dihapus dari daftar Mahasiswa, akunnya tidak bisa masuk lagi.
- Menu baru **🤖 Buka Claude** di sidebar membuka https://claude.ai/new di tab baru.
