# Changelog

Semua perubahan penting pada proyek **Onet Classic** dicatat di berkas ini.

Format mengikuti [Keep a Changelog 1.1.0](https://keepachangelog.com/id-ID/1.1.0/), dan proyek ini menggunakan [Semantic Versioning](https://semver.org/lang/id/).

Jenis perubahan: `Added` (fitur baru), `Changed` (perubahan perilaku), `Deprecated`, `Removed`, `Fixed` (perbaikan bug), `Security`.

## [Unreleased]

Belum ada perubahan. Ide fitur mendatang dicatat di [ROADMAP.md](ROADMAP.md).

---

## [1.0.0] - 2026-10-11

Rilis stabil pertama Onet Classic. Mencakup permainan lengkap dari menu utama hingga layar akhir, dengan 5 level bertingkat, mekanik pergeseran tile, sistem skor tertinggi, dan tampilan responsif untuk desktop maupun perangkat sentuh.

### Added

#### Core Gameplay
- Papan Onet klasik: pemain mencocokkan dua tile bertipe sama yang dapat dihubungkan dengan jalur **maksimal 2 belokan** lewat sel kosong, termasuk di sekeliling papan (border kosong).
- Algoritma pathfinding **BFS per lapisan belokan** dengan state (baris, kolom, arah); selalu menemukan jalur dengan belokan paling sedikit (`src/utils/pathfinding.js`).
- Pembuatan papan acak dengan jumlah tile per jenis selalu genap sehingga papan selalu dapat diselesaikan secara jumlah (`generateBoard`).
- Sistem skor: **+100** per pasangan dan **+3 detik** bonus waktu (tidak melebihi batas waktu level).
- Timer hitung mundur dengan bar waktu; waktu habis berakhir di layar **Game Over**.
- **Shuffle** terbatas **3 kali** per level untuk mengacak tile yang tersisa.
- **Hint**: menyorot satu pasangan valid dengan kedipan (tanpa batas pemakaian).
- **Auto-check**: bila tidak ada pasangan valid, papan diacak otomatis tanpa memakai jatah Shuffle.
- Layar **YOU WIN!** saat seluruh level selesai.

#### Visual Effects
- Garis jalur neon tiga lapis yang menampilkan rute penghubung saat pasangan cocok.
- Ledakan partikel pada kedua tile yang cocok dan teks skor melayang (`+100`).
- Efek tile terpilih, kedip hint, dan getar (shake) saat pilihan salah atau jalur terhalang.
- Latar bertema untuk Menu, Level Select, dan Game Over; tombol dengan efek hover/press (scale + tint).
- Transisi fade antar scene dan banner `LEVEL X` di awal level.
- Teks animasi **NEW HIGH SCORE!** dengan confetti pada layar akhir.

#### Audio Controls
- Musik latar (BGM) berulang dan enam efek suara: klik tile, cocok, salah, hint, shuffle, dan detak jam (10 detik terakhir). Ketujuh berkas WAV dihasilkan secara prosedural lewat `scripts/generate-audio-assets.mjs`.
- Toggle **MUSIK** dan **SFX** terpisah, tersedia di HUD dan menu pause; status berlaku lintas scene dan level.
- BGM berlanjut tanpa putus antar level.
- Pemutaran audio menunggu event unlock browser (kebijakan autoplay).

#### Pause Menu
- Tombol **PAUSE** serta pintasan `ESC` / `P` yang menampilkan modal di atas game; timer, tween, dan input game berhenti selama pause.
- Opsi **Lanjutkan**, **Restart Level** (skor kembali ke nilai di awal level), dan **Menu Utama**.
- Latar modal gelap pekat agar papan tidak dapat diintip saat pause.

#### Level Progression
- **5 level bertingkat** dengan grid makin besar dan waktu makin singkat:

  | Level | Grid    | Waktu | Jenis tile |
  | :---: | ------- | :---: | :--------: |
  | 1     | 6 × 10  | 120 s | 12         |
  | 2     | 8 × 12  | 110 s | 16         |
  | 3     | 8 × 14  | 100 s | 20         |
  | 4     | 10 × 14 | 90 s  | 24         |
  | 5     | 10 × 16 | 80 s  | 24         |

- Modal **LEVEL X SELESAI** dengan tombol/`ENTER` menuju level berikutnya; skor terbawa, jatah Shuffle di-reset.
- Level baru cukup ditambahkan sebagai entri baru di `LEVELS` (`src/constants.js`).
- Ukuran tile dihitung otomatis (`computeBoardLayout`) agar papan besar tetap muat di layar.

#### Shift Mechanic
- Setelah sepasang tile dicocokkan, tile yang tersisa bergeser mengisi ruang kosong dengan animasi tween halus; input dikunci sampai animasi selesai.
- Mode per level (`applyShift` di `src/utils/boardGenerator.js`):
  - Level 1–2: `none` (klasik).
  - Level 3: `down` (gravitasi ke bawah).
  - Level 4: `left` (rapat ke kiri).
  - Level 5: `center` (tiap baris dirapatkan ke tengah).
  - Mode tambahan tersedia: `right`.
- Urutan relatif tile dalam satu baris/kolom selalu terjaga (tile tidak saling melewati).
- Nama mode ditampilkan sebagai subjudul pada banner level.

#### High Score System
- Skor tertinggi disimpan di `localStorage` (key `onet_high_score`), aman bila storage diblokir atau datanya rusak.
- Dicek saat **Game Over maupun Win**; hanya tersimpan jika skor lebih tinggi dari rekor lama.
- `High Score` ditampilkan di Menu Utama dan Game Over, bersama statistik akhir (level, pasangan, sisa waktu).

#### Level Selection
- Layar **SELECT LEVEL** (pintasan `L`) dengan kartu level: terkunci (ikon gembok), selesai (centang), dan level terbuka tertinggi (bingkai emas berdenyut).
- Progres disimpan di `localStorage` (key `onet_unlocked_level`): menyelesaikan level N membuka level N+1; progres tidak pernah turun dan dibatasi `MAX_LEVEL`.
- Cadangan progres di memori bila `localStorage` tidak tersedia.

#### Responsive Scale Optimization
- Kanvas logis 1280 × 720 dengan mode skala `FIT`, dipusatkan di kedua sumbu, memenuhi viewport (`100dvh`) dan menghormati safe-area (notch).
- Area sentuh minimum 84 satuan game untuk semua tombol (≈ 45 px di HP landscape).
- Imbauan memutar ke landscape pada layar potret sempit (dapat ditutup dengan "Tetap main").
- Penahanan scroll, zoom, dan menu konteks bawaan browser pada perangkat sentuh.
- Optimasi performa: bingkai tile dirender sekali sebagai tekstur, objek efek dipakai ulang, dan dekorasi dikurangi di perangkat mobile.

#### Infrastruktur & Kualitas
- Build Vite dengan `base: './'` (siap dihosting di subfolder) dan chunk Phaser terpisah.
- Pembersihan siklus hidup scene (`setupSceneCleanup`) untuk mencegah kebocoran listener antar kunjungan scene.
- Suite pengujian logika berbasis Node (8 berkas, dijalankan dengan `npm test`).

[Unreleased]: https://github.com/OWNER/onet-classic/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/OWNER/onet-classic/releases/tag/v1.0.0
