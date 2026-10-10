import Phaser from 'phaser';
import {
  BOARD_COLS,
  BOARD_ROWS,
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GAMEPLAY,
  SCENES,
  TILE_SIZE,
} from '../constants.js';
import Tile from '../components/Tile.js';
import UIOverlay from '../components/UIOverlay.js';
import { countTiles, generateBoard, shuffleRemaining } from '../utils/boardGenerator.js';
import { createButton } from '../utils/createButton.js';
import { findPath, findValidPair } from '../utils/pathfinding.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.fadeIn(250);
    this.isResolving = false;
    this.score = 0;
    this.timeLeft = GAMEPLAY.timeLimit;
    this.shufflesLeft = GAMEPLAY.shuffles;
    this.boardX = (GAME_WIDTH - BOARD_COLS * TILE_SIZE) / 2;
    this.boardY = 112;
    this.selectedTile = null;
    this.tiles = new Map();
    this.grid = generateBoard(BOARD_ROWS, BOARD_COLS, GAMEPLAY.tileTypes);

    this.add.rectangle(cx, this.boardY + (BOARD_ROWS * TILE_SIZE) / 2, BOARD_COLS * TILE_SIZE + 12, BOARD_ROWS * TILE_SIZE + 12, COLORS.panel)
      .setStrokeStyle(3, COLORS.primary);
    this.add.text(cx, 88, 'ONET CLASSIC', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.createMatchEffects();
    this.createTiles();
    this.hud = new UIOverlay(this, {
      x: 250,
      width: 780,
      shuffles: this.shufflesLeft,
      onShuffle: () => this.shuffleBoard(),
      onHint: () => this.showHint(),
    });
    this.hud.setTime(this.timeLeft, GAMEPLAY.timeLimit);
    createButton(this, 1130, 46, 'MENU', () => this.scene.start(SCENES.MENU), {
      width: 150,
      height: 44,
      fontSize: 20,
    });

    if (!findValidPair(this.grid)) this.shuffleBoard(true);
  }

  update(_time, delta) {
    if (this.isResolving) return;
    this.timeLeft = Math.max(0, this.timeLeft - delta / 1000);
    this.hud.setTime(this.timeLeft, GAMEPLAY.timeLimit);
    if (this.timeLeft === 0) this.finishGame(false);
  }

  createTiles() {
    for (let r = 1; r <= BOARD_ROWS; r++) {
      for (let c = 1; c <= BOARD_COLS; c++) {
        const value = this.grid[r][c];
        const x = this.boardX + (c - 0.5) * TILE_SIZE;
        const y = this.boardY + (r - 0.5) * TILE_SIZE;
        const tile = new Tile(this, x, y, value, r, c);
        tile.on('pointerup', () => this.selectTile(tile));
        this.tiles.set(this.key(r, c), tile);
      }
    }
  }

  key(r, c) {
    return `${r},${c}`;
  }

  selectTile(tile) {
    if (this.isResolving || !tile.active) return;
    if (this.selectedTile === tile) {
      tile.setSelected(false);
      this.selectedTile = null;
      return;
    }
    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.setSelected(true);
      return;
    }

    const first = this.selectedTile;
    first.setSelected(false);
    this.selectedTile = null;
    if (first.value !== tile.value) {
      tile.shake();
      this.hud.showToast('Tile tidak cocok');
      return;
    }

    const path = findPath(this.grid, { r: first.r, c: first.c }, { r: tile.r, c: tile.c });
    if (!path) {
      first.shake();
      tile.shake();
      this.hud.showToast('Jalur terhalang');
      return;
    }
    this.removePair(first, tile, path);
  }

  removePair(first, second, path) {
    this.isResolving = true;
    this.showMatchPath(path, () => {
      this.matchParticles.explode(22, first.x, first.y);
      this.matchParticles.explode(22, second.x, second.y);
      this.grid[first.r][first.c] = 0;
      this.grid[second.r][second.c] = 0;
      this.tiles.delete(this.key(first.r, first.c));
      this.tiles.delete(this.key(second.r, second.c));
      first.vanish();
      this.score += GAMEPLAY.pairScore;
      this.timeLeft = Math.min(GAMEPLAY.timeLimit, this.timeLeft + GAMEPLAY.timeBonus);
      this.hud.setScore(this.score);
      this.hud.setTime(this.timeLeft, GAMEPLAY.timeLimit);
      this.hud.floatText((first.x + second.x) / 2, (first.y + second.y) / 2, `+${GAMEPLAY.pairScore}`);
      second.vanish(() => {
        this.isResolving = false;

        if (countTiles(this.grid) === 0) {
          this.finishGame(true);
        } else if (!findValidPair(this.grid)) {
          this.shuffleBoard(true);
          this.hud.showToast('Papan diacak otomatis');
        }
      });
    });
  }

  createMatchEffects() {
    const textureKey = 'onet-match-particle';
    if (!this.textures.exists(textureKey)) {
      const particle = this.make.graphics({ x: 0, y: 0, add: false });
      particle.fillStyle(0xffffff, 1);
      particle.fillCircle(6, 6, 6);
      particle.generateTexture(textureKey, 12, 12);
      particle.destroy();
    }

    this.matchParticles = this.add.particles(0, 0, textureKey, {
      angle: { min: 0, max: 360 },
      speed: { min: 90, max: 250 },
      lifespan: { min: 280, max: 460 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x35f3ff, 0x9afff0, 0xffd166, 0xffffff],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    }).setDepth(16);
  }

  showMatchPath(path, onComplete) {
    const drawStroke = (width, color, alpha, depth) => {
      const line = this.add.graphics().setDepth(depth);
      line.lineStyle(width, color, alpha);
      line.beginPath();
      path.forEach((point, index) => {
        const x = this.boardX + (point.c - 0.5) * TILE_SIZE;
        const y = this.boardY + (point.r - 0.5) * TILE_SIZE;
        if (index === 0) line.moveTo(x, y);
        else line.lineTo(x, y);
      });
      line.strokePath();
      return line;
    };

    const layers = [
      drawStroke(14, 0x35f3ff, 0.2, 8),
      drawStroke(6, 0x35f3ff, 0.9, 9),
      drawStroke(2, 0xffffff, 1, 10),
    ];
    this.tweens.add({
      targets: layers,
      alpha: 0,
      delay: 100,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        layers.forEach((layer) => layer.destroy());
        onComplete();
      },
    });
  }

  shuffleBoard(automatic = false) {
    if (this.isResolving || (!automatic && this.shufflesLeft <= 0)) return;
    if (!automatic) {
      this.shufflesLeft--;
      this.hud.setShuffles(this.shufflesLeft);
    }
    shuffleRemaining(this.grid);
    for (const tile of this.tiles.values()) tile.setValue(this.grid[tile.r][tile.c]);
    this.hud?.showToast(automatic ? 'Papan diacak' : 'Tile diacak');
  }

  showHint() {
    if (this.isResolving) return;
    const pair = findValidPair(this.grid);
    if (!pair) {
      this.shuffleBoard(true);
      return;
    }
    this.tiles.get(this.key(pair.a.r, pair.a.c))?.startHint();
    this.tiles.get(this.key(pair.b.r, pair.b.c))?.startHint();
  }

  finishGame(win) {
    if (this.isResolving && !win) return;
    this.isResolving = true;
    this.scene.start(SCENES.GAME_OVER, { win, score: this.score, timeLeft: this.timeLeft });
  }
}