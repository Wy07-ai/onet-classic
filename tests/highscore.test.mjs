// Jalankan: node tests/highscore.test.mjs
import assert from 'node:assert/strict';
import { HIGH_SCORE_KEY, getHighScore, highScoreKey, saveHighScore } from '../src/utils/highScore.js';

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
// Rekor dipisah per tingkat kesulitan; NORMAL memakai key lama agar rekor lama tetap terbaca.
store.clear();
assert.equal(highScoreKey(), HIGH_SCORE_KEY);
assert.equal(highScoreKey('normal'), HIGH_SCORE_KEY);
assert.equal(highScoreKey('hard'), `${HIGH_SCORE_KEY}_hard`);
assert.equal(saveHighScore(400, 'hard').isNew, true);
assert.equal(getHighScore('hard'), 400);
assert.equal(getHighScore('easy'), 0, 'rekor easy terpisah dari hard');
assert.equal(getHighScore(), 0, 'rekor normal terpisah dari hard');
assert.deepEqual(saveHighScore(250, 'hard'), { highScore: 400, previous: 400, isNew: false });
assert.equal(saveHighScore(100, 'easy').isNew, true);
assert.equal(getHighScore('easy'), 100);
assert.equal(store.get(`${HIGH_SCORE_KEY}_easy`), '100');
// storage melempar error -> tidak crash
globalThis.localStorage = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
assert.equal(getHighScore(), 0);
assert.equal(saveHighScore(10).isNew, true);
console.log('OK — high score valid.');
