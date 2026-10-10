# onet-classic

Game Onet Classic (Phaser 3 + Vite).

## Menjalankan

    npm install
    npm run dev

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

## Tes logika (tanpa browser)

    node tests/logic.test.mjs
    node tests/levels.test.mjs
