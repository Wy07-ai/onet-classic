// Konstanta global game Onet Classic
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

// Ukuran papan (bagian isi, TANPA border kosong)
export const BOARD_ROWS = 8;
export const BOARD_COLS = 12;

// Ukuran satu sel (px). Border kosong di sekeliling papan ikut digambar sebagai ruang jalur.
export const CELL_SIZE = 60;
export const TILE_SIZE = 52;

// Parameter gameplay (Fase 3) — ubah di sini untuk menyetel tingkat kesulitan
export const GAMEPLAY = {
  TIME_LIMIT: 240, // detik total (juga batas atas waktu setelah bonus)
  MATCH_SCORE: 100, // poin per pasangan cocok
  MATCH_TIME_BONUS: 3, // detik tambahan per pasangan cocok
  SHUFFLE_LIMIT: 3, // jatah tombol Shuffle per game (auto-shuffle tidak mengurangi jatah)
};

export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
};

export const COLORS = {
  background: 0x0b1020,
  boardBg: 0x131a33,
  highlight: 0xffe066,
  hint: 0x00e5ff,
  line: 0xff4d6d,
};
