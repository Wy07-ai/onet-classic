# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi pada **Onet Classic**! Dokumen ini menjelaskan cara menyiapkan lingkungan lokal, alur kerja Git, standar commit, dan cara menjalankan pengujian.

Dengan berpartisipasi, Anda setuju untuk mematuhi [Kode Etik](CODE_OF_CONDUCT.md).

## Daftar Isi

1. [Cara Berkontribusi](#1-cara-berkontribusi)
2. [Setup Lingkungan Lokal](#2-setup-lingkungan-lokal)
3. [Perintah NPM](#3-perintah-npm)
4. [Alur Kerja Git](#4-alur-kerja-git)
5. [Conventional Commits](#5-conventional-commits)
6. [Menjalankan Unit Test](#6-menjalankan-unit-test)
7. [Gaya Kode](#7-gaya-kode)
8. [Pull Request](#8-pull-request)
9. [Melaporkan Bug & Mengusulkan Fitur](#9-melaporkan-bug--mengusulkan-fitur)

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

- **Node.js 18 atau lebih baru** (disarankan versi LTS terbaru). Vite 5 tidak mendukung Node di bawah 18.
- **npm** (sudah termasuk dalam Node.js) dan **Git**.

Periksa versi Anda:

```bash
node -v
npm -v
git --version
```

### Langkah

```bash
# 1. Fork repositori di GitHub, lalu clone fork Anda
git clone https://github.com/<username-anda>/onet-classic.git
cd onet-classic

# 2. (Opsional) Tambahkan repositori asli sebagai remote "upstream"
git remote add upstream https://github.com/OWNER/onet-classic.git

# 3. Pasang dependensi
npm install

# 4. Jalankan server pengembangan
npm run dev
```

`npm run dev` menjalankan Vite pada **http://localhost:5173** dan membuka browser otomatis. Perubahan kode dimuat ulang secara instan (HMR). Jika port 5173 sedang dipakai, lihat [TROUBLESHOOTING.md](TROUBLESHOOTING.md#1-konflik-port-vite--proses-node-menggantung).

Saat mode dev, instance game tersedia di console browser sebagai `window.__ONET_GAME__` untuk keperluan debugging.

## 3. Perintah NPM

| Perintah          | Fungsi                                                              |
| ----------------- | ------------------------------------------------------------------- |
| `npm install`     | Memasang dependensi                                                 |
| `npm run dev`     | Server pengembangan Vite (port 5173) dengan HMR                     |
| `npm run build`   | Build produksi ke folder `dist/`                                    |
| `npm run preview` | Menyajikan hasil build secara lokal untuk verifikasi                |
| `npm test`        | Menjalankan seluruh unit test logika (8 berkas)                     |

Regenerasi aset audio (hanya bila Anda mengubah `scripts/generate-audio-assets.mjs`):

```bash
node scripts/generate-audio-assets.mjs
```

## 4. Alur Kerja Git

1. **Sinkronkan** cabang utama dengan upstream:

   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Buat branch** baru dari `main` dengan nama deskriptif memakai prefiks sesuai jenis perubahan:

   ```text
   feat/mode-time-attack
   fix/shift-center-offset
   docs/perbarui-architecture
   refactor/pisahkan-hud
   test/tambah-kasus-pathfinding
   ```

3. **Kerjakan perubahan** dalam commit-commit kecil dan fokus.
4. **Jalankan `npm test`** dan pastikan `npm run build` berhasil.
5. **Push** ke fork Anda dan **buka Pull Request** ke `main`.
6. Tanggapi umpan balik reviewer dengan menambah commit pada branch yang sama.

Aturan umum:

- Jangan commit langsung ke `main`.
- Satu PR = satu tujuan. Hindari mencampur perbaikan bug dengan refactor besar.
- Jangan commit `node_modules/`, `dist/`, atau berkas `*.local` (sudah diabaikan `.gitignore`).
- Jangan menulis ulang (force-push) riwayat branch yang sudah ditinjau tanpa memberi tahu reviewer.

## 5. Conventional Commits

Proyek ini memakai [Conventional Commits 1.0.0](https://www.conventionalcommits.org/id/v1.0.0/). Format:

```text
<tipe>(<lingkup opsional>): <deskripsi singkat dalam bentuk perintah>

[isi opsional: apa dan mengapa]

[footer opsional: BREAKING CHANGE: ..., Closes #123]
```

### Tipe commit

| Tipe        | Dipakai untuk                                                         | Dampak versi (SemVer) |
| ----------- | --------------------------------------------------------------------- | --------------------- |
| `feat`      | Fitur baru                                                            | MINOR                 |
| `fix`       | Perbaikan bug                                                         | PATCH                 |
| `docs`      | Perubahan dokumentasi saja                                            | -                     |
| `style`     | Format/spasi/titik koma, tanpa perubahan logika                       | -                     |
| `refactor`  | Perubahan kode tanpa menambah fitur atau memperbaiki bug              | -                     |
| `perf`      | Peningkatan performa                                                  | PATCH                 |
| `test`      | Menambah atau memperbaiki pengujian                                   | -                     |
| `build`     | Perubahan sistem build/dependensi (Vite, `package.json`)              | -                     |
| `ci`        | Perubahan konfigurasi CI                                              | -                     |
| `chore`     | Pekerjaan rutin lain yang tidak mengubah kode sumber/test             | -                     |
| `revert`    | Membatalkan commit sebelumnya                                         | -                     |

Perubahan yang memutus kompatibilitas ditandai dengan `!` setelah tipe/lingkup atau footer `BREAKING CHANGE:` (dampak MAJOR).

### Lingkup yang disarankan

`pathfinding`, `board`, `shift`, `scene`, `hud`, `audio`, `level`, `score`, `layout`, `build`, `deps`.

### Contoh

```text
feat(shift): tambah mode shift 'right' pada level 6
fix(pathfinding): cegah jalur menembus tile yang menghalangi
fix(audio): tunda BGM sampai browser membuka kunci audio
docs: perbarui diagram scene di ARCHITECTURE.md
refactor(hud): pisahkan pembuatan tombol dari UIOverlay
test(shift): tambah kasus baris kosong pada mode center
perf(tile): gambar bingkai tile sekali sebagai tekstur
build(deps): naikkan vite ke 5.4.x
feat(level)!: ubah format konfigurasi LEVELS

BREAKING CHANGE: properti `time` pada LEVELS diganti menjadi `timeLimit`.
```

Tips penulisan:

- Gunakan huruf kecil pada tipe dan deskripsi; tanpa titik di akhir baris pertama.
- Baris pertama maksimal ~72 karakter.
- Tulis dalam bentuk perintah ("tambah", "perbaiki"), bukan lampau ("menambahkan", "sudah memperbaiki").
- Tautkan issue di footer: `Closes #12`.

## 6. Menjalankan Unit Test

Pengujian berupa skrip Node murni yang memakai `node:assert/strict` (tanpa framework dan tanpa browser) dan hanya menguji logika yang bebas Phaser.

```bash
# Jalankan semua test
npm test

# Jalankan satu berkas saja
node tests/logic.test.mjs
node tests/shift.test.mjs
node tests/highscore.test.mjs
node tests/levelprogress.test.mjs
node tests/levelgrid.test.mjs
node tests/levels.test.mjs
node tests/layout.test.mjs
node tests/cleanup.test.mjs
```

Sebuah test dianggap **lulus** bila skrip selesai tanpa melempar error (kode keluar 0). `npm test` merangkai seluruh berkas dengan `&&`, jadi proses berhenti pada kegagalan pertama.

### Menambah test

- Letakkan di `tests/<nama>.test.mjs` dan **daftarkan** ke skrip `test` di `package.json` (tambahkan `&& node tests/<nama>.test.mjs`); berkas yang tidak terdaftar tidak ikut `npm test`.
- Tulis logika baru sebagai fungsi murni di `src/utils/` (tanpa `import Phaser`) agar mudah diuji di Node.
- Untuk logika acak, gunakan RNG deterministik (parameter `rng`) agar hasil dapat diulang.
- Setiap bug yang diperbaiki sebaiknya disertai test yang gagal sebelum perbaikan dan lulus sesudahnya.
- Kode yang bergantung pada Phaser (tampilan, tween, input) diverifikasi manual di browser; cantumkan langkah verifikasinya di deskripsi PR.

## 7. Gaya Kode

- **ES Modules** (`import`/`export`), indentasi 2 spasi, titik koma, dan tanda kutip tunggal sesuai gaya kode yang sudah ada.
- Konstanta gameplay, warna, level, dan nama scene ditaruh di `src/constants.js`; hindari angka "ajaib" yang tersebar.
- Scene hanya mengorkestrasi; aturan permainan berada di `src/utils/`.
- Setiap listener pada emitter di luar scene (`scene.events`, `scene.sound`, `registry`, dst.) **wajib** didaftarkan lewat `setupSceneCleanup` (`cleanup.on/once`) agar tidak menumpuk antar kunjungan scene.
- Akses `localStorage` harus dibungkus `try/catch` (lihat `highScore.js` dan `levelProgress.js`).
- Komentar ditulis dalam bahasa Indonesia agar konsisten dengan kode yang ada. Jelaskan *mengapa*, bukan sekadar *apa*.
- Pertahankan 60 FPS pada perangkat mobile: hindari membuat objek `Graphics` per frame, pakai ulang objek bila memungkinkan.

## 8. Pull Request

Sebelum membuka PR, pastikan:

- [ ] Branch berasal dari `main` terbaru dan diberi nama sesuai konvensi.
- [ ] Commit mengikuti Conventional Commits.
- [ ] `npm test` lulus dan `npm run build` berhasil.
- [ ] Perubahan sudah dicoba manual di browser (`npm run dev`), idealnya juga di tampilan sentuh/ponsel.
- [ ] Test baru ditambahkan untuk logika baru atau bug yang diperbaiki.
- [ ] Dokumentasi diperbarui bila perlu (`ARCHITECTURE.md`, `README.md`, dsb.).
- [ ] Entri ditambahkan di bagian `[Unreleased]` pada [CHANGELOG.md](CHANGELOG.md) untuk perubahan yang terlihat oleh pemain.

Deskripsi PR sebaiknya memuat: **apa** yang berubah, **mengapa**, cara memverifikasinya, dan tangkapan layar/GIF untuk perubahan visual.

## 9. Melaporkan Bug & Mengusulkan Fitur

Saat membuka issue bug, sertakan:

- Langkah untuk mereproduksi, hasil yang diharapkan, dan hasil sebenarnya.
- Browser & versinya, sistem operasi, serta jenis perangkat (desktop/ponsel).
- Level yang sedang dimainkan dan tangkapan layar atau pesan error dari console browser.

Periksa [TROUBLESHOOTING.md](TROUBLESHOOTING.md) terlebih dahulu, karena masalah umum (port, audio, cache) biasanya sudah ada solusinya.

Terima kasih telah membantu membuat Onet Classic lebih baik!
