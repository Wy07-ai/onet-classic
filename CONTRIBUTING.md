# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi pada **Onet Classic**! Dokumen ini menjelaskan cara menyiapkan lingkungan lokal, alur kerja Git, standar commit, pengujian, debugging, dan ringkasan arsitektur untuk maintainers.

Dengan berpartisipasi, Anda setuju untuk mematuhi [Kode Etik](CODE_OF_CONDUCT.md).

## Daftar Isi

1. [Cara Berkontribusi](#1-cara-berkontribusi)
2. [Setup Lingkungan Lokal](#2-setup-lingkungan-lokal)
3. [Perintah NPM](#3-perintah-npm)
4. [Alur Kerja Git](#4-alur-kerja-git)
5. [Conventional Commits](#5-conventional-commits)
6. [Menjalankan Unit Test](#6-menjalankan-unit-test)
7. [Linting & Formatting](#7-linting--formatting)
8. [Gaya Kode](#8-gaya-kode)
9. [Debugging](#9-debugging)
10. [Ringkasan Arsitektur untuk Contributors](#10-ringkasan-arsitektur-untuk-contributors)
11. [Asset Pipeline & Audio](#11-asset-pipeline--audio)
12. [Pull Request](#12-pull-request)
13. [Melaporkan Bug & Mengusulkan Fitur](#13-melaporkan-bug--mengusulkan-fitur)

---

## 1. Cara Berkontribusi

Anda dapat membantu lewat:

- Melaporkan bug atau perilaku yang tidak sesuai.
- Mengusulkan fitur (lihat [ROADMAP.md](ROADMAP.md) untuk ide yang sudah ada).
- Memperbaiki bug atau mengimplementasikan fitur.
- Menambah/memperbaiki pengujian dan dokumentasi.

Untuk perubahan besar (fitur baru, perubahan arsitektur), **buka issue terlebih dahulu** agar arah solusinya disepakati sebelum Anda menulis banyak kode. Bacalah [ARCHITECTURE.md](ARCHITECTURE.md) untuk memahami struktur proyek.

> **Celah keamanan** jangan dilaporkan lewat issue publik. Ikuti [SECURITY.md](SECURITY.md).

## 2. Setup Lingkungan Lokal

### Prasyarat

- **Node.js 18 atau lebih baru** (disarankan LTS). Vite 5 tidak mendukung Node di bawah 18.
- **npm** (sudah termasuk Node.js) dan **Git**.

Periksa versi:

```bash
node -v   # >= 18
npm -v
git --version
```

### Langkah

```bash
# 1. Fork repositori di GitHub, lalu clone fork Anda
git clone https://github.com/<username-anda>/onet-classic.git
cd onet-classic

# 2. (Opsional) Tambahkan repositori asli sebagai remote "upstream"
git remote add upstream https://github.com/Wy07-ai/onet-classic.git

# 3. Pastikan node_modules tidak terlacak (jika masih ada di indeks)
git rm -r --cached node_modules 2>/dev/null || true

# 4. Pasang dependensi
npm install

# 5. Jalankan server pengembangan
npm run dev
```

`npm run dev` menjalankan Vite pada **http://localhost:5173** (HMR). Jika port 5173 dipakai, lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md#1-konflik-port-vite--proses-node-menggantung).

Saat mode dev, instance game tersedia di console browser sebagai `window.__ONET_GAME__` untuk debugging.

### Verifikasi cepat setelah setup

```bash
npm test
npm run build
npm run check:assets
npm run lint
```

## 3. Perintah NPM

| Perintah | Fungsi |
| -------- | ------ |
| `npm install` | Memasang dependensi |
| `npm run dev` | Server pengembangan Vite (port 5173) + HMR |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Menyajikan hasil build secara lokal |
| `npm test` | Seluruh unit test logika (9 berkas) |
| `npm run test:coverage` | Test + coverage (c8 → `coverage/`) |
| `npm run lint` | ESLint pada `src/`, `tests/`, `scripts/` |
| `npm run lint:fix` | ESLint dengan auto-fix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI) |
| `npm run check:assets` | Validasi file audio/SVG + ukuran bundle |
| `npm run ci` | Pipeline lokal penuh (lint + format + test + build + assets) |

Regenerasi aset audio (hanya bila mengubah `scripts/generate-audio-assets.mjs`):

```bash
node scripts/generate-audio-assets.mjs
```

## 4. Alur Kerja Git

1. **Sinkronkan** cabang utama dengan upstream:

   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Buat branch** baru dari `main` dengan nama deskriptif:

   ```text
   feat/mode-time-attack
   fix/shift-center-offset
   docs/perbarui-architecture
   refactor/pisahkan-hud
   test/tambah-kasus-pathfinding
   chore/repo-ops-ci
   ```

3. **Kerjakan perubahan** dalam commit kecil dan fokus.
4. **Jalankan** `npm run ci` (atau minimal `npm test` + `npm run build`).
5. **Push** ke fork dan **buka Pull Request** ke `main`.
6. Tanggapi umpan balik reviewer dengan commit tambahan pada branch yang sama.

Aturan umum:

- Jangan commit langsung ke `main`.
- Satu PR = satu tujuan.
- **Jangan commit** `node_modules/`, `dist/`, `coverage/`, atau berkas `*.local` (sudah di `.gitignore`).
- Jangan force-push branch yang sudah ditinjau tanpa memberi tahu reviewer.

## 5. Conventional Commits

Proyek ini memakai [Conventional Commits 1.0.0](https://www.conventionalcommits.org/id/v1.0.0/). Format:

```text
<tipe>(<lingkup opsional>): <deskripsi singkat dalam bentuk perintah>

[isi opsional: apa dan mengapa]

[footer opsional: BREAKING CHANGE: ..., Closes #123]
```

### Tipe commit

| Tipe | Dipakai untuk | Dampak versi (SemVer) |
| ---- | ------------- | --------------------- |
| `feat` | Fitur baru | MINOR |
| `fix` | Perbaikan bug | PATCH |
| `docs` | Dokumentasi saja | - |
| `style` | Format/spasi, tanpa perubahan logika | - |
| `refactor` | Perubahan kode tanpa fitur/bug fix | - |
| `perf` | Peningkatan performa | PATCH |
| `test` | Menambah/memperbaiki pengujian | - |
| `build` | Sistem build/dependensi | - |
| `ci` | Konfigurasi CI | - |
| `chore` | Pekerjaan rutin lain | - |
| `revert` | Membatalkan commit sebelumnya | - |

Lingkup yang disarankan: `pathfinding`, `board`, `shift`, `scene`, `hud`, `audio`, `level`, `score`, `layout`, `build`, `deps`, `ci`.

## 6. Menjalankan Unit Test

Pengujian berupa skrip Node murni (`node:assert/strict`), tanpa framework dan tanpa browser — hanya menguji logika bebas Phaser.

```bash
npm test
npm run test:coverage

# Satu berkas
node tests/logic.test.mjs
node tests/shift.test.mjs
```

Test lulus bila skrip selesai tanpa error (exit 0). `npm test` merangkai berkas dengan `&&`.

### Menambah test

- Letakkan di `tests/<nama>.test.mjs` dan **daftarkan** ke skrip `test` di `package.json`.
- Tulis logika baru sebagai fungsi murni di `src/utils/` (tanpa `import Phaser`).
- Untuk logika acak, gunakan RNG deterministik (parameter `rng`).
- Setiap bug fix sebaiknya disertai test yang gagal sebelum perbaikan.

## 7. Linting & Formatting

- **ESLint** (`.eslintrc.cjs`): aturan dasar + prefer-const, no-var, eqeqeq.
- **Prettier** (`.prettierrc`): single quote, trailing comma es5, printWidth 100, LF.

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

CI menjalankan lint dan format:check pada setiap PR.

## 8. Gaya Kode

- **ES Modules** (`import`/`export`), indentasi 2 spasi, titik koma, tanda kutip tunggal.
- Konstanta gameplay, warna, level, nama scene di `src/constants.js`.
- Scene hanya mengorkestrasi; aturan permainan di `src/utils/`.
- Listener di luar scene **wajib** lewat `setupSceneCleanup` (`cleanup.on/once`).
- Akses `localStorage` dibungkus `try/catch`.
- Komentar dalam bahasa Indonesia; jelaskan *mengapa*, bukan sekadar *apa*.
- Pertahankan 60 FPS di mobile: hindari `Graphics` per frame.

## 9. Debugging

### Di browser (dev)

1. Buka DevTools (F12) → Console.
2. `window.__ONET_GAME__` = instance Phaser.Game.
3. Akses scene aktif: `window.__ONET_GAME__.scene.getScenes(true)`.
4. Registry (mute, dll.): `window.__ONET_GAME__.registry.get('bgmMuted')`.

### Masalah umum

| Gejala | Langkah |
| ------ | ------- |
| Port 5173 dipakai | Lihat TROUBLESHOOTING.md atau `npx kill-port 5173` |
| Audio tidak bunyi | Browser memblokir autoplay; klik di kanvas dulu |
| Cache aset lama | Hard refresh (Ctrl+Shift+R) atau nonaktifkan cache di Network tab |
| Test gagal setelah ubah util | Pastikan import path benar dan tidak ada side-effect Phaser |
| Build gagal di CI | Jalankan `npm run ci` lokal; pastikan Node >= 18 |

### Logika pathfinding / shift

- Unit test di `tests/logic.test.mjs` dan `tests/shift.test.mjs` adalah tempat terbaik untuk mereproduksi kasus edge.
- Gunakan `rng` tetap (mis. `() => 0.5`) agar hasil deterministik.

## 10. Ringkasan Arsitektur untuk Contributors

Detail lengkap ada di [ARCHITECTURE.md](ARCHITECTURE.md). Ringkasan untuk orientasi cepat:

| Area | Lokasi | Catatan |
| ---- | ------ | ------- |
| Pathfinding (BFS 2-turn) | `src/utils/pathfinding.js` | Murni, diuji di Node |
| Generate/shuffle/shift papan | `src/utils/boardGenerator.js` | Murni; `applyShift` mode: none/down/left/right/center |
| High score | `src/utils/highScore.js` | localStorage + fallback memori |
| Progres level | `src/utils/levelProgress.js` | localStorage key `onet_unlocked_level` |
| Layout papan | `src/utils/boardLayout.js` | Ukuran tile dinamis |
| Tema map | `src/utils/mapThemes.js` | Wajah / Negara / Makanan |
| Audio mute | `src/utils/audioSettings.js` | Registry Phaser |
| Scene cleanup | `src/utils/sceneCleanup.js` | Wajib untuk listener |
| Konstanta & level | `src/constants.js` | GAMEPLAY, LEVELS, COLORS, SCENES |
| Scene | `src/scenes/*.js` | Boot → Preload → Menu → LevelSelect → Game → Pause → GameOver |
| Komponen UI | `src/components/Tile.js`, `UIOverlay.js` | |

**Prinsip:** logika murni di `utils/` → scene hanya orkestrasi visual/input/audio.

## 11. Asset Pipeline & Audio

- **Spritesheet tile**: SVG di `src/assets/` (`*-tiles.svg`), frame 96×96, diimpor sebagai modul di PreloadScene agar di-hash Vite.
- **Audio**: WAV di `src/assets/audio/` (bgm, tile-click, match, wrong, hint, shuffle, clock-tick).
- **Generator**: `scripts/generate-audio-assets.mjs` membuat WAV prosedural. Jalankan ulang hanya jika mengubah generator; hasil commit ke repo agar build tidak bergantung pada regenerasi.
- **Health check**: `npm run check:assets` memverifikasi file wajib ada, tidak kosong, dan (setelah build) ukuran bundle JS di `dist/`.

Jangan commit file sementara editor atau export mentah ke `src/assets/` tanpa menyesuaikan PreloadScene dan daftar di `check-assets.mjs`.

## 12. Pull Request

Sebelum membuka PR, pastikan:

- [ ] Branch berasal dari `main` terbaru, nama sesuai konvensi
- [ ] Commit mengikuti Conventional Commits
- [ ] `npm test` lulus dan `npm run build` berhasil
- [ ] `npm run lint` lulus
- [ ] Perubahan dicoba manual di browser (`npm run dev`)
- [ ] Test baru untuk logika baru / bug fix
- [ ] Dokumentasi diperbarui bila perlu
- [ ] Entri `[Unreleased]` di CHANGELOG.md untuk perubahan yang terlihat pemain

Template PR tersedia di `.github/PULL_REQUEST_TEMPLATE.md`.

## 13. Melaporkan Bug & Mengusulkan Fitur

Gunakan template issue:

- **Bug**: `.github/ISSUE_TEMPLATE/bug_report.md`
- **Fitur**: `.github/ISSUE_TEMPLATE/feature_request.md`

Untuk bug, sertakan: langkah reproduksi, expected vs actual, browser/OS, level, dan pesan console.

Periksa [TROUBLESHOOTING.md](TROUBLESHOOTING.md) terlebih dahulu.

Terima kasih telah membantu membuat Onet Classic lebih baik!
