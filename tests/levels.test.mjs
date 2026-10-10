// Jalankan: node tests/levels.test.mjs
import assert from 'node:assert/strict';
import { BOARD_AREA, GAME_WIDTH, LEVELS, MAX_LEVEL, getLevelConfig } from '../src/constants.js';
import { computeBoardLayout } from '../src/utils/boardLayout.js';
import { generateBoard, countTiles } from '../src/utils/boardGenerator.js';
import { findValidPair } from '../src/utils/pathfinding.js';

assert.equal(MAX_LEVEL, LEVELS.length);
assert.deepEqual([getLevelConfig(1).rows, getLevelConfig(1).cols], [6, 10]);
assert.deepEqual([getLevelConfig(2).rows, getLevelConfig(2).cols], [8, 12]);
assert.equal(getLevelConfig(0), LEVELS[0]);
assert.equal(getLevelConfig(999), LEVELS[MAX_LEVEL - 1]);

LEVELS.forEach((lv, i) => {
  assert.equal((lv.rows * lv.cols) % 2, 0, `level ${i + 1}: jumlah tile harus genap`);

  // Waktu makin kecil, papan makin besar
  if (i > 0) {
    const prev = LEVELS[i - 1];
    assert.ok(lv.timeLimit < prev.timeLimit, `level ${i + 1}: waktu harus < level sebelumnya`);
    assert.ok(lv.rows * lv.cols > prev.rows * prev.cols, `level ${i + 1}: grid harus lebih besar`);
  }

  // Papan muat di area yang tersedia
  const L = computeBoardLayout(lv.rows, lv.cols);
  const pad = L.panelPadding;
  assert.ok(L.y - pad >= BOARD_AREA.top, `level ${i + 1}: papan menabrak HUD atas`);
  assert.ok(L.y + L.height + pad <= BOARD_AREA.bottom, `level ${i + 1}: papan menabrak tombol bawah`);
  assert.ok(L.x - pad >= 0 && L.x + L.width + pad <= GAME_WIDTH, `level ${i + 1}: papan keluar layar`);
  assert.ok(L.tileSize >= 40, `level ${i + 1}: tile terlalu kecil (${L.tileSize}px)`);

  // Board valid & tiap tipe genap
  for (let k = 0; k < 20; k++) {
    const g = generateBoard(lv.rows, lv.cols, lv.tileTypes);
    assert.equal(countTiles(g), lv.rows * lv.cols);
    const counts = new Map();
    g.flat().forEach((v) => v && counts.set(v, (counts.get(v) || 0) + 1));
    for (const n of counts.values()) assert.equal(n % 2, 0);
  }
  console.log(`Level ${i + 1}: ${lv.rows}x${lv.cols}, ${lv.timeLimit}s, tile ${L.tileSize}px`);
});
console.log('OK — konfigurasi level valid.');
