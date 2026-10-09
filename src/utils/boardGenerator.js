import { BOARD_ROWS, BOARD_COLS } from '../constants.js';

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
