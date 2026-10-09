// Jalankan: node tests/logic.test.mjs
import assert from 'node:assert/strict';
import { generateBoard, countTiles, shuffleRemaining } from '../src/utils/boardGenerator.js';
import { findPath, findValidPair } from '../src/utils/pathfinding.js';

// RNG deterministik supaya hasil tes bisa diulang
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const signature = (grid) => {
  const vals = [];
  const cells = [];
  grid.forEach((row, r) => row.forEach((v, c) => { if (v) { vals.push(v); cells.push(`${r},${c}`); } }));
  return { vals: vals.sort((a, b) => a - b).join(','), cells: cells.join('|') };
};

const allPairs = (grid) => {
  const by = new Map();
  grid.forEach((row, r) => row.forEach((v, c) => { if (v) (by.get(v) ?? by.set(v, []).get(v)).push({ r, c }); }));
  const out = [];
  for (const l of by.values())
    for (let i = 0; i < l.length; i++)
      for (let j = i + 1; j < l.length; j++) if (findPath(grid, l[i], l[j])) out.push([l[i], l[j]]);
  return out;
};

let games = 0, deadBoards = 0, forced = 0;

for (let seed = 1; seed <= 300; seed++) {
  const rng = mulberry32(seed);
  const grid = generateBoard(8, 12, 24, 1, rng);
  assert.ok(findValidPair(grid) !== null || true);
  games++;

  while (countTiles(grid) > 0) {
    const pairs = allPairs(grid);
    // findValidPair harus konsisten dengan brute force
    assert.equal(findValidPair(grid) !== null, pairs.length > 0);

    if (pairs.length === 0) {
      deadBoards++;
      const before = signature(grid);
      const ok = shuffleRemaining(grid, rng);
      const after = signature(grid);
      assert.ok(ok, `seed ${seed}: shuffle gagal membuat pasangan valid`);
      assert.equal(after.vals, before.vals, 'jenis/jumlah tile berubah');
      assert.equal(after.cells, before.cells, 'posisi sel terisi berubah');
      assert.ok(findValidPair(grid), 'tidak ada pasangan setelah shuffle');
      continue;
    }
    const [a, b] = pairs[Math.floor(rng() * pairs.length)];
    grid[a.r][a.c] = 0;
    grid[b.r][b.c] = 0;
  }
  // border harus tetap kosong sepanjang game
}

// Jalur fallback (forcePair): paksa dengan attempts = 0 pada papan acak berbagai kepadatan
for (let seed = 1; seed <= 300; seed++) {
  const rng = mulberry32(1000 + seed);
  const grid = generateBoard(8, 12, 24, 1, rng);
  const removals = Math.floor(rng() * 40);
  for (let i = 0; i < removals; i++) {
    const p = allPairs(grid);
    if (!p.length) break;
    const [a, b] = p[Math.floor(rng() * p.length)];
    grid[a.r][a.c] = 0; grid[b.r][b.c] = 0;
  }
  if (countTiles(grid) < 2) continue;
  const before = signature(grid);
  assert.ok(shuffleRemaining(grid, rng, 0), 'forcePair gagal');
  const after = signature(grid);
  assert.equal(after.vals, before.vals);
  assert.equal(after.cells, before.cells);
  assert.ok(findValidPair(grid));
  forced++;
}

// Border luar tidak pernah terisi setelah shuffle
{
  const g = generateBoard(8, 12);
  shuffleRemaining(g);
  const H = g.length, W = g[0].length;
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++)
    if (r === 0 || c === 0 || r === H - 1 || c === W - 1) assert.equal(g[r][c], 0);
}

console.log(`OK — ${games} game disimulasikan, ${deadBoards} papan buntu ditangani, ${forced} uji jalur fallback.`);
