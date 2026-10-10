import { BOARD_ROWS, BOARD_COLS, SHIFT_MODES } from '../constants.js';
import { findPath, findValidPair } from './pathfinding.js';

/**
 * Generate grid Onet.
 * - Isi papan: rows x cols, nilai 1..typeCount (tiap tipe berjumlah GENAP).
 * - Dibungkus border kosong (0) selebar `border` sel, sehingga ukuran akhir
 *   = (rows + 2*border) x (cols + 2*border). Tile ada di indeks 1..rows / 1..cols.
 *
 * @param {number} rows
 * @param {number} cols
 * @param {number} typeCount jumlah jenis tile (otomatis dibatasi jumlah pasangan)
 * @param {number} border
 * @param {() => number} rng fungsi acak [0,1) (bisa diganti untuk seed/testing)
 */
export function generateBoard(
  rows = BOARD_ROWS,
  cols = BOARD_COLS,
  typeCount = 24,
  border = 1,
  rng = Math.random
) {
  const total = rows * cols;
  if (total % 2 !== 0) {
    throw new Error('rows * cols harus genap agar semua tile bisa dipasangkan');
  }

  const pairs = total / 2;
  const types = Math.max(1, Math.min(typeCount, pairs));

  // Bagikan pasangan ke tiap tipe secara bergantian -> tiap tipe pasti genap
  const tiles = [];
  for (let p = 0; p < pairs; p++) {
    const t = (p % types) + 1;
    tiles.push(t, t);
  }
  shuffle(tiles, rng);

  const h = rows + border * 2;
  const w = cols + border * 2;
  const grid = Array.from({ length: h }, () => new Array(w).fill(0));
  let k = 0;
  for (let r = border; r < border + rows; r++) {
    for (let c = border; c < border + cols; c++) {
      grid[r][c] = tiles[k++];
    }
  }
  return grid;
}

export function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function countTiles(grid) {
  let n = 0;
  for (const row of grid) for (const v of row) if (v !== 0) n++;
  return n;
}

/**
 * Acak ulang tile yang tersisa IN-PLACE: posisi sel terisi tetap, hanya nilainya
 * yang dipertukarkan, jadi jenis & jumlah tile tidak berubah dan border tetap kosong.
 *
 * Hasil dijamin punya minimal 1 pasangan valid (kalau papan memang memungkinkan):
 *  1) coba acak biasa sampai `attempts` kali,
 *  2) kalau gagal terus (papan sangat padat/aneh), paksa satu pasangan sejenis
 *     ditaruh di dua sel yang memang terhubung.
 *
 * @returns {boolean} true jika setelah pengacakan ada pasangan valid
 */
export function shuffleRemaining(grid, rng = Math.random, attempts = 100) {
  const cells = [];
  const values = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== 0) {
        cells.push({ r, c });
        values.push(grid[r][c]);
      }
    }
  }
  if (cells.length < 2) return false;

  const assign = (vals) => cells.forEach((p, i) => (grid[p.r][p.c] = vals[i]));

  for (let k = 0; k < attempts; k++) {
    const vals = shuffle(values.slice(), rng);
    assign(vals);
    if (findValidPair(grid)) return true;
  }
  return forcePair(grid, cells, values, rng, assign);
}

function forcePair(grid, cells, values, rng, assign) {
  // Keterhubungan hanya bergantung pada sel kosong, bukan jenis tile.
  // Jadi uji di grid "semua tile = 1" lalu tempatkan pasangan sejenis di situ.
  const probe = grid.map((row) => row.map((v) => (v !== 0 ? 1 : 0)));
  const counts = new Map();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  const types = [...counts.entries()].filter(([, n]) => n >= 2).map(([t]) => t);
  if (types.length === 0) return false;

  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (!findPath(probe, cells[i], cells[j])) continue;
      const t = types[Math.floor(rng() * types.length)];
      const rest = values.slice();
      rest.splice(rest.indexOf(t), 1);
      rest.splice(rest.indexOf(t), 1);
      shuffle(rest, rng);
      const vals = new Array(cells.length);
      vals[i] = t;
      vals[j] = t;
      let k = 0;
      for (let x = 0; x < cells.length; x++) if (x !== i && x !== j) vals[x] = rest[k++];
      assign(vals);
      return true;
    }
  }
  return false;
}

/**
 * Pergeseran tile (gravitasi) setelah pasangan dihapus. Mengubah `grid` IN-PLACE.
 * Hanya area isi (di dalam border) yang diproses; border tetap kosong.
 * Urutan relatif tile dalam satu baris/kolom selalu dipertahankan, jadi tile
 * tidak pernah saling melewati (aman untuk di-tween).
 *
 * @param {number[][]} grid
 * @param {string} mode salah satu SHIFT_MODES
 * @param {number} border lebar border kosong
 * @returns {{from: {r:number,c:number}, to: {r:number,c:number}, value:number}[]}
 *   daftar tile yang benar-benar berpindah (kosong bila tidak ada / mode none).
 */
export function applyShift(grid, mode = SHIFT_MODES.NONE, border = 1) {
  const moves = [];
  if (!mode || mode === SHIFT_MODES.NONE) return moves;
  const r0 = border;
  const r1 = grid.length - border - 1;
  const c0 = border;
  const c1 = grid[0].length - border - 1;

  // Pindahkan satu garis (kolom/baris) dengan daftar posisi `slots` berurutan.
  // `offset` = indeks slot pertama yang dipakai tile (0 = rapat awal, dst).
  const settle = (slots, offsetFor) => {
    const items = slots.filter(([r, c]) => grid[r][c] !== 0);
    const offset = offsetFor(items.length, slots.length);
    const targets = items.map((_, i) => slots[offset + i]);
    const values = items.map(([r, c]) => grid[r][c]);
    for (const [r, c] of slots) grid[r][c] = 0;
    items.forEach(([r, c], i) => {
      const [tr, tc] = targets[i];
      grid[tr][tc] = values[i];
      if (tr !== r || tc !== c) moves.push({ from: { r, c }, to: { r: tr, c: tc }, value: values[i] });
    });
  };

  const column = (c) => {
    const s = [];
    for (let r = r0; r <= r1; r++) s.push([r, c]);
    return s;
  };
  const row = (r) => {
    const s = [];
    for (let c = c0; c <= c1; c++) s.push([r, c]);
    return s;
  };

  switch (mode) {
    case SHIFT_MODES.DOWN:
      for (let c = c0; c <= c1; c++) settle(column(c), (n, total) => total - n);
      break;
    case SHIFT_MODES.LEFT:
      for (let r = r0; r <= r1; r++) settle(row(r), () => 0);
      break;
    case SHIFT_MODES.RIGHT:
      for (let r = r0; r <= r1; r++) settle(row(r), (n, total) => total - n);
      break;
    case SHIFT_MODES.CENTER:
      for (let r = r0; r <= r1; r++) settle(row(r), (n, total) => Math.floor((total - n) / 2));
      break;
    default:
      throw new Error(`Mode shift tidak dikenal: ${mode}`);
  }
  return moves;
}
