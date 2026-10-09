// Konstanta global game Onet Classic
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

// Ukuran papan (bagian isi, TANPA border kosong)
export const BOARD_ROWS = 8;
export const BOARD_COLS = 12;

// Ukuran satu sel (px). Border kosong di sekeliling papan ikut digambar sebagai ruang jalur.
export const CELL_SIZE = 60;
export const TILE_SIZE = 52;

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
  line: 0xff4d6d,
};
