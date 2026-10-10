// Jalankan: node tests/highscore.test.mjs
import assert from 'node:assert/strict';
import { HIGH_SCORE_KEY, getHighScore, saveHighScore } from '../src/utils/highScore.js';

// Tanpa localStorage (mis. Node / storage diblokir)
assert.equal(getHighScore(), 0);
assert.deepEqual(saveHighScore(500), { highScore: 500, previous: 0, isNew: true });

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};
assert.equal(getHighScore(), 0);
assert.equal(saveHighScore(0).isNew, false);
assert.deepEqual(saveHighScore(300), { highScore: 300, previous: 0, isNew: true });
assert.equal(store.get(HIGH_SCORE_KEY), '300');
assert.deepEqual(saveHighScore(200), { highScore: 300, previous: 300, isNew: false });
assert.equal(saveHighScore(300).isNew, false); // sama = bukan rekor baru
assert.equal(saveHighScore(900).isNew, true);
assert.equal(getHighScore(), 900);
store.set(HIGH_SCORE_KEY, 'rusak');
assert.equal(getHighScore(), 0);
// storage melempar error -> tidak crash
globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
assert.equal(getHighScore(), 0);
assert.equal(saveHighScore(10).isNew, true);
console.log('OK — high score valid.');
