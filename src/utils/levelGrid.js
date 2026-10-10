/**
 * Layout grid tombol level (fungsi murni, tanpa Phaser supaya bisa dites di Node).
 * Baris terakhir yang tidak penuh dipusatkan.
 *
 * @param {number} count jumlah level
 * @param {{left?: number, right?: number, top: number, bottom: number, maxCols?: number,
 *          gap?: number, cardWidth?: number, maxCardHeight?: number}} area area (px) tempat grid digambar
 * @returns {{cols: number, rows: number, cardWidth: number, cardHeight: number, gap: number,
 *            positions: {x: number, y: number}[]}} posisi = titik tengah tiap kartu
 */
export function computeLevelGrid(count, area) {
  const left = area.left ?? 0;
  const right = area.right ?? 1280;
  const maxCols = area.maxCols ?? 5;
  const gap = area.gap ?? 28;
  const maxCardHeight = area.maxCardHeight ?? 210;

  const cols = Math.max(1, Math.min(count, maxCols));
  const rows = Math.max(1, Math.ceil(count / cols));

  const availW = right - left;
  const availH = area.bottom - area.top;
  const cardWidth = Math.min(area.cardWidth ?? 190, Math.floor((availW - (cols - 1) * gap) / cols));
  const cardHeight = Math.min(maxCardHeight, Math.floor((availH - (rows - 1) * gap) / rows));

  const gridH = rows * cardHeight + (rows - 1) * gap;
  const startY = area.top + (availH - gridH) / 2 + cardHeight / 2;
  const centerX = (left + right) / 2;

  const positions = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = Math.min(cols, count - row * cols);
    const rowW = inRow * cardWidth + (inRow - 1) * gap;
    const x = centerX - rowW / 2 + cardWidth / 2 + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);
    positions.push({ x, y });
  }
  return { cols, rows, cardWidth, cardHeight, gap, positions };
}
