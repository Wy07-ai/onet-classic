// Jalankan: node tests/shift.test.mjs
import assert from 'node:assert/strict';
import { SHIFT_MODES, LEVELS } from '../src/constants.js';
import { applyShift, generateBoard, countTiles } from '../src/utils/boardGenerator.js';

const mk = (rows) => [new Array(rows[0].length + 2).fill(0), ...rows.map((r) => [0, ...r, 0]), new Array(rows[0].length + 2).fill(0)];
const inner = (g) => g.slice(1, -1).map((r) => r.slice(1, -1));

// DOWN: tile jatuh ke bawah per kolom, urutan terjaga
{
  const g = mk([[1, 0, 3], [0, 0, 4], [2, 0, 0]]);
  const moves = applyShift(g, SHIFT_MODES.DOWN);
  assert.deepEqual(inner(g), [[0, 0, 0], [1, 0, 3], [2, 0, 4]]);
  assert.equal(moves.length, 3); // 1, 3, dan 4 berpindah; 2 tetap
}
// LEFT / RIGHT / CENTER
{
  const g = mk([[0, 1, 0, 2, 0]]);
  applyShift(g, SHIFT_MODES.LEFT);
  assert.deepEqual(inner(g), [[1, 2, 0, 0, 0]]);
  applyShift(g, SHIFT_MODES.RIGHT);
  assert.deepEqual(inner(g), [[0, 0, 0, 1, 2]]);
  applyShift(g, SHIFT_MODES.CENTER);
  assert.deepEqual(inner(g), [[0, 1, 2, 0, 0]]);
}
// NONE: tidak berubah; mode tak dikenal -> error
{
  const g = mk([[0, 1, 0, 1]]);
  assert.deepEqual(applyShift(g, SHIFT_MODES.NONE), []);
  assert.deepEqual(inner(g), [[0, 1, 0, 1]]);
  assert.throws(() => applyShift(g, 'bogus'));
}
// Properti: jumlah/jenis tile tetap, border kosong, moves konsisten, idempoten
for (const mode of [SHIFT_MODES.DOWN, SHIFT_MODES.LEFT, SHIFT_MODES.RIGHT, SHIFT_MODES.CENTER]) {
  for (let k = 0; k < 200; k++) {
    const g = generateBoard(8, 12, 10);
    for (let i = 0; i < 40; i++) g[1 + Math.floor(Math.random() * 8)][1 + Math.floor(Math.random() * 12)] = 0;
    const before = g.map((r) => r.slice());
    const sorted = (x) => x.flat().filter(Boolean).sort((a, b) => a - b).join();
    const moves = applyShift(g, mode);
    assert.equal(sorted(g), sorted(before));
    assert.equal(countTiles(g), countTiles(before));
    g.forEach((row, r) => row.forEach((v, c) => {
      if (r === 0 || c === 0 || r === g.length - 1 || c === row.length - 1) assert.equal(v, 0);
    }));
    for (const m of moves) {
      assert.equal(before[m.from.r][m.from.c], m.value);
      assert.equal(g[m.to.r][m.to.c], m.value);
      assert.ok(m.from.r === m.to.r || m.from.c === m.to.c, 'gerak harus lurus');
    }
    assert.equal(applyShift(g, mode).length, 0, 'shift kedua tidak boleh menggerakkan apa pun');
  }
}
// Setiap level punya mode shift valid
LEVELS.forEach((lv) => assert.ok(Object.values(SHIFT_MODES).includes(lv.shift)));
console.log('OK — mekanik shift valid.');
