# Pemecahan Masalah (Troubleshooting)

Panduan ini membahas masalah yang paling sering muncul saat mengembangkan atau memainkan **Onet Classic**. Jika masalah Anda tidak tercantum, lihat bagian [Meminta Bantuan](#10-meminta-bantuan).

## Daftar Isi

1. [Konflik port Vite / proses Node menggantung](#1-konflik-port-vite--proses-node-menggantung)
2. [Audio tidak berbunyi (kebijakan autoplay browser)](#2-audio-tidak-berbunyi-kebijakan-autoplay-browser)
3. [Perubahan tidak muncul / isu cache browser](#3-perubahan-tidak-muncul--isu-cache-browser)
4. [Masalah instalasi (`npm install`) dan versi Node](#4-masalah-instalasi-npm-install-dan-versi-node)
5. [High score atau progres level hilang / tidak tersimpan](#5-high-score-atau-progres-level-hilang--tidak-tersimpan)
6. [Layar kosong atau error saat build / hosting](#6-layar-kosong-atau-error-saat-build--hosting)
7. [Tampilan di ponsel (orientasi, ukuran, sentuhan)](#7-tampilan-di-ponsel-orientasi-ukuran-sentuhan)
8. [Performa lambat atau patah-patah](#8-performa-lambat-atau-patah-patah)
9. [`npm test` gagal](#9-npm-test-gagal)
10. [Meminta bantuan](#10-meminta-bantuan)

---

## 1. Konflik port Vite / proses Node menggantung

### Gejala

- Pesan `Error: listen EADDRINUSE: address already in use :::5173`.
- Vite berjalan, tetapi di port lain (mis. `5174`, `5175`), sementara tab lama pada `5173` masih terbuka dan menampilkan versi lama.
- Setelah menutup terminal, `npm run dev` berikutnya tetap bentrok karena proses lama masih hidup.

### Penjelasan

Server dev dikonfigurasi di `vite.config.js` pada port **5173** dengan `open: true`. Karena `strictPort` tidak diaktifkan, bila 5173 terpakai Vite biasanya **otomatis memilih port berikutnya**. Itu aman, tetapi dapat membingungkan karena Anda bisa tanpa sadar melihat tab dari instance lama.

### Solusi A — Gunakan port lain sementara

```bash
npm run dev -- --port 5180
```

### Solusi B — Hentikan proses yang memakai port 5173

**Windows (PowerShell / CMD):**

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID-dari-kolom-terakhir> /F
```

**macOS / Linux:**

```bash
lsof -i :5173            # lihat PID proses
kill <PID>               # minta berhenti dengan baik
kill -9 <PID>            # paksa, hanya bila cara di atas tidak berhasil
```

Alternatif Linux: `ss -ltnp | grep 5173` atau `fuser -k 5173/tcp`.

### Solusi C — Bersihkan proses Node yang menggantung

Hanya lakukan bila Anda yakin tidak ada proses Node penting lain yang berjalan, karena perintah ini menghentikan **semua** proses Node:

```bash
# macOS / Linux
pkill -f vite

# Windows
taskkill /IM node.exe /F
```

### Pencegahan

- Hentikan dev server dengan `Ctrl + C` pada terminal yang sama, bukan hanya menutup jendela terminal.
- Bila ingin gagal tegas ketika port terpakai (bukan pindah port otomatis), jalankan `npm run dev -- --strictPort`.
- Bila `open: true` mengganggu (mis. di server tanpa browser), jalankan `npm run dev -- --open false`.

### Mengakses dari ponsel pada jaringan yang sama

```bash
npm run dev -- --host
```

Buka alamat `Network` yang tampil di terminal. Pastikan firewall mengizinkan koneksi masuk ke port tersebut.

---

## 2. Audio tidak berbunyi (kebijakan autoplay browser)

### Gejala

- Game berjalan normal tetapi musik latar tidak terdengar pada awal permainan.
- Musik baru mulai setelah Anda mengeklik/menyentuh layar.
- Di iOS Safari atau Chrome Android, suara baru muncul setelah sentuhan pertama.

### Penjelasan

Browser modern (Chrome, Safari, Firefox, Edge) **memblokir pemutaran audio otomatis** sebelum ada interaksi pengguna (klik, sentuhan, atau tombol keyboard). Ini kebijakan browser, bukan bug game.

Game menanganinya di `GameScene.startBackgroundMusic()`: bila `this.sound.locked` bernilai `true`, pemutaran BGM ditunda hingga event `unlocked` dari sound manager Phaser dipicu oleh interaksi pertama pemain. Karena pemain harus menekan **PLAY** atau memilih level sebelum masuk ke `GameScene`, biasanya audio sudah terbuka pada saat itu. Gejala ini lebih sering muncul bila halaman dimuat ulang langsung pada scene yang memerlukan audio atau saat browser sangat ketat.

### Daftar pemeriksaan

1. **Klik atau sentuh layar sekali**, lalu tunggu beberapa detik.
2. **Periksa toggle audio.** Tombol **MUSIK** dan **SFX** di HUD/menu pause harus berstatus `ON`. Status mute disimpan di memori dan kembali ke `ON` setelah halaman dimuat ulang.
3. **Periksa volume dan mute di luar game**: volume perangkat, tab browser yang dibisukan (ikon speaker pada tab), serta mode senyap/ringer di iPhone.
4. **Periksa izin situs**: Chrome → ikon gembok di address bar → *Site settings* → *Sound* → `Allow`. Firefox → *Permissions* → *Autoplay* → `Allow Audio`.
5. **Periksa Console** (F12) untuk pesan seperti `The AudioContext was not allowed to start`. Pesan ini normal sebelum interaksi pertama dan akan hilang setelahnya.
6. **Pastikan berkas audio termuat**: buka tab *Network* dan cari berkas `.wav`; status harus `200`. Jika `404`, jalankan ulang `npm run dev` atau regenerasi aset (di bawah).
7. **Coba browser/perangkat lain** untuk membedakan masalah game dengan masalah perangkat.

### Aset audio hilang atau rusak

Aset audio dibuat secara prosedural. Untuk membuat ulang ketujuh berkas WAV:

```bash
node scripts/generate-audio-assets.mjs
```

Berkas ditulis ke `src/assets/audio/` (`bgm.wav`, `tile-click.wav`, `match.wav`, `wrong.wav`, `hint.wav`, `shuffle.wav`, `clock-tick.wav`).

### Catatan untuk pengembang

- Jangan memanggil `sound.play()` pada saat `create()` tanpa memeriksa `sound.locked`; gunakan pola yang sama seperti `startBackgroundMusic()`.
- Jika menambah SFX baru, muat di `PreloadScene` dan putar lewat `playSfx(key)` agar mengikuti status mute dan aman terhadap kunci yang belum termuat.

---

## 3. Perubahan tidak muncul / isu cache browser

### Gejala

- Kode sudah diubah tetapi tampilan game tetap lama.
- Setelah deploy, sebagian pemain masih melihat versi lama atau mengalami error aneh (mis. berkas JS hilang).
- Aset (gambar tile, audio) tidak berubah meski berkas diganti.

### Saat pengembangan (`npm run dev`)

1. **Muat ulang keras** (*hard reload*): `Ctrl + Shift + R` (Windows/Linux) atau `Cmd + Shift + R` (macOS).
2. Buka DevTools (F12) → tab **Network** → centang **Disable cache** (efektif selama DevTools terbuka).
3. Pastikan Anda membuka **port yang benar** (lihat [bagian 1](#1-konflik-port-vite--proses-node-menggantung)); tab lama pada port lain menampilkan instance lama.
4. Bersihkan cache dependensi Vite bila perilaku aneh setelah mengganti dependensi:

   ```bash
   # macOS / Linux
   rm -rf node_modules/.vite
   # Windows (PowerShell)
   Remove-Item -Recurse -Force node_modules\.vite
   ```

   Lalu jalankan ulang `npm run dev`. Opsi lain: `npm run dev -- --force`.
5. Bila HMR tidak memperbarui, muat ulang halaman secara manual.

### Setelah build / deploy (`npm run build`)

Berkas hasil build memakai nama ber-hash, sehingga setiap versi baru otomatis berbeda dari versi lama. Masalah umumnya muncul pada `index.html` yang di-cache:

- Pastikan server/CDN **tidak meng-cache `index.html`** terlalu lama (mis. `Cache-Control: no-cache` untuk `index.html`, dan cache panjang untuk berkas ber-hash di folder aset).
- Setelah deploy, **hapus cache CDN** bila memakai CDN.
- Pemain dapat memuat ulang keras atau membersihkan data situs.
- Galat `Failed to fetch dynamically imported module` atau 404 pada berkas JS ber-hash biasanya berarti halaman lama merujuk berkas yang sudah dihapus dari server; muat ulang halaman.
- Hosting di subfolder (GitHub Pages, itch.io) sudah didukung karena `base: './'`. Jika aset 404, periksa apakah Anda mengunggah **isi folder `dist/`**, bukan folder induknya.

### Service worker (jika nanti ditambahkan)

Game saat ini **tidak** memakai service worker. Bila Anda pernah menjalankan proyek lain pada `localhost:5173` yang memasang service worker, hapus lewat DevTools → *Application* → *Service Workers* → **Unregister**, lalu *Storage* → **Clear site data**.

---

## 4. Masalah instalasi (`npm install`) dan versi Node

| Gejala | Penyebab umum | Solusi |
| ------ | ------------- | ------ |
| `npm: command not found` / `node` tidak dikenali | Node.js belum terpasang atau belum ada di `PATH` | Pasang Node.js LTS dari nodejs.org, buka ulang terminal |
| Error sintaks pada Vite / `Unexpected token`, atau Vite menolak berjalan | Versi Node terlalu lama (Vite 5 membutuhkan Node 18+) | Perbarui Node (`node -v` untuk memeriksa); gunakan `nvm`/`fnm` untuk berpindah versi |
| `EACCES` / izin ditolak saat install | Direktori npm global/izin berkas | Jangan memakai `sudo npm install`; perbaiki izin folder atau gunakan `nvm` |
| `ERESOLVE` / konflik dependensi | Lockfile tidak sinkron atau cache rusak | Hapus `node_modules`, jalankan `npm install` lagi; atau `npm ci` untuk instalasi bersih sesuai `package-lock.json` |
| Instalasi sangat lambat / gagal jaringan | Koneksi atau proxy | Coba ulang, periksa proxy (`npm config get proxy`), atau ganti registry yang dapat diakses |
| Perubahan dependensi tidak terbaca | Cache Vite lama | Lihat langkah hapus `node_modules/.vite` pada [bagian 3](#3-perubahan-tidak-muncul--isu-cache-browser) |

Instalasi bersih sepenuhnya:

```bash
# macOS / Linux
rm -rf node_modules
npm install

# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 5. High score atau progres level hilang / tidak tersimpan

Data disimpan di `localStorage` pada key `onet_high_score` (skor tertinggi) dan `onet_unlocked_level` (level terbuka).

### Penyebab umum

- **Mode privat/incognito**: penyimpanan dihapus saat jendela ditutup, atau bisa diblokir sepenuhnya.
- **Data situs dibersihkan** (pengaturan browser, ekstensi pembersih, atau opsi "hapus data saat browser ditutup").
- **Origin berbeda**: `localhost:5173` dan `localhost:5174` (serta `127.0.0.1`) adalah origin berbeda dengan penyimpanan terpisah. Skor di satu port tidak muncul di port lain. Ini sering terjadi bila port berpindah ([bagian 1](#1-konflik-port-vite--proses-node-menggantung)).
- **Penyimpanan diblokir** oleh kebijakan browser atau pengaturan privasi.

### Perilaku game bila storage tidak tersedia

Game **tidak crash**: high score dianggap `0`, dan progres level disimpan sementara di memori selama sesi berjalan (hilang setelah halaman dimuat ulang).

### Memeriksa dan mengatur ulang (Console browser, F12)

```js
// Lihat nilai saat ini
localStorage.getItem('onet_high_score');
localStorage.getItem('onet_unlocked_level');

// Reset salah satu / keduanya
localStorage.removeItem('onet_high_score');
localStorage.removeItem('onet_unlocked_level');
```

Muat ulang halaman setelah mengubah nilai. Data yang tidak valid (bukan angka atau kurang dari 1) otomatis dibaca sebagai nilai awal (`0` untuk skor, `1` untuk level).

---

## 6. Layar kosong atau error saat build / hosting

| Gejala | Kemungkinan penyebab | Solusi |
| ------ | -------------------- | ------ |
| Layar hitam/kosong, Console menampilkan 404 pada berkas JS/aset | Hasil build diunggah dengan struktur salah | Unggah **isi** `dist/`; pastikan `index.html` dan folder `assets/` sejajar |
| Membuka `dist/index.html` langsung dari berkas (`file://`) tidak berjalan | Modul ES dan pemuatan aset memerlukan server HTTP | Gunakan `npm run preview` atau server statis apa pun |
| Peringatan ukuran chunk saat `npm run build` | Phaser berukuran besar | Normal; batas peringatan sudah dinaikkan ke 1500 kB dan Phaser dipisah ke chunk sendiri |
| `Failed to resolve import ...` | Salah ketik path atau berkas belum ada | Periksa huruf besar/kecil pada nama berkas (penting di Linux/hosting) |
| Berjalan di Windows tetapi gagal di server Linux | Perbedaan huruf besar/kecil nama berkas | Samakan penulisan nama berkas dan `import` |
| Kanvas tidak muncul tetapi tidak ada error | JavaScript dinonaktifkan atau WebGL tidak tersedia | Aktifkan JS/akselerasi hardware; game memakai `Phaser.AUTO` dengan fallback Canvas |

---

## 7. Tampilan di ponsel (orientasi, ukuran, sentuhan)

- **Muncul pesan "Putar perangkat ke mode landscape"**: itu imbauan bawaan untuk layar potret sempit (lebar ≤ 900 px). Putar ke landscape, atau tekan **Tetap main** untuk menutupnya.
- **Papan terasa kecil**: kanvas logis 1280×720 diskalakan mode `FIT`; layar potret membuatnya sangat kecil. Gunakan landscape.
- **Tombol sulit ditekan**: area sentuh sudah diperlebar minimal 84 satuan game. Bila tetap bermasalah, laporkan perangkat dan ukuran layarnya lewat issue.
- **Halaman ikut bergeser/zoom saat disentuh**: ditahan lewat `touch-action: none` dan `position: fixed` pada `index.html`. Bila terjadi, laporkan perangkat/browser yang dipakai.
- **Konten tertutup notch atau bar gestur**: game memakai `env(safe-area-inset-*)`; pastikan browser mendukungnya dan `viewport-fit=cover` tidak diubah.

---

## 8. Performa lambat atau patah-patah

- Tutup tab dan aplikasi berat lain; aktifkan **akselerasi hardware** di pengaturan browser.
- Pada ponsel, game sudah mengurangi dekorasi animasi (`isMobileDevice`). Level besar (mis. 10 × 16 = 160 tile) paling berat; laporkan perangkat dan FPS bila tersendat.
- Selama pengembangan, **kebocoran listener/objek** dapat menurunkan performa seiring waktu. Pastikan setiap listener pada emitter di luar scene didaftarkan lewat `setupSceneCleanup` (`cleanup.on/once`), dan objek yang dibuat dihancurkan di callback pembersihan.
- Hindari membuat objek `Graphics` atau teks baru di dalam `update()`; pakai ulang objek.
- Vite HMR dapat menumpuk instance pada sesi dev yang sangat panjang; muat ulang halaman bila terasa lambat. Game sudah menghancurkan instance lama saat HMR (`game.destroy(true)`).

---

## 9. `npm test` gagal

- Jalankan berkas yang gagal secara terpisah untuk melihat pesan assertion, misalnya `node tests/shift.test.mjs`.
- Pastikan versi Node **18 atau lebih baru** dan Anda menjalankan perintah dari **root proyek** (path import berasal dari `tests/`).
- `npm test` merangkai berkas dengan `&&`, jadi berhenti pada kegagalan pertama; perbaiki, lalu jalankan lagi.
- Jika Anda mengubah `LEVELS` atau tata letak UI, `levels.test.mjs`, `levelgrid.test.mjs`, dan `layout.test.mjs` sengaja ketat (jumlah tile harus genap, kartu/tombol harus muat di layar dan tidak tumpang tindih). Sesuaikan konfigurasi Anda, bukan melonggarkan test tanpa alasan.
- Test baru yang belum didaftarkan di skrip `test` pada `package.json` tidak ikut dijalankan oleh `npm test`.

---

## 10. Meminta bantuan

Bila masalah belum teratasi, buka issue dan sertakan:

1. Langkah mereproduksi masalah, serta hasil yang diharapkan dan yang terjadi.
2. Output `node -v`, `npm -v`, sistem operasi, browser beserta versinya, dan jenis perangkat.
3. Pesan error lengkap dari terminal dan/atau Console browser (F12).
4. Cara Anda menjalankan game (`npm run dev`, `npm run preview`, atau situs yang dihosting) dan level yang dimainkan.

Untuk celah keamanan, **jangan** buka issue publik; ikuti [SECURITY.md](SECURITY.md). Panduan kontribusi ada di [CONTRIBUTING.md](CONTRIBUTING.md).
