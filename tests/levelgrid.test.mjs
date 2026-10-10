// Jalankan: node tests/levelgrid.test.mjs
import assert from 'node:assert/strict';
import { GAME_HEIGHT, GAME_WIDTH, MAX_LEVEL } from '../src/constants.js';
import { computeLevelGrid } from '../src/utils/levelGrid.js';

const AREA = { left: 40, right: GAME_WIDTH - 40, top: 190, bottom: 610, maxCols: 5, gap: 28 };

function assertFits(count) {
  const g = computeLevelGrid(count, AREA);
  assert.equal(g.positions.length, count);
  for (const [i, p] of g.positions.entries()) {
    const l = p.x - g.cardWidth / 2;
    const r = p.x + g.cardWidth / 2;
    const t = p.y - g.cardHeight / 2;
    const b = p.y + g.cardHeight / 2;
    assert.ok(l >= AREA.left && r <= AREA.right, `n=${count} kartu ${i + 1} keluar area horizontal`);
    assert.ok(t >= AREA.top && b <= AREA.bottom, `n=${count} kartu ${i + 1} keluar area vertikal`);
    assert.ok(b <= GAME_HEIGHT && r <= GAME_WIDTH);
  }
  // Tidak ada kartu yang saling tumpang tindih
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = g.positions[i];
      const b = g.positions[j];
      const overlapX = Math.abs(a.x - b.x) < g.cardWidth;
      const overlapY = Math.abs(a.y - b.y) < g.cardHeight;
      assert.ok(!(overlapX && overlapY), `n=${count} kartu ${i + 1} & ${j + 1} bertumpuk`);
    }
  }
  assert.ok(g.cardWidth >= 100 && g.cardHeight >= 100, `n=${count}: kartu terlalu kecil`);
  return g;
}

// Level yang ada sekarang: satu baris berisi semua level
const now = assertFits(MAX_LEVEL);
assert.equal(now.cols, Math.min(MAX_LEVEL, 5));
assert.equal(now.rows, Math.ceil(MAX_LEVEL / now.cols));
// Dipusatkan secara horizontal
const xs = now.positions.map((p) => p.x);
const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
assert.ok(Math.abs(mid - GAME_WIDTH / 2) < 0.5, 'grid harus di tengah layar');
// Urutan: kiri -> kanan, atas -> bawah
for (let i = 1; i < now.positions.length; i++) {
  const a = now.positions[i - 1];
  const b = now.positions[i];
  assert.ok(b.y > a.y || (b.y === a.y && b.x > a.x), 'urutan kartu harus kiri-kanan lalu atas-bawah');
}

// Jumlah level lain tetap muat (kalau LEVELS ditambah nanti)
for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]) assertFits(n);

// Baris terakhir yang tidak penuh dipusatkan (7 level = 5 + 2)
const seven = computeLevelGrid(7, AREA);
const lastRow = seven.positions.slice(5);
assert.equal(lastRow.length, 2);
assert.ok(Math.abs((lastRow[0].x + lastRow[1].x) / 2 - GAME_WIDTH / 2) < 0.5);

console.log(`OK — layout grid level valid (MAX_LEVEL=${MAX_LEVEL}).`);
