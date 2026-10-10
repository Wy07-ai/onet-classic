export const HIGH_SCORE_KEY = 'onet_high_score';

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // akses storage bisa ditolak (mode privat / kebijakan browser)
  }
}

/** Ambil rekor skor tertinggi (0 bila belum ada / data rusak / storage tidak tersedia). */
export function getHighScore() {
  try {
    const raw = getStorage()?.getItem(HIGH_SCORE_KEY);
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/**
 * Simpan skor bila melampaui rekor lama.
 * @returns {{highScore: number, previous: number, isNew: boolean}}
 */
export function saveHighScore(score) {
  const previous = getHighScore();
  const value = Math.floor(Number(score) || 0);
  if (value <= previous) return { highScore: previous, previous, isNew: false };
  try {
    getStorage()?.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // gagal menyimpan: tetap anggap rekor untuk sesi ini
  }
  return { highScore: value, previous, isNew: true };
}
