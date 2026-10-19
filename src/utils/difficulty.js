import { GAMEPLAY } from '../constants.js';

/**
 * Tingkat kesulitan. Dipilih di Pengaturan dan berlaku untuk seluruh level dalam satu permainan.
 *  - timeMultiplier  : pengali batas waktu tiap level (dibulatkan ke kelipatan 5 detik)
 *  - shuffles        : jatah Shuffle per level
 *  - timeBonus       : bonus detik tiap pasangan yang cocok
 *  - scoreMultiplier : pengali skor per pasangan
 * NORMAL sama persis dengan perilaku asli (nilai diambil dari GAMEPLAY).
 */
export const DIFFICULTIES = [
  { id: 'easy', label: 'EASY', timeMultiplier: 1.5, shuffles: 5, timeBonus: 5, scoreMultiplier: 1 },
  {
    id: 'normal',
    label: 'NORMAL',
    timeMultiplier: 1,
    shuffles: GAMEPLAY.shuffles,
    timeBonus: GAMEPLAY.timeBonus,
    scoreMultiplier: 1,
  },
  {
    id: 'hard',
    label: 'HARD',
    timeMultiplier: 0.75,
    shuffles: 1,
    timeBonus: 2,
    scoreMultiplier: 1.5,
  },
];

export const DIFFICULTY_KEY = 'onet_difficulty';
export const DEFAULT_DIFFICULTY_ID = 'normal';

let memoryDifficultyId = DEFAULT_DIFFICULTY_ID;

/** Cari tingkat kesulitan berdasarkan id; id tidak dikenal jatuh ke NORMAL. */
export function getDifficulty(difficultyId) {
  return (
    DIFFICULTIES.find((difficulty) => difficulty.id === difficultyId) ??
    DIFFICULTIES.find((difficulty) => difficulty.id === DEFAULT_DIFFICULTY_ID)
  );
}

export function getSelectedDifficulty() {
  try {
    const savedId = globalThis.localStorage?.getItem(DIFFICULTY_KEY);
    if (DIFFICULTIES.some((difficulty) => difficulty.id === savedId)) return getDifficulty(savedId);
  } catch {
    // Storage bisa ditolak (mode privat / kebijakan browser): pakai cadangan memori.
  }
  return getDifficulty(memoryDifficultyId);
}

export function setSelectedDifficulty(difficultyId) {
  const difficulty = DIFFICULTIES.find((candidate) => candidate.id === difficultyId);
  if (!difficulty) throw new Error(`Tingkat kesulitan tidak dikenal: ${difficultyId}`);
  memoryDifficultyId = difficulty.id;
  try {
    globalThis.localStorage?.setItem(DIFFICULTY_KEY, difficulty.id);
  } catch {
    // Pilihan tetap berlaku selama sesi walau storage tidak tersedia.
  }
  return difficulty;
}

/** Batas waktu level setelah disesuaikan dengan kesulitan (kelipatan 5 detik, minimal 5). */
export function getScaledTimeLimit(baseSeconds, difficulty) {
  const scaled = Math.round((baseSeconds * difficulty.timeMultiplier) / 5) * 5;
  return Math.max(5, scaled);
}

/** Skor per pasangan untuk kesulitan ini. */
export function getPairScore(difficulty) {
  return Math.round(GAMEPLAY.pairScore * difficulty.scoreMultiplier);
}

/** Ringkasan satu baris untuk kartu pilihan, mis. "Waktu +50% • Acak 5x". */
export function describeDifficulty(difficulty) {
  const percent = Math.round((difficulty.timeMultiplier - 1) * 100);
  const time =
    percent === 0 ? 'Waktu standar' : `Waktu ${percent > 0 ? '+' : '-'}${Math.abs(percent)}%`;
  return `${time} • Acak ${difficulty.shuffles}x`;
}
