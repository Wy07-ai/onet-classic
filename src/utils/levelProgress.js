import { MAX_LEVEL } from '../constants.js';

export const UNLOCKED_LEVEL_KEY = 'onet_unlocked_level';

// Cadangan di memori, HANYA dipakai bila localStorage tidak bisa dipakai (diblokir / mode privat),
// supaya level yang baru dibuka tetap bisa dipilih selama sesi berjalan.
let memoryUnlocked = 1;

/** Reset cadangan memori (untuk tes). */
export function resetMemoryFallback() {
  memoryUnlocked = 1;
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // akses storage bisa ditolak (mode privat / kebijakan browser)
  }
}

/**
 * Level tertinggi yang sudah terbuka (1..maxLevel).
 * Nilai awal / data rusak / storage tidak tersedia -> 1 (level pertama selalu terbuka).
 */
export function getUnlockedLevel(maxLevel = MAX_LEVEL) {
  let storage = null;
  try {
    storage = getStorage();
  } catch {
    storage = null;
  }
  if (!storage) return Math.min(memoryUnlocked, maxLevel);
  try {
    const value = Number.parseInt(storage.getItem(UNLOCKED_LEVEL_KEY), 10);
    if (!Number.isFinite(value) || value < 1) return 1;
    return Math.min(value, maxLevel);
  } catch {
    return Math.min(memoryUnlocked, maxLevel);
  }
}

/** Apakah `level` boleh dimainkan? */
export function isLevelUnlocked(level, maxLevel = MAX_LEVEL) {
  const n = Math.floor(Number(level));
  return Number.isFinite(n) && n >= 1 && n <= getUnlockedLevel(maxLevel);
}

/**
 * Buka `level` (biasanya level berikutnya setelah menyelesaikan level sekarang).
 * Hanya menaikkan progres: tidak pernah menurunkan, dan dibatasi sampai maxLevel.
 * @returns {{unlocked: number, previous: number, isNew: boolean}}
 */
export function unlockLevel(level, maxLevel = MAX_LEVEL) {
  const previous = getUnlockedLevel(maxLevel);
  const target = Math.min(Math.floor(Number(level)) || 1, maxLevel);
  if (target <= previous) return { unlocked: previous, previous, isNew: false };
  try {
    const storage = getStorage();
    if (!storage) throw new Error('storage tidak tersedia');
    storage.setItem(UNLOCKED_LEVEL_KEY, String(target));
  } catch {
    memoryUnlocked = Math.max(memoryUnlocked, target); // tetap berlaku untuk sesi ini
  }
  return { unlocked: target, previous, isNew: true };
}

/** Dipanggil saat `level` selesai: membuka level berikutnya (kalau ada). */
export function completeLevelProgress(level, maxLevel = MAX_LEVEL) {
  return unlockLevel(Math.floor(Number(level)) + 1, maxLevel);
}
