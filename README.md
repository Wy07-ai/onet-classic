# onet-classic

Game Onet Classic (Phaser 3 + Vite).

[![CI](https://github.com/Wy07-ai/onet-classic/actions/workflows/ci.yml/badge.svg)](https://github.com/Wy07-ai/onet-classic/actions/workflows/ci.yml)
[![E2E](https://github.com/Wy07-ai/onet-classic/actions/workflows/e2e.yml/badge.svg)](https://github.com/Wy07-ai/onet-classic/actions/workflows/e2e.yml)
[![codecov](https://codecov.io/gh/Wy07-ai/onet-classic/branch/main/graph/badge.svg)](https://codecov.io/gh/Wy07-ai/onet-classic)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![License](https://img.shields.io/github/license/Wy07-ai/onet-classic)](LICENSE)

## Menjalankan

```bash
npm install
npm run dev
```

Server development: **http://localhost:5173**

> **Penting:** Jangan commit `node_modules/` atau `dist/`. Pastikan `.gitignore` sudah aktif. Jika `node_modules` masih terlacak di repo, hapus dari indeks:
> ```bash
> git rm -r --cached node_modules
> git commit -m "chore: stop tracking node_modules"
> ```

## Perintah NPM

| Perintah | Fungsi |
| -------- | ------ |
| `npm run dev` | Server pengembangan Vite (HMR) |
| `npm run build` | Build produksi → `dist/` |
| `npm run preview` | Preview hasil build |
| `npm test` | Semua unit test logika |
| `npm run test:coverage` | Test + laporan coverage (c8) |
| `npm run test:e2e` | Playwright E2E (canvas smoke test) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) |
| `npm run format:check` | Prettier (check only) |
| `npm run check:assets` | Validasi aset audio/SVG + ukuran bundle |
| `npm run ci` | Lint + format check + test coverage + build + assets |

## Deploy ke Vercel

Impor repositori GitHub `Wy07-ai/onet-classic` dari dashboard Vercel. Konfigurasi di
`vercel.json` akan memasang dependensi dengan `npm ci`, menjalankan `npm run build`,
dan menerbitkan hasil build dari direktori `dist`. Setelah impor pertama, Vercel
akan otomatis membuat deployment baru setiap kali perubahan di-push ke GitHub.

Preview deployment untuk setiap PR juga tersedia lewat integrasi Vercel (komentar di PR).

## CI & kualitas kode

- **GitHub Actions** (`.github/workflows/ci.yml`): pada setiap push/PR ke `main` menjalankan `npm ci` → lint → test + coverage → build → health check aset, di Node 18/20/22.
- **E2E** (`.github/workflows/e2e.yml`): build + Playwright smoke test (canvas muncul, tanpa console error) pada setiap push/PR ke `main`.
- **Dependabot** (`.github/dependabot.yml`): update mingguan untuk npm dan GitHub Actions.
- **Release**: tag `v*` memicu workflow release notes otomatis.
- Coverage diunggah ke Codecov (badge di atas).

## Tes E2E (Playwright)

Smoke test memastikan canvas game terinisialisasi dengan ukuran positif dan tidak ada `console.error` saat halaman dimuat.

**Dev mode** — jalankan di dua terminal:

```bash
# Terminal A
npm run dev

# Terminal B
npx playwright test --config=playwright.config.cjs
```

**Preview build** — untuk menguji hasil produksi seperti CI:

```bash
npm run build
npm run preview -- --port=4173
npx playwright test
```

Pastikan Chromium Playwright tersedia terlebih dahulu dengan `npx playwright install chromium`. CI menjalankan E2E otomatis pada setiap pull request dan push ke `main`, menggunakan preview di port 4173. Jika port 4173 sedang dipakai, hentikan proses yang memakai port tersebut atau atur `PW_PORT` dan `PW_SERVER_COMMAND` secara konsisten. Jika canvas tidak muncul, periksa output build dan permintaan aset di browser/Playwright; jangan mengubah logika game hanya untuk meloloskan smoke test.


## Fase 3 — Gameplay & UI

- **Timer bar** di atas papan; waktu habis -> `GameOverScene` (kalah) membawa `{ win, score, timeLeft, level }`.
- **Skor**: +100 per pasangan, +3 detik bonus waktu (maks. tidak melebihi batas waktu level).
- **Shuffle** (3x per game) & **Petunjuk** (hint: pasangan valid berkedip, tanpa batas).
- **Menang**: papan bersih -> `GameOverScene` dengan pesan menang + skor akhir.
- **Auto-check**: bila tidak ada pasangan valid, papan diacak otomatis (tidak memakai jatah Shuffle).

Angka gameplay umum ada di `GAMEPLAY`, konfigurasi tiap level ada di `LEVELS` (`src/constants.js`).

## Fase 4 — Pause, Audio & Level

**Pause / Audio**
- Tombol **PAUSE** (kiri atas) atau tekan **ESC / P** -> `PauseScene` tampil sebagai modal di atas `GameScene`
  (`GameScene` di-pause: timer, tween, dan input berhenti). Isi modal: **Lanjutkan**, **Restart Level**, **Menu Utama**.
- Toggle **MUSIK** (BGM) dan **SFX** terpisah, ada di HUD (kiri bawah) dan di modal pause.
  Status mute disimpan di `game.registry` (`src/utils/audioSettings.js`), jadi tetap berlaku antar level & scene.
- Restart Level mengulang level yang sedang dimainkan dengan skor kembali ke nilai di awal level.

**Level bertingkat** (`LEVELS` di `src/constants.js`)

| Level | Grid  | Waktu | Jenis tile |
|-------|-------|-------|------------|
| 1     | 6x10  | 120 s | 12         |
| 2     | 8x12  | 110 s | 16         |
| 3     | 8x14  | 100 s | 20         |
| 4     | 10x14 | 90 s  | 24         |
| 5     | 10x16 | 80 s  | 24         |

- Papan bersih -> modal **LEVEL X SELESAI** -> tombol / ENTER menuju level berikutnya (skor terbawa, shuffle di-reset).
- Menyelesaikan level terakhir -> `GameOverScene` (menang). Tambah level baru cukup dengan menambah entri di `LEVELS`.
- Ukuran tile dihitung otomatis (`src/utils/boardLayout.js`) agar papan besar tetap muat di layar.
- Indikator **LEVEL X** ada di HUD, di sebelah kanan skor.

## Fase 5 — Shift Mechanic & High Score

**Mekanik pergeseran tile** (`applyShift` di `src/utils/boardGenerator.js`, animasi di `GameScene.shiftTiles` + `Tile.moveTo`)

Setelah sepasang tile dicocokkan, tile yang tersisa bergeser mengisi ruang kosong dengan tween halus
(input dikunci sampai animasi selesai). Mode diatur per level lewat properti `shift` di `LEVELS`:

| Level | Mode `shift`          | Efek                                           |
|-------|-----------------------|------------------------------------------------|
| 1-2   | `none`                | klasik, tidak bergeser                         |
| 3     | `down`                | gravitasi: tile di atas jatuh ke bawah         |
| 4     | `left`                | tile dirapatkan ke kiri                        |
| 5     | `center`              | tile tiap baris dirapatkan ke tengah           |

Mode lain yang tersedia: `right`. Urutan tile dalam satu baris/kolom selalu terjaga (tidak ada tile saling melewati).
Nama mode tampil sebagai subjudul saat banner level muncul. Bila setelah bergeser tidak ada pasangan valid, papan diacak otomatis.

**High Score** (`src/utils/highScore.js`)
- Disimpan di `localStorage` dengan key `onet_high_score`; aman bila storage diblokir/rusak.
- Dicek saat Game Over **maupun** Win (`GameOverScene`); hanya tersimpan jika skor > rekor lama.
- `High Score: X` tampil di `MenuScene` dan `GameOverScene`; rekor baru memunculkan teks animasi **NEW HIGH SCORE!** + confetti.

## Fase 6 — Level Select & UI Polish

**Level Select** (`src/scenes/LevelSelectScene.js`)
- Menu Utama punya tombol **SELECT LEVEL** (shortcut `L`); layar pilihan level punya tombol **BACK** (`ESC`).
- Grid kartu level (`src/utils/levelGrid.js`): level terkunci berikon gembok, level selesai bercentang, level tertinggi yang terbuka berbingkai emas.
- Progres disimpan di `localStorage` key `onet_unlocked_level` (`src/utils/levelProgress.js`). Menyelesaikan level N membuka level N+1;
  progres tidak pernah turun, dibatasi `MAX_LEVEL`, aman bila storage diblokir/rusak (cadangan memori selama sesi).

**UI Polish**
- Latar bertema (`src/utils/background.js`) dipakai di Menu, Level Select, dan Game Over.
- Semua tombol (`createButton`, tombol HUD) punya efek hover/press: scale tween + tint warna; klik batal bila pointer dilepas di luar tombol.
- `GameOverScene`: panel berisi skor akhir (count-up), indikator rekor, statistik (level, pasangan, sisa waktu), tombol **PLAY AGAIN** / **MAIN MENU**.

## Tema Map

Pilih tema di menu utama sebelum bermain:

- **Wajah** — emoji wajah bulat.
- **Negara** — bendera dari 24 negara.
- **Makanan & Minuman** — emoji makanan dan minuman.

Tema yang dipilih disimpan di browser dan digunakan untuk semua level, termasuk saat memilih level tertentu atau mengulang level.

## Tes

```bash
npm test
npm run test:coverage   # + laporan di coverage/
```

Atau jalankan satu per satu: `node tests/levelprogress.test.mjs`, `node tests/levelgrid.test.mjs`, dst.

## Dokumentasi lanjutan

- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, alur PR, gaya kode, debugging
- [ARCHITECTURE.md](ARCHITECTURE.md) — desain teknis untuk maintainers
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — masalah umum (port, audio, cache)
- [ROADMAP.md](ROADMAP.md) — rencana fitur
- [SECURITY.md](SECURITY.md) — pelaporan celah keamanan
