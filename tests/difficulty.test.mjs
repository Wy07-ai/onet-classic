// Jalankan: node tests/difficulty.test.mjs
import assert from 'node:assert/strict';
import { GAMEPLAY, LEVELS } from '../src/constants.js';
import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTIES,
  DIFFICULTY_KEY,
  describeDifficulty,
  getDifficulty,
  getPairScore,
  getScaledTimeLimit,
  getSelectedDifficulty,
  setSelectedDifficulty,
} from '../src/utils/difficulty.js';

// --- Definisi ---
assert.deepEqual(
  DIFFICULTIES.map((d) => d.id),
  ['easy', 'normal', 'hard']
);
assert.equal(DEFAULT_DIFFICULTY_ID, 'normal');

// NORMAL harus identik dengan perilaku asli game.
const normal = getDifficulty('normal');
assert.equal(normal.timeMultiplier, 1);
assert.equal(normal.shuffles, GAMEPLAY.shuffles);
assert.equal(normal.timeBonus, GAMEPLAY.timeBonus);
assert.equal(getPairScore(normal), GAMEPLAY.pairScore);
for (const level of LEVELS)
  assert.equal(getScaledTimeLimit(level.timeLimit, normal), level.timeLimit);

// Urutan kesulitan: easy lebih longgar daripada normal, normal daripada hard.
const [easy, , hard] = DIFFICULTIES;
assert.ok(
  easy.timeMultiplier > normal.timeMultiplier && normal.timeMultiplier > hard.timeMultiplier
);
assert.ok(easy.shuffles > normal.shuffles && normal.shuffles > hard.shuffles);
assert.ok(easy.timeBonus > normal.timeBonus && normal.timeBonus > hard.timeBonus);
assert.ok(hard.scoreMultiplier > normal.scoreMultiplier);
for (const d of DIFFICULTIES) {
  assert.ok(d.shuffles >= 1, `${d.id}: minimal 1 shuffle`);
  assert.ok(d.timeBonus > 0, `${d.id}: bonus waktu harus positif`);
  assert.ok(Number.isInteger(getPairScore(d)), `${d.id}: skor pasangan harus bilangan bulat`);
}

// --- Batas waktu ---
LEVELS.forEach((level, i) => {
  for (const d of DIFFICULTIES) {
    const limit = getScaledTimeLimit(level.timeLimit, d);
    assert.equal(limit % 5, 0, `level ${i + 1} ${d.id}: waktu harus kelipatan 5`);
    assert.ok(limit >= 5, `level ${i + 1} ${d.id}: waktu terlalu kecil`);
  }
  assert.ok(
    getScaledTimeLimit(level.timeLimit, easy) > level.timeLimit,
    `level ${i + 1}: easy harus lebih lama`
  );
  assert.ok(
    getScaledTimeLimit(level.timeLimit, hard) < level.timeLimit,
    `level ${i + 1}: hard harus lebih singkat`
  );
});
assert.equal(getScaledTimeLimit(120, easy), 180);
assert.equal(getScaledTimeLimit(120, hard), 90);
assert.equal(getScaledTimeLimit(1, hard), 5, 'batas bawah 5 detik');

// --- Skor ---
assert.equal(getPairScore(easy), 100);
assert.equal(getPairScore(hard), 150);

// --- Deskripsi ---
assert.equal(describeDifficulty(easy), 'Waktu +50% • Acak 5x');
assert.equal(describeDifficulty(normal), 'Waktu standar • Acak 3x');
assert.equal(describeDifficulty(hard), 'Waktu -25% • Acak 1x');

// --- Pencarian & pilihan ---
assert.equal(getDifficulty('missing').id, 'normal');
assert.equal(getDifficulty(undefined).id, 'normal');
assert.throws(() => setSelectedDifficulty('missing'), /Tingkat kesulitan tidak dikenal/);
assert.equal(getSelectedDifficulty().id, 'normal');

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
};
for (const d of DIFFICULTIES) {
  assert.equal(setSelectedDifficulty(d.id).id, d.id);
  assert.equal(stored.get(DIFFICULTY_KEY), d.id);
  assert.equal(getSelectedDifficulty().id, d.id);
}

// Nilai tersimpan rusak -> jatuh ke cadangan memori (pilihan terakhir: hard)
stored.set(DIFFICULTY_KEY, 'rusak');
assert.equal(getSelectedDifficulty().id, 'hard');

// Storage melempar error -> pilihan tetap bekerja lewat memori
globalThis.localStorage = {
  getItem() {
    throw new Error('storage unavailable');
  },
  setItem() {
    throw new Error('storage unavailable');
  },
};
assert.equal(setSelectedDifficulty('easy').id, 'easy');
assert.equal(getSelectedDifficulty().id, 'easy');

console.log('OK — tingkat kesulitan valid (aturan, batas waktu, skor, dan penyimpanan pilihan).');
