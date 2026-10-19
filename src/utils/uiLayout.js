import { GAME_HEIGHT, GAME_WIDTH, TOUCH } from '../constants.js';

/**
 * Tata letak tombol (satuan game 1280x720) terpusat di satu tempat supaya
 * jarak antar tombol bisa diuji otomatis (tests/layout.test.mjs).
 *
 * Tiap tombol: { x, y, width, height, fontSize } dengan (x, y) = titik tengah.
 * Area sentuh nyata = ukuran visual, diperlebar sampai minimal TOUCH.minTarget
 * (lihat hitRect) — jadi jarak antar tombol harus cukup untuk area sentuhnya,
 * bukan hanya untuk gambarnya.
 */
const CX = GAME_WIDTH / 2;
const CY = GAME_HEIGHT / 2;

export const HUD_LAYOUT = {
  pause: { x: 118, y: 50, width: 168, height: 56, fontSize: 22 },
  menu: { x: 1162, y: 50, width: 168, height: 56, fontSize: 22 },
  bgm: { x: 118, y: 678, width: 176, height: 56, fontSize: 20 },
  sfx: { x: 318, y: 678, width: 176, height: 56, fontSize: 20 },
  shuffle: { x: 905, y: 678, width: 220, height: 56, fontSize: 24 },
  hint: { x: 1141, y: 678, width: 210, height: 56, fontSize: 24 },
};

export const MENU_LAYOUT = {
  play: { x: CX, y: 398, width: 360, height: 76, fontSize: 38 },
  levelSelect: { x: CX, y: 486, width: 360, height: 64, fontSize: 28 },
  settings: { x: CX, y: 580, width: 360, height: 64, fontSize: 26 },
};

// Panel pengaturan 1160x620 (y 50..670). Urutan vertikal: judul, audio, kesulitan, tema, kembali.
export const SETTINGS_PANEL = { x: CX, y: CY, width: 1160, height: 620 };
export const SETTINGS_LAYOUT = {
  close: { x: 1110, y: 90, width: 64, height: 64, fontSize: 28 },
  bgm: { x: CX - 230, y: 196, width: 380, height: 60, fontSize: 22 },
  sfx: { x: CX + 230, y: 196, width: 380, height: 60, fontSize: 22 },
  // Kartu kesulitan: tiga kartu sama lebar (label + ringkasan aturan), sejajar dengan kartu tema.
  difficultyEasy: { x: CX - 340, y: 322, width: 300, height: 84, fontSize: 26 },
  difficultyNormal: { x: CX, y: 322, width: 300, height: 84, fontSize: 26 },
  difficultyHard: { x: CX + 340, y: 322, width: 300, height: 84, fontSize: 26 },
  // Kartu tema: tiga kartu sama lebar, jarak 40 antar kartu, berada di tengah panel.
  themeFaces: { x: CX - 340, y: 486, width: 300, height: 110, fontSize: 22 },
  themeCountries: { x: CX, y: 486, width: 300, height: 110, fontSize: 22 },
  themeFood: { x: CX + 340, y: 486, width: 300, height: 110, fontSize: 22 },
  back: { x: CX, y: 604, width: 280, height: 56, fontSize: 26 },
};

/** Posisi Y judul seksi & garis pemisah di panel pengaturan (dipakai MenuScene). */
export const SETTINGS_SECTIONS = {
  audioHeading: 146,
  audioDivider: 242,
  difficultyHeading: 262,
  difficultyDivider: 388,
  themeHeading: 410,
  themeDivider: 560,
  version: 654,
};

export const GAME_OVER_LAYOUT = {
  playAgain: { x: CX - 150, y: 588, width: 280, height: 72, fontSize: 28 },
  mainMenu: { x: CX + 150, y: 588, width: 280, height: 72, fontSize: 28 },
};

export const PAUSE_PANEL = { x: CX, y: CY, width: 500, height: 520 };
export const PAUSE_LAYOUT = {
  resume: { x: CX, y: CY - 78, width: 340, height: 64, fontSize: 28 },
  restart: { x: CX, y: CY + 10, width: 340, height: 64, fontSize: 28 },
  menu: { x: CX, y: CY + 98, width: 340, height: 64, fontSize: 28 },
  bgm: { x: CX - 100, y: CY + 186, width: 180, height: 56, fontSize: 20 },
  sfx: { x: CX + 100, y: CY + 186, width: 180, height: 56, fontSize: 20 },
};

export const LEVEL_SELECT_LAYOUT = {
  back: { x: 130, y: GAME_HEIGHT - 48, width: 200, height: 64, fontSize: 28 },
};

export const LEVEL_COMPLETE_LAYOUT = {
  next: { x: CX, y: CY + 90, width: 320, height: 72, fontSize: 34 },
};

/** Area sentuh sebuah tombol: ukuran visual diperlebar sampai minimal `min` di kedua sumbu. */
export function hitRect(spec, min = TOUCH.minTarget) {
  const width = Math.max(spec.width, min);
  const height = Math.max(spec.height, min);
  return { left: spec.x - width / 2, top: spec.y - height / 2, right: spec.x + width / 2, bottom: spec.y + height / 2 };
}

/** Padding (per sisi) yang harus ditambahkan ke ukuran visual agar mencapai area sentuh minimum. */
export function hitPadding(width, height, min = TOUCH.minTarget) {
  return { x: Math.max(0, (min - width) / 2), y: Math.max(0, (min - height) / 2) };
}

/** True bila dua persegi panjang saling tumpang-tindih (sisi bersentuhan tidak dihitung). */
export function rectsOverlap(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
