export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const TILE_SIZE = 64;
export const BOARD_ROWS = 8;
export const BOARD_COLS = 12;

export const GAMEPLAY = {
  pairScore: 100,
  timeBonus: 3,
  shuffles: 3,
};

/**
 * Daftar level. Ukuran grid membesar & batas waktu mengecil seiring naik level.
 * Menyelesaikan level terakhir = menang. Ukuran tile dihitung otomatis
 * (lihat utils/boardLayout.js) supaya papan besar tetap muat di layar.
 * rows * cols harus genap.
 */
export const LEVELS = [
  { rows: 6, cols: 10, timeLimit: 120, tileTypes: 12 },
  { rows: 8, cols: 12, timeLimit: 110, tileTypes: 16 },
  { rows: 8, cols: 14, timeLimit: 100, tileTypes: 20 },
  { rows: 10, cols: 14, timeLimit: 90, tileTypes: 24 },
  { rows: 10, cols: 16, timeLimit: 80, tileTypes: 24 },
];
export const MAX_LEVEL = LEVELS.length;

export function getLevelConfig(level) {
  const index = Math.min(Math.max(1, Math.floor(level)), MAX_LEVEL) - 1;
  return LEVELS[index];
}

// Area (px) tempat papan boleh digambar, di antara HUD atas dan tombol bawah.
export const BOARD_AREA = { top: 104, bottom: 640, sideMargin: 40, panelPadding: 6 };

export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
  PAUSE: 'PauseScene',
};

export const COLORS = {
  background: 0x0b1020,
  panel: 0x16213e,
  primary: 0x4f8cff,
  primaryHover: 0x7aa9ff,
  stroke: 0xffffff,
  accent: 0xffd166,
  danger: 0xef476f,
  line: 0xef476f,
};

export const FONT_FAMILY = 'Arial, Helvetica, sans-serif';