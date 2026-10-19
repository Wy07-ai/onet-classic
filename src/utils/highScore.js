export const HIGH_SCORE_KEY = 'onet_high_score';

/**
 * Key penyimpanan rekor per tingkat kesulitan. NORMAL memakai key lama (HIGH_SCORE_KEY)
 * supaya rekor pemain yang sudah ada tidak hilang.
 */
export function highScoreKey(difficultyId = 'normal') {
  return difficultyId === 'normal' ? HIGH_SCORE_KEY : `${HIGH_SCORE_KEY}_${difficultyId}`;
}

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null; // akses storage bisa ditolak (mode privat / kebijakan browser)
  }
}

/** Ambil rekor skor tertinggi (0 bila belum ada / data rusak / storage tidak tersedia). */
export function getHighScore(difficultyId = 'normal') {
  try {
    const raw = getStorage()?.getItem(highScoreKey(difficultyId));
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

/**
 * Simpan skor bila melampaui rekor lama (rekor dipisah per tingkat kesulitan).
 * @returns {{highScore: number, previous: number, isNew: boolean}}
 */
export function saveHighScore(score, difficultyId = 'normal') {
  const previous = getHighScore(difficultyId);
  const value = Math.floor(Number(score) || 0);
  if (value <= previous) return { highScore: previous, previous, isNew: false };
  try {
    getStorage()?.setItem(highScoreKey(difficultyId), String(value));
  } catch {
    // gagal menyimpan: tetap anggap rekor untuk sesi ini
  }
  return { highScore: value, previous, isNew: true };
}
