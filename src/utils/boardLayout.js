import { BOARD_AREA, GAME_WIDTH, TILE_SIZE } from '../constants.js';

/**
 * Hitung ukuran tile & posisi papan agar rows x cols muat di BOARD_AREA
 * dan berada di tengah. Ukuran tile maksimal TILE_SIZE.
 */
export function computeBoardLayout(rows, cols) {
  const { top, bottom, sideMargin, panelPadding } = BOARD_AREA;
  const maxH = bottom - top - panelPadding * 2;
  const maxW = GAME_WIDTH - sideMargin * 2 - panelPadding * 2;
  const tileSize = Math.max(
    16,
    Math.min(TILE_SIZE, Math.floor(maxH / rows), Math.floor(maxW / cols))
  );
  const width = cols * tileSize;
  const height = rows * tileSize;
  return {
    tileSize,
    width,
    height,
    x: (GAME_WIDTH - width) / 2,
    y: top + (bottom - top - height) / 2,
    panelPadding,
  };
}
