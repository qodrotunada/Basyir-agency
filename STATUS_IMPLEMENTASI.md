# Status Implementasi Basyir Agency vNext.1

## Sudah dibuat dalam source project

- Aplikasi React + Vite dengan kampanye empat episode berbasis satu schema konfigurasi.
- Alur briefing, investigasi lima bukti, puzzle empat potongan, pemilihan tersangka, ringkasan skor, dan checkpoint 10 item.
- Formula skor sesuai spesifikasi: bukti maksimal 500, puzzle maksimal 200, vonis maksimal 300, penalti hint 25 poin per hint, total maksimal 1.000.
- Hint dibatasi tiga kali, target unik, sorotan tiga detik, cooldown lima detik.
- Pembukaan episode berdasarkan penyelesaian kasus dan best mastery minimal 70/100.
- Kamus Detektif, riwayat retrieval, penyimpanan progres, ekspor/impor JSON, backup sebelum replace, validasi, dan pemulihan non-destruktif.
- Reset sesi, reset kampanye, reset kamus, dan reset penuh.
- UI responsif, daftar target alternatif selain hotspot, label bahasa Arab, kontrol keyboard, Escape untuk menutup dialog, fokus dialog, dan reduced motion.
- Unit test untuk skor, guard reducer, unlock, dan validasi konfigurasi.

## Pemeriksaan yang berhasil dijalankan di lingkungan pembuatan

- Validasi konfigurasi: 4 episode, 5 bukti per episode, 3 tersangka per episode dengan satu pelaku, 10 pertanyaan mastery per episode, dan referensi kosakata valid.
- Smoke test alur Episode 1 menghasilkan skor bersih 1.000 dan tiga bintang.
- Smoke test formula dengan satu kesalahan puzzle, satu kesalahan vonis, dan satu hint menghasilkan 825 poin dan dua bintang.
- Pemeriksaan guard fase, validasi snapshot, perhitungan mastery, dan aturan unlock lulus.
- Parser syntax JavaScript dan JSX lulus.

## Masih memerlukan penyelesaian sebelum rilis produksi

- `npm install`, `npm test`, dan `npm run build` belum dapat dijalankan di lingkungan pembuatan karena koneksi ke npm registry gagal pada resolusi DNS. Jalankan ketiganya pada komputer yang memiliki koneksi internet untuk menguji dependency install, test runner, dan production build.
- Belum ada rekaman audio manusia yang diverifikasi. Versi ini memakai speech synthesis perangkat sebagai fallback, jika tersedia.
- Harakat, transliterasi, arti, urutan kalimat, dan semua soal perlu persetujuan guru/penutur Bahasa Arab. Materi tetap berstatus draf sampai persetujuan dicatat.
- Ilustrasi TKP adalah SVG untuk prototipe, bukan aset final. Hotspot tersedia bersama daftar target yang dapat diakses.
- Belum ada backend, akun, database server, atau sinkronisasi cloud. Hal ini mengikuti batas cakupan pada spesifikasi vNext.1.
