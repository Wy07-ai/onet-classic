// Jalankan: node tests/levelprogress.test.mjs
import assert from 'node:assert/strict';
import { MAX_LEVEL } from '../src/constants.js';
import {
  UNLOCKED_LEVEL_KEY,
  completeLevelProgress,
  getUnlockedLevel,
  isLevelUnlocked,
  resetMemoryFallback,
  unlockLevel,
} from '../src/utils/levelProgress.js';

assert.equal(UNLOCKED_LEVEL_KEY, 'onet_unlocked_level');

// --- Tanpa localStorage (Node / storage diblokir): level 1 selalu terbuka, tidak crash ---
assert.equal(getUnlockedLevel(), 1);
assert.equal(isLevelUnlocked(1), true);
assert.equal(isLevelUnlocked(2), false);
// Progres tetap diingat selama sesi lewat cadangan memori
assert.deepEqual(unlockLevel(3), { unlocked: 3, previous: 1, isNew: true });
assert.equal(getUnlockedLevel(), 3);
assert.equal(isLevelUnlocked(3), true);
assert.equal(isLevelUnlocked(4), false);
assert.equal(unlockLevel(2).isNew, false); // tidak menurun
resetMemoryFallback();
assert.equal(getUnlockedLevel(), 1);

// --- Dengan localStorage tiruan ---
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
};

// Awal: hanya level 1
assert.equal(getUnlockedLevel(), 1);
assert.equal(isLevelUnlocked(1), true);
assert.equal(isLevelUnlocked(2), false);

// Menyelesaikan level 1 membuka level 2 dan tersimpan di key yang benar
assert.deepEqual(completeLevelProgress(1), { unlocked: 2, previous: 1, isNew: true });
assert.equal(store.get(UNLOCKED_LEVEL_KEY), '2');
assert.equal(getUnlockedLevel(), 2);
assert.equal(isLevelUnlocked(2), true);
assert.equal(isLevelUnlocked(3), false);

// Memainkan ulang level lama tidak menurunkan progres
assert.deepEqual(completeLevelProgress(1), { unlocked: 2, previous: 2, isNew: false });
assert.equal(unlockLevel(1).isNew, false);
assert.equal(getUnlockedLevel(), 2);
assert.equal(store.get(UNLOCKED_LEVEL_KEY), '2');

// Lompat ke level lebih tinggi (mis. progres dari sesi lain)
assert.equal(unlockLevel(4).unlocked, 4);
assert.equal(getUnlockedLevel(), 4);

// Dibatasi sampai MAX_LEVEL; menyelesaikan level terakhir tidak melewati batas
completeLevelProgress(MAX_LEVEL - 1);
assert.equal(getUnlockedLevel(), MAX_LEVEL);
assert.deepEqual(completeLevelProgress(MAX_LEVEL), { unlocked: MAX_LEVEL, previous: MAX_LEVEL, isNew: false });
assert.equal(unlockLevel(MAX_LEVEL + 50).unlocked, MAX_LEVEL);
assert.equal(store.get(UNLOCKED_LEVEL_KEY), String(MAX_LEVEL));
assert.equal(isLevelUnlocked(MAX_LEVEL), true);
assert.equal(isLevelUnlocked(MAX_LEVEL + 1), false);

// Parameter maxLevel kustom
store.clear();
assert.equal(unlockLevel(9, 3).unlocked, 3);
assert.equal(getUnlockedLevel(3), 3);

// Input tidak valid ditolak: tidak mengubah progres
store.clear();
for (const bad of [0, -3, NaN, undefined, 'abc', null]) {
  assert.equal(unlockLevel(bad).isNew, false, `unlockLevel(${String(bad)})`);
}
assert.equal(getUnlockedLevel(), 1);
assert.equal(isLevelUnlocked(0), false);
assert.equal(isLevelUnlocked(-1), false);
assert.equal(isLevelUnlocked(NaN), false);
assert.equal(isLevelUnlocked(1.5), true); // desimal dibulatkan ke bawah (=1)
assert.equal(isLevelUnlocked(2.9), false); // 2.9 -> 2, belum terbuka

// Data rusak di storage -> kembali ke level 1
for (const bad of ['rusak', '', '0', '-5', 'NaN', '   ']) {
  store.set(UNLOCKED_LEVEL_KEY, bad);
  assert.equal(getUnlockedLevel(), 1, `data rusak: "${bad}"`);
}
// Nilai di storage melebihi MAX_LEVEL (mis. jumlah level dikurangi) -> dibatasi
store.set(UNLOCKED_LEVEL_KEY, '999');
assert.equal(getUnlockedLevel(), MAX_LEVEL);
// Nilai desimal / ada spasi tetap terbaca
store.set(UNLOCKED_LEVEL_KEY, '3');
assert.equal(getUnlockedLevel(), 3);

// Key level progress tidak bentrok dengan high score
assert.notEqual(UNLOCKED_LEVEL_KEY, 'onet_high_score');

// Storage melempar error -> tidak crash, progres sesi disimpan di memori
globalThis.localStorage = {
  getItem() { throw new Error('x'); },
  setItem() { throw new Error('x'); },
};
resetMemoryFallback();
assert.equal(getUnlockedLevel(), 1);
assert.equal(isLevelUnlocked(1), true);
assert.equal(unlockLevel(2).isNew, true);
assert.equal(getUnlockedLevel(), 2);

// Akses properti localStorage melempar (mode privat tertentu) -> tidak crash
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get() { throw new Error('SecurityError'); },
});
resetMemoryFallback();
assert.equal(getUnlockedLevel(), 1);
assert.equal(unlockLevel(2).isNew, true);
assert.equal(getUnlockedLevel(), 2);
resetMemoryFallback();

console.log('OK — progres level (localStorage) valid.');
