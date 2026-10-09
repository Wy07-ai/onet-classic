import Phaser from 'phaser';
import {
  SCENES,
  GAME_WIDTH,
  GAME_HEIGHT,
  BOARD_ROWS,
  BOARD_COLS,
  CELL_SIZE,
  COLORS,
  GAMEPLAY,
} from '../constants.js';
import { generateBoard, countTiles, shuffleRemaining } from '../utils/boardGenerator.js';
import { findPath, findValidPair } from '../utils/pathfinding.js';
import Tile from '../components/Tile.js';
import UIOverlay from '../components/UIOverlay.js';

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
    this.locked = false; // true selama animasi (input papan diabaikan)
    this.ended = false; // true begitu game selesai (menang/kalah)
    this.finished = false;
    this.hintTiles = [];

    // State gameplay (di-reset tiap create() karena instance scene dipakai ulang)
    this.score = 0;
    this.timeLeft = GAMEPLAY.TIME_LIMIT;
    this.shufflesLeft = GAMEPLAY.SHUFFLE_LIMIT;
    this.lastTick = performance.now();

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

    this.hud = new UIOverlay(this, {
      x: this.originX,
      width: this.cols * CELL_SIZE,
      shuffles: this.shufflesLeft,
      onShuffle: () => this.shuffleBoard(),
      onHint: () => this.useHint(),
    });
    this.hud.setTime(this.timeLeft, GAMEPLAY.TIME_LIMIT);

    // Papan awal acak bisa (sangat jarang) langsung buntu -> cek juga di awal
    this.ensureMovesAvailable();
  }

  update() {
    // Timer pakai jam nyata, bukan `delta` Phaser: saat FPS rendah Phaser meredam delta
    // (lag smoothing) sehingga timer berjalan lambat. Batas 0,5 dtk/frame agar pindah tab
    // atau lag sesaat tidak menghabiskan waktu pemain.
    const now = performance.now();
    const dt = Math.min(0.5, (now - this.lastTick) / 1000);
    this.lastTick = now;
    if (this.ended) return;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.hud.setTime(0, GAMEPLAY.TIME_LIMIT);
      this.finishGame(false);
      return;
    }
    this.hud.setTime(this.timeLeft, GAMEPLAY.TIME_LIMIT);
  }

  /** Pusat sel (r,c) dalam piksel. Dipakai juga untuk titik sudut jalur (termasuk di border). */
  cellToPixel(r, c) {
    return {
      x: this.originX + c * CELL_SIZE + CELL_SIZE / 2,
      y: this.originY + r * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  onTileClick(tile) {
    if (this.locked || this.ended) return;
    this.clearHint();

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
      this.registerMatch(a, b);

      // Papan bersih? Hentikan timer SEKARANG supaya tidak kalah saat animasi hilang berjalan.
      const cleared = countTiles(this.grid) === 0;
      if (cleared) this.ended = true;

      b.vanish();
      a.vanish(() => {
        if (cleared) {
          this.finishGame(true);
          return;
        }
        this.locked = false;
        this.ensureMovesAvailable();
      });
    });
  }

  /** Tambah skor + bonus waktu untuk satu pasangan yang cocok. */
  registerMatch(a, b) {
    this.score += GAMEPLAY.MATCH_SCORE;
    this.timeLeft = Math.min(GAMEPLAY.TIME_LIMIT, this.timeLeft + GAMEPLAY.MATCH_TIME_BONUS);
    this.hud.setScore(this.score);
    this.hud.setTime(this.timeLeft, GAMEPLAY.TIME_LIMIT);
    this.hud.floatText(
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      `+${GAMEPLAY.MATCH_SCORE}  +${GAMEPLAY.MATCH_TIME_BONUS}s`
    );
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

  // ---------------------------------------------------------------- Hint

  useHint() {
    if (this.locked || this.ended) return;
    this.clearHint();
    const pair = findValidPair(this.grid);
    if (!pair) {
      this.ensureMovesAvailable();
      return;
    }
    const a = this.tiles.get(`${pair.a.r},${pair.a.c}`);
    const b = this.tiles.get(`${pair.b.r},${pair.b.c}`);
    a.startHint();
    b.startHint();
    this.hintTiles = [a, b];
  }

  clearHint() {
    for (const t of this.hintTiles) if (t && t.active) t.stopHint();
    this.hintTiles = [];
  }

  // ------------------------------------------------------------- Shuffle

  /**
   * @param {{auto?: boolean}} opts auto=true: dipicu otomatis (papan buntu), tidak memakai jatah.
   */
  shuffleBoard({ auto = false } = {}) {
    if (this.ended) return;
    if (!auto) {
      if (this.locked || this.shufflesLeft <= 0) return;
      this.shufflesLeft--;
      this.hud.setShuffles(this.shufflesLeft);
    }

    this.locked = true;
    this.clearHint();
    if (this.selected) {
      this.selected.setSelected(false);
      this.selected = null;
    }

    const tiles = [...this.tiles.values()];
    this.tweens.add({
      targets: tiles,
      scaleX: 0,
      duration: 140,
      onComplete: () => {
        // Posisi tile tidak berpindah; hanya jenisnya yang diacak di grid, lalu disinkronkan.
        shuffleRemaining(this.grid);
        for (const t of tiles) t.setValue(this.grid[t.r][t.c]);
        this.tweens.add({
          targets: tiles,
          scaleX: 1,
          duration: 140,
          onComplete: () => {
            this.locked = false;
          },
        });
      },
    });
  }

  /** Jika tak ada pasangan valid tersisa, acak otomatis (tanpa mengurangi jatah Shuffle). */
  ensureMovesAvailable() {
    if (this.ended || countTiles(this.grid) === 0) return;
    if (findValidPair(this.grid)) return;
    this.hud.showToast('Tidak ada pasangan tersisa — mengacak otomatis');
    this.shuffleBoard({ auto: true });
  }

  // ------------------------------------------------------------ Game end

  finishGame(win) {
    if (this.finished) return;
    this.finished = true;
    this.ended = true;
    this.locked = true;
    this.clearHint();

    const data = { win, score: this.score, timeLeft: Math.ceil(this.timeLeft) };
    if (win) {
      this.scene.start(SCENES.GAME_OVER, data);
    } else {
      // Jeda singkat supaya pemain sempat melihat bar waktu habis
      this.hud.showToast('WAKTU HABIS!');
      this.time.delayedCall(900, () => this.scene.start(SCENES.GAME_OVER, data));
    }
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
