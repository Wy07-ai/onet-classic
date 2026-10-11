# Kebijakan Keamanan

Terima kasih telah membantu menjaga **Onet Classic** dan para penggunanya tetap aman. Dokumen ini menjelaskan versi yang didukung, cara melaporkan celah keamanan, dan apa yang dapat Anda harapkan setelah melapor.

## Versi yang Didukung

Perbaikan keamanan diberikan untuk versi terbaru pada cabang `main`.

| Versi          | Didukung            |
| -------------- | ------------------- |
| 1.0.x (terbaru) | ✅ Ya               |
| < 1.0.0        | ❌ Tidak            |

Kami menyarankan selalu memakai rilis terbaru dan memperbarui dependensi secara berkala.

## Melaporkan Celah Keamanan

**Jangan melaporkan celah keamanan lewat issue, diskusi, atau pull request publik.** Pengungkapan publik sebelum perbaikan tersedia dapat membahayakan pengguna.

Gunakan salah satu saluran privat berikut:

1. **GitHub Private Vulnerability Reporting** (disarankan): buka tab **Security** pada repositori, pilih **Report a vulnerability**. Fitur ini perlu diaktifkan oleh pemilik repositori di *Settings → Code security*.
2. **Surel**: kirim ke **[GANTI-DENGAN-EMAIL-KEAMANAN]** dengan subjek `[SECURITY] Onet Classic - <ringkasan singkat>`.

### Informasi yang Mohon Disertakan

Semakin lengkap laporan, semakin cepat kami dapat menanganinya:

- Jenis dan deskripsi celah, serta dampak yang mungkin terjadi.
- Langkah mereproduksi yang jelas (atau *proof of concept*), beserta berkas/baris kode yang terkait bila diketahui.
- Versi proyek atau *commit*, browser/OS, dan cara Anda menjalankan game (dev server, hasil build, atau situs yang dihosting).
- Saran perbaikan, bila ada.

### Yang Dapat Anda Harapkan

| Tahap                                   | Target waktu*         |
| --------------------------------------- | --------------------- |
| Konfirmasi bahwa laporan diterima       | 3 hari kerja          |
| Penilaian awal (valid/tidak, tingkat keparahan) | 7 hari kerja   |
| Perbaikan dan rilis untuk celah valid   | Sesuai tingkat keparahan, dengan kabar berkala |

\*Target ini adalah itikad baik dari pengelola yang bekerja secara sukarela, bukan jaminan kontrak. Bila Anda tidak mendapat tanggapan, silakan kirim pengingat.

Setelah perbaikan dirilis, kami akan mengumumkan celah tersebut (mis. lewat GitHub Security Advisory dan catatan di [CHANGELOG.md](CHANGELOG.md)) dan, bila Anda berkenan, mencantumkan nama Anda sebagai pelapor.

### Pengungkapan yang Bertanggung Jawab

Kami meminta Anda untuk:

- Memberi kami waktu wajar untuk memperbaiki sebelum mengungkapkan secara publik.
- Tidak mengakses, mengubah, atau menghapus data milik pengguna lain.
- Tidak melakukan serangan yang mengganggu layanan (mis. DoS) pada situs yang dihosting.
- Hanya menguji pada salinan lokal atau akun milik Anda sendiri.

Kami tidak akan menempuh jalur hukum terhadap peneliti yang bertindak dengan itikad baik dan mengikuti pedoman ini. Proyek ini belum menyediakan program imbalan (*bug bounty*) berbayar.

## Cakupan

### Termasuk dalam cakupan

- Kode sumber di repositori ini (`src/`, `scripts/`, `index.html`, konfigurasi build).
- Kerentanan di sisi klien yang berdampak pada pemain, misalnya *cross-site scripting* (XSS), penyuntikan konten lewat data yang dibaca game, atau pemuatan sumber daya dari pihak ketiga yang tidak semestinya.
- Dependensi yang membawa celah dan memengaruhi hasil build proyek (`phaser`, `vite`, dan dependensi turunannya).

### Di luar cakupan

- **Manipulasi data lokal oleh pemain sendiri.** Skor tertinggi dan progres level disimpan di `localStorage` (`onet_high_score`, `onet_unlocked_level`) dan dapat diubah lewat DevTools browser. Ini adalah sifat game lokal tanpa server, bukan celah keamanan. Pada mode dev, `window.__ONET_GAME__` juga sengaja diekspos untuk debugging dan tidak ada pada hasil build produksi.
- Celah pada layanan pihak ketiga tempat game dihosting (GitHub Pages, itch.io, dll.) atau pada browser/OS pengguna.
- Serangan yang memerlukan akses fisik ke perangkat atau akun pengguna yang sudah dikompromikan.
- Laporan otomatis tanpa dampak nyata yang dapat didemonstrasikan (mis. hasil pemindai tanpa verifikasi), serta masukan *best-practice* tanpa celah yang dapat dieksploitasi.

## Gambaran Permukaan Serangan

Untuk membantu penilaian, berikut gambaran singkat keamanan arsitektur saat ini (v1.0.0):

- **Murni sisi klien dan statis**: tidak ada backend, basis data, autentikasi, maupun pengiriman data pengguna ke server.
- **Data pengguna** terbatas pada dua nilai di `localStorage` (angka skor dan angka level). Tidak ada data pribadi yang dikumpulkan.
- **Tidak ada masukan teks bebas dari pemain** yang dirender sebagai HTML; teks UI berasal dari konstanta dan angka di dalam kode.
- **Aset** (gambar dan audio) dimuat dari bundel hasil build yang sama; `index.html` tidak memuat skrip eksternal.
- **Rantai pasokan** (supply chain) adalah risiko utama: kompromi pada paket npm. Lihat saran di bawah.

> Bila fitur online seperti leaderboard diimplementasikan (lihat [ROADMAP.md](ROADMAP.md)), dokumen ini akan diperbarui untuk mencakup API, autentikasi, dan perlindungan data pengguna.

## Praktik Keamanan untuk Kontributor

- Jalankan `npm audit` secara berkala dan perbarui dependensi yang memiliki kerentanan.
- Commit `package-lock.json` dan gunakan `npm ci` pada lingkungan CI/deploy agar versi dependensi konsisten.
- Tambahkan dependensi baru hanya bila benar-benar perlu, periksa reputasi dan lisensinya, dan hindari paket yang tidak terawat.
- Jangan memuat skrip atau aset dari CDN pihak ketiga tanpa diskusi; lebih baik diimpor sebagai dependensi yang terkunci versinya.
- Jangan pernah meng-commit rahasia (token, kunci API, berkas `.env`). Berkas `*.local` sudah diabaikan oleh `.gitignore`.
- Jangan memakai `innerHTML` dengan data yang tidak tepercaya. Jika Anda harus menyentuh DOM (seperti `orientationHint.js`), gunakan konten statis atau `textContent`.

## Kontak

Pertanyaan umum tentang kebijakan ini dapat diajukan lewat kanal yang tercantum di bagian pelaporan di atas. Untuk masalah non-keamanan, gunakan issue biasa dan lihat [CONTRIBUTING.md](CONTRIBUTING.md).
