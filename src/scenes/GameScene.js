import Phaser from 'phaser';
import {
  SCENES,
  GAME_WIDTH,
  GAME_HEIGHT,
  BOARD_ROWS,
  BOARD_COLS,
  CELL_SIZE,
  COLORS,
} from '../constants.js';
import { generateBoard, countTiles } from '../utils/boardGenerator.js';
import { findPath } from '../utils/pathfinding.js';
import Tile from '../components/Tile.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  create() {
    this.grid = generateBoard(BOARD_ROWS, BOARD_COLS);
    this.rows = this.grid.length; // sudah termasuk border
    this.cols = this.grid[0].length;
    this.tiles = new Map(); // key "r,c" -> Tile
    this.selected = null;
    this.locked = false;

    // Titik asal papan (sudut kiri-atas) supaya seluruh grid (+border) di tengah layar
    this.originX = (GAME_WIDTH - this.cols * CELL_SIZE) / 2;
    this.originY = (GAME_HEIGHT - this.rows * CELL_SIZE) / 2;

    // Latar papan (termasuk area border tempat jalur boleh lewat)
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        this.cols * CELL_SIZE,
        this.rows * CELL_SIZE,
        COLORS.boardBg
      )
      .setStrokeStyle(2, 0x2b3768);

    this.lineGfx = this.add.graphics().setDepth(10);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.grid[r][c];
        if (v === 0) continue;
        const p = this.cellToPixel(r, c);
        const tile = new Tile(this, p.x, p.y, v, r, c);
        tile.setData('homeX', p.x);
        tile.on('pointerdown', () => this.onTileClick(tile));
        this.tiles.set(`${r},${c}`, tile);
      }
    }
  }

  /** Pusat sel (r,c) dalam piksel. Dipakai juga untuk titik sudut jalur (termasuk di border). */
  cellToPixel(r, c) {
    return {
      x: this.originX + c * CELL_SIZE + CELL_SIZE / 2,
      y: this.originY + r * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  onTileClick(tile) {
    if (this.locked) return;

    // Klik pertama
    if (!this.selected) {
      this.selected = tile;
      tile.setSelected(true);
      return;
    }

    // Klik tile yang sama -> batalkan seleksi
    if (this.selected === tile) {
      tile.setSelected(false);
      this.selected = null;
      return;
    }

    // Klik kedua
    const first = this.selected;
    const second = tile;
    this.selected = null;

    const path =
      first.value === second.value
        ? findPath(
            this.grid,
            { r: first.r, c: first.c },
            { r: second.r, c: second.c }
          )
        : null;

    if (path) this.handleMatch(first, second, path);
    else this.handleMismatch(first, second);
  }

  handleMatch(a, b, path) {
    this.locked = true;
    b.setSelected(true);
    this.drawPath(path);

    this.time.delayedCall(250, () => {
      this.lineGfx.clear();
      this.removeTile(a);
      this.removeTile(b);
      b.vanish();
      a.vanish(() => {
        this.locked = false;
        if (countTiles(this.grid) === 0) {
          this.scene.start(SCENES.GAME_OVER, { win: true });
        }
      });
    });
  }

  handleMismatch(a, b) {
    this.locked = true;
    b.setSelected(true);
    let done = 0;
    const finish = () => {
      if (++done < 2) return;
      a.setSelected(false);
      b.setSelected(false);
      this.locked = false;
    };
    a.shake(finish);
    b.shake(finish);
  }

  removeTile(tile) {
    this.grid[tile.r][tile.c] = 0;
    this.tiles.delete(`${tile.r},${tile.c}`);
  }

  drawPath(path) {
    const g = this.lineGfx;
    g.clear();
    g.lineStyle(5, COLORS.line, 1);
    g.beginPath();
    path.forEach((pt, i) => {
      const p = this.cellToPixel(pt.r, pt.c);
      if (i === 0) g.moveTo(p.x, p.y);
      else g.lineTo(p.x, p.y);
    });
    g.strokePath();
  }
}
