# Roadmap Onet Classic

Dokumen ini memuat arah pengembangan fitur **Onet Classic** setelah rilis [v1.0.0](CHANGELOG.md). Isinya adalah **rencana dan gagasan**, bukan janji rilis: urutan, cakupan, dan waktu dapat berubah sesuai masukan komunitas dan kapasitas kontributor.

Ingin membantu? Lihat [CONTRIBUTING.md](CONTRIBUTING.md), lalu buka issue untuk mendiskusikan item yang Anda minati sebelum mulai mengerjakan.

## Status Saat Ini (v1.0.0)

Sudah tersedia: gameplay inti dengan pathfinding maks. 2 belokan, 5 level bertingkat, mekanik pergeseran tile (`down`, `left`, `center`, dan `right` yang belum dipakai di level mana pun), Shuffle & Hint, Pause, kontrol audio, high score lokal, pemilihan level dengan progres tersimpan, serta tampilan responsif untuk desktop dan perangkat sentuh.

## Legenda

| Status         | Arti                                               |
| -------------- | -------------------------------------------------- |
| 💡 Gagasan     | Baru diusulkan, belum dirancang                    |
| 📝 Perancangan | Sedang didiskusikan/dirancang                      |
| 🚧 Dikerjakan  | Sudah ada branch/PR                                |
| ✅ Selesai     | Sudah dirilis (dicatat di CHANGELOG)               |

Estimasi usaha: **S** (kecil, beberapa jam–hari), **M** (menengah, beberapa hari–minggu), **L** (besar, beberapa minggu atau lebih).

---

## Fase 1 — Pengayaan Gameplay Lokal

Fokus: menambah variasi permainan tanpa memerlukan server.

### 1.1 Mode Time Attack — 💡 Gagasan · M

Mode permainan alternatif yang berfokus pada kecepatan.

- Satu papan (atau serangkaian papan) dengan **hitung mundur global**; skor didapat dari jumlah pasangan yang diselesaikan sebelum waktu habis.
- Bonus waktu per pasangan dan pengali kombo untuk pasangan beruntun yang cepat.
- Rekor terpisah per mode (mis. `onet_high_score_time_attack`), dengan pola penyimpanan yang sama seperti `highScore.js`.
- Entri baru di Menu Utama untuk memilih mode.

Catatan teknis: logika timer di `GameScene.update` perlu dipisahkan dari konfigurasi level agar bisa dipakai ulang; aturan skor/kombo sebaiknya ditulis sebagai fungsi murni di `src/utils/` agar dapat diuji lewat `npm test`.

### 1.2 Level & Mode Pergeseran Tambahan — 💡 Gagasan · S–M

- Level 6 dan seterusnya (cukup menambah entri di `LEVELS`).
- Memakai mode `right` yang sudah tersedia di `applyShift`, serta mode baru (mis. gravitasi ke atas, pergeseran ke tepi/vertikal-tengah).
- Pengujian tambahan di `tests/shift.test.mjs` untuk setiap mode baru.

### 1.3 Statistik Pemain — 💡 Gagasan · S

- Ringkasan lokal: total permainan, pasangan dicocokkan, level tercepat, dan rekor per level.
- Tampilan sederhana di Menu atau layar baru.

### 1.4 Power-up & Variasi Tile — 💡 Gagasan · M

- Item terbatas (mis. bekukan waktu singkat, hapus satu pasangan).
- Tile spesial (mis. tile yang butuh dua kali pencocokan) sebagai tantangan tambahan di level akhir.

---

## Fase 2 — Identitas Visual & Audio

Fokus: tampilan dan suara yang lebih kaya dan dapat disesuaikan.

### 2.1 Tema Visual Baru — 💡 Gagasan · M

- **Sistem tema**: warna (`COLORS`), latar (`background.js`), dan set tile dapat diganti tanpa mengubah logika game.
- Kandidat tema: Buah, Laut, Antariksa, Mode Gelap/Kontras Tinggi.
- Pemilih tema di Menu Utama; pilihan disimpan di `localStorage`.
- Dukungan lebih dari 24 jenis tile (saat ini `Tile.frameFor` memakai `(value - 1) % 24`) dengan spritesheet tema masing-masing.
- Pertimbangan aksesibilitas: mode ramah buta warna dan kontras tinggi.

Catatan teknis: hindari menyebar nilai warna/kunci tekstur ke banyak berkas; pusatkan definisi tema di satu modul agar mudah ditambah kontributor.

### 2.2 Efek Suara Tambahan — 💡 Gagasan · S–M

- SFX baru: kombo/streak, level selesai, kemenangan, game over, rekor baru, dan klik tombol UI.
- Beberapa varian musik latar yang berganti per level atau per tema.
- Slider volume terpisah untuk musik dan SFX (selain toggle ON/OFF saat ini).
- Menyimpan preferensi audio di `localStorage` (saat ini status mute hanya di memori `game.registry` dan hilang setelah muat ulang).
- Aset baru dapat ditambahkan ke `scripts/generate-audio-assets.mjs` agar tetap dihasilkan secara prosedural, atau memakai berkas berlisensi bebas dengan atribusi yang jelas.

### 2.3 Polesan Animasi & UI — 💡 Gagasan · S

- Animasi transisi level yang lebih kaya dan efek kombo.
- Tutorial singkat (cara bermain) untuk pemain baru.

---

## Fase 3 — Fitur Online

Fokus: kompetisi dan sinkronisasi antar perangkat. Fase ini memerlukan layanan backend dan keputusan keamanan/privasi yang matang.

### 3.1 Leaderboard Global/Online — 💡 Gagasan · L

- Papan peringkat global (dan mingguan) untuk mode klasik dan Time Attack.
- Pengiriman skor ke layanan backend (opsi: layanan terkelola seperti Firebase/Supabase, atau API sendiri).
- Nama tampilan pemain (nick) tanpa kewajiban akun; privasi dan pembatasan data pribadi dijaga seminimal mungkin.
- **Anti-curang**: saat ini skor tersimpan di `localStorage` dan dapat diubah pemain sendiri, sehingga skor dari klien tidak bisa dipercaya begitu saja. Opsi yang perlu dikaji: validasi sisi server (batas skor wajar per level/waktu), pengiriman log aksi untuk diputar ulang (replay) dan diverifikasi, pembatasan laju (rate limit).
- Penanganan offline: antrean skor dan fallback ke high score lokal bila jaringan tidak tersedia.
- Pembaruan [SECURITY.md](SECURITY.md) dan kebijakan privasi sebelum rilis, karena proyek tidak lagi sepenuhnya statis.

### 3.2 Sinkronisasi Progres — 💡 Gagasan · M

- Menyimpan progres level dan statistik ke cloud agar bisa dilanjutkan di perangkat lain (bergantung pada keputusan akun/identitas pada 3.1).

### 3.3 Tantangan Harian — 💡 Gagasan · M

- Papan dengan *seed* yang sama untuk semua pemain pada hari tertentu (fungsi pembuat papan sudah menerima parameter `rng`, sehingga RNG berbasis seed dapat disuntikkan).
- Peringkat harian terpisah.

---

## Fase 4 — Kualitas & Platform

Fokus: keandalan, jangkauan, dan kemudahan berkontribusi. Item di fase ini dapat dikerjakan paralel dengan fase lain.

### 4.1 Infrastruktur — 💡 Gagasan · S–M

- **CI** (mis. GitHub Actions) untuk menjalankan `npm test` dan `npm run build` pada setiap PR.
- Linter/formatter (ESLint + Prettier) dan hook pra-commit untuk Conventional Commits.
- Pengujian end-to-end ringan untuk alur scene (mis. dengan Playwright), melengkapi test logika yang ada.
- Deploy otomatis ke GitHub Pages atau itch.io (konfigurasi `base: './'` sudah mendukung subfolder).

### 4.2 Aksesibilitas & Kontrol — 💡 Gagasan · M

- Navigasi keyboard penuh (pilih tile dengan panah/Enter).
- Opsi mengurangi gerakan (*reduced motion*) untuk animasi dan partikel.
- Dukungan beberapa bahasa (i18n); teks saat ini berbahasa Indonesia dan tersebar di kode scene.

### 4.3 PWA & Offline — 💡 Gagasan · M

- Manifest dan service worker agar game dapat dipasang dan dimainkan offline, dengan strategi pembaruan cache yang jelas (lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md#3-perubahan-tidak-muncul--isu-cache-browser)).

### 4.4 Migrasi ke TypeScript — 💡 Gagasan · L

- Migrasi bertahap, dimulai dari modul logika murni di `src/utils/`, untuk mengurangi bug tipe data dan memudahkan kontributor.

---

## Cara Mengusulkan atau Memprioritaskan

1. Cari issue yang sudah ada; beri 👍 pada item yang Anda inginkan.
2. Bila belum ada, buka issue baru dengan label `enhancement` berisi masalah yang ingin diselesaikan, usulan solusi, dan alternatif yang dipertimbangkan.
3. Item yang matang dan memiliki penanggung jawab akan dipindah ke status **Dikerjakan**, lalu dicatat di [CHANGELOG.md](CHANGELOG.md) saat dirilis.
