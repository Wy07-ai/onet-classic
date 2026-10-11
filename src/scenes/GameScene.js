import Phaser from 'phaser';
import {
  COLORS,
  FONT_FAMILY,
  GAME_HEIGHT,
  GAME_WIDTH,
  GAMEPLAY,
  MAX_LEVEL,
  SCENES,
  SHIFT_LABELS,
  SHIFT_MODES,
  getLevelConfig,
} from '../constants.js';
import Tile from '../components/Tile.js';
import UIOverlay from '../components/UIOverlay.js';
import { applyShift, countTiles, generateBoard, shuffleRemaining } from '../utils/boardGenerator.js';
import { applyBgmMute, getBgm, isMuted, toggleMuted } from '../utils/audioSettings.js';
import { computeBoardLayout } from '../utils/boardLayout.js';
import { createButton } from '../utils/createButton.js';
import { completeLevelProgress } from '../utils/levelProgress.js';
import { findPath, findValidPair } from '../utils/pathfinding.js';
import { setupSceneCleanup } from '../utils/sceneCleanup.js';
import { HUD_LAYOUT, LEVEL_COMPLETE_LAYOUT } from '../utils/uiLayout.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  /**
   * @param {{level?: number, score?: number}} [data] level & skor yang dibawa
   *   dari level sebelumnya. Tanpa data = mulai dari Level 1.
   */
  create(data = {}) {
    const cx = GAME_WIDTH / 2;
    // Pembersihan saat scene ditutup/di-restart: lepas listener, buang HUD/tile/efek, null-kan referensi.
    this.cleanup = setupSceneCleanup(this, () => this.releaseResources());
    this.cameras.main.fadeIn(250);

    // --- Level ---
    this.level = Phaser.Math.Clamp(Math.floor(data.level ?? 1), 1, MAX_LEVEL);
    const config = getLevelConfig(this.level);
    this.rows = config.rows;
    this.cols = config.cols;
    this.timeLimit = config.timeLimit;
    this.shiftMode = config.shift ?? SHIFT_MODES.NONE;
    this.layout = computeBoardLayout(this.rows, this.cols);
    this.tileSize = this.layout.tileSize;
    this.boardX = this.layout.x;
    this.boardY = this.layout.y;

    // --- State ---
    this.isResolving = false;
    this.transitioning = false;
    this.levelCompleteShown = false;
    this.keepMusic = false;
    this.score = data.score ?? 0;
    this.levelStartScore = this.score;
    this.timeLeft = this.timeLimit;
    this.shufflesLeft = GAMEPLAY.shuffles;
    this.selectedTile = null;
    this.tiles = new Map();
    this.grid = generateBoard(this.rows, this.cols, config.tileTypes);
    this.startBackgroundMusic();

    const pad = this.layout.panelPadding * 2;
    this.add.rectangle(cx, this.boardY + this.layout.height / 2, this.layout.width + pad, this.layout.height + pad, COLORS.panel)
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
      level: this.level,
      onShuffle: () => this.shuffleBoard(),
      onHint: () => this.showHint(),
      onPause: () => this.pauseGame(),
      onToggleBgm: () => this.toggleAudio('bgm'),
      onToggleSfx: () => this.toggleAudio('sfx'),
    });
    this.hud.setScore(this.score);
    this.hud.setTime(this.timeLeft, this.timeLimit);
    this.menuBtn = createButton(this, HUD_LAYOUT.menu.x, HUD_LAYOUT.menu.y, 'MENU', () => this.scene.start(SCENES.MENU), {
      width: HUD_LAYOUT.menu.width,
      height: HUD_LAYOUT.menu.height,
      fontSize: HUD_LAYOUT.menu.fontSize,
    }).setDepth(20);

    // Shortcut pause + sinkronkan HUD setelah toggle audio di menu pause.
    // Semua listener lewat `this.cleanup` supaya otomatis dilepas saat shutdown.
    const onKey = (event) => {
      if (!event.repeat) this.pauseGame();
    };
    this.cleanup.on(this.input.keyboard, 'keydown-ESC', onKey);
    this.cleanup.on(this.input.keyboard, 'keydown-P', onKey);
    this.cleanup.on(this.events, Phaser.Scenes.Events.RESUME, () => this.hud?.syncAudio());

    if (!findValidPair(this.grid)) this.shuffleBoard(true);
    this.showLevelBanner();
  }

  // ---------------------------------------------------------------- Pause

  pauseGame() {
    if (this.transitioning || this.levelCompleteShown || this.scene.isPaused()) return;
    this.scene.launch(SCENES.PAUSE, { level: this.level });
    // GameScene dibekukan: update (timer), tween, dan input berhenti.
    this.scene.pause();
  }

  toggleAudio(channel) {
    toggleMuted(this, channel);
    this.hud.syncAudio();
  }

  // ---------------------------------------------------------------- Level

  showLevelBanner() {
    const banner = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `LEVEL ${this.level}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#16213e',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setScale(0.6)
      .setAlpha(0);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      scale: 1,
      duration: 260,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 520,
      onComplete: () => banner.destroy(),
    });

    const label = SHIFT_LABELS[this.shiftMode];
    if (label) {
      const sub = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 62, label, {
          fontFamily: FONT_FAMILY,
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#ffd166',
          stroke: '#16213e',
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setDepth(30)
        .setAlpha(0);
      this.tweens.add({
        targets: sub,
        alpha: 1,
        duration: 260,
        yoyo: true,
        hold: 520,
        onComplete: () => sub.destroy(),
      });
    }
  }

  /** Mulai ulang scene dengan level & skor tertentu (dengan fade out singkat). */
  goToLevel(level, score) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.isResolving = true;
    this.keepMusic = true; // BGM lanjut terus antar level
    this.cameras.main.fadeOut(220);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ level, score });
    });
  }

  /** Ulangi level ini dari awal; skor kembali ke nilai di awal level. */
  restartLevel() {
    this.goToLevel(this.level, this.levelStartScore);
  }

  /** Papan bersih: tampilkan modal, lalu lanjut ke level berikutnya. */
  completeLevel() {
    this.isResolving = true; // timer berhenti selama modal tampil
    this.levelCompleteShown = true;
    completeLevelProgress(this.level); // buka level berikutnya (tersimpan di localStorage)
    const next = getLevelConfig(this.level + 1);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const items = [];
    items.push(this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.75).setInteractive());
    items.push(this.add.rectangle(cx, cy, 520, 380, COLORS.panel).setStrokeStyle(4, COLORS.accent));
    items.push(
      this.add
        .text(cx, cy - 120, `LEVEL ${this.level} SELESAI!`, {
          fontFamily: FONT_FAMILY,
          fontSize: '46px',
          fontStyle: 'bold',
          color: '#4cd964',
          stroke: '#0b1020',
          strokeThickness: 8,
        })
        .setOrigin(0.5)
    );
    items.push(
      this.add
        .text(cx, cy - 50, `Skor: ${this.score}`, { fontFamily: FONT_FAMILY, fontSize: '32px', color: '#ffe066' })
        .setOrigin(0.5)
    );
    items.push(
      this.add
        .text(cx, cy + 5, `Berikutnya: ${next.rows}x${next.cols}  •  ${next.timeLimit} detik${SHIFT_LABELS[next.shift] ? `\n${SHIFT_LABELS[next.shift]}` : ''}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          color: '#b8c4e8',
          align: 'center',
        })
        .setOrigin(0.5)
    );
    items.push(
      createButton(this, LEVEL_COMPLETE_LAYOUT.next.x, LEVEL_COMPLETE_LAYOUT.next.y, `LEVEL ${this.level + 1}`, () => this.goToNextLevel(), {
        width: LEVEL_COMPLETE_LAYOUT.next.width,
        height: LEVEL_COMPLETE_LAYOUT.next.height,
        fontSize: LEVEL_COMPLETE_LAYOUT.next.fontSize,
      })
    );
    items.forEach((item) => item.setDepth(40));

    this.cameras.main.flash(180, 255, 255, 255, true);
    this.cleanup.once(this.input.keyboard, 'keydown-ENTER', () => this.goToNextLevel());
  }

  goToNextLevel() {
    this.goToLevel(this.level + 1, this.score);
  }

  update(_time, delta) {
    if (this.isResolving) return;
    const previousSecond = Math.ceil(this.timeLeft);
    this.timeLeft = Math.max(0, this.timeLeft - delta / 1000);
    this.hud.setTime(this.timeLeft, this.timeLimit);
    const currentSecond = Math.ceil(this.timeLeft);
    if (this.timeLeft > 0 && this.timeLeft < 10 && currentSecond !== previousSecond) {
      this.playSfx('clock-tick', 0.5);
    }
    if (this.timeLeft === 0) this.finishGame(false);
  }

  startBackgroundMusic() {
    // Pakai ulang BGM yang sudah ada (restart/next level) supaya tidak mulai dari awal.
    this.backgroundMusic = getBgm(this) ?? this.sound.add('bgm', { loop: true, volume: 0.22 });
    applyBgmMute(this);
    const playMusic = () => {
      if (this.backgroundMusic && !this.backgroundMusic.isPlaying) this.backgroundMusic.play();
    };

    // Browser mobile mengunci audio sampai ada sentuhan pertama; listener dilepas otomatis saat shutdown.
    if (this.sound.locked) this.cleanup.once(this.sound, 'unlocked', playMusic);
    else playMusic();
  }

  playSfx(key, volume = 0.7) {
    if (isMuted(this, 'sfx')) return;
    if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
  }

  createTiles() {
    for (let r = 1; r <= this.rows; r++) {
      for (let c = 1; c <= this.cols; c++) {
        const value = this.grid[r][c];
        const x = this.boardX + (c - 0.5) * this.tileSize;
        const y = this.boardY + (r - 0.5) * this.tileSize;
        const tile = new Tile(this, x, y, value, r, c, this.tileSize);
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
    this.playSfx('tile-click', 0.55);
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
      this.playSfx('wrong');
      tile.shake();
      this.hud.showToast('Tile tidak cocok');
      return;
    }

    const path = findPath(this.grid, { r: first.r, c: first.c }, { r: tile.r, c: tile.c });
    if (!path) {
      this.playSfx('wrong');
      first.shake();
      tile.shake();
      this.hud.showToast('Jalur terhalang');
      return;
    }
    this.removePair(first, tile, path);
  }

  removePair(first, second, path) {
    this.isResolving = true;
    this.playSfx('match');
    this.showMatchPath(path, () => {
      this.matchParticles.explode(22, first.x, first.y);
      this.matchParticles.explode(22, second.x, second.y);
      this.grid[first.r][first.c] = 0;
      this.grid[second.r][second.c] = 0;
      this.tiles.delete(this.key(first.r, first.c));
      this.tiles.delete(this.key(second.r, second.c));
      first.vanish();
      this.score += GAMEPLAY.pairScore;
      this.timeLeft = Math.min(this.timeLimit, this.timeLeft + GAMEPLAY.timeBonus);
      this.hud.setScore(this.score);
      this.hud.setTime(this.timeLeft, this.timeLimit);
      this.hud.floatText((first.x + second.x) / 2, (first.y + second.y) / 2, `+${GAMEPLAY.pairScore}`);
      second.vanish(() => {
        // Tile tersisa bergeser mengisi ruang kosong (sesuai aturan level), baru input dibuka lagi.
        this.shiftTiles(() => {
          this.isResolving = false;

          if (countTiles(this.grid) === 0) {
            if (this.level >= MAX_LEVEL) this.finishGame(true);
            else this.completeLevel();
          } else if (!findValidPair(this.grid)) {
            this.shuffleBoard(true);
            this.hud.showToast('Papan diacak otomatis');
          }
        });
      });
    });
  }

  /**
   * Terapkan mode pergeseran level ke grid, lalu animasikan tile yang berpindah
   * dengan tween. `onDone` dipanggil setelah semua tween selesai
   * (langsung dipanggil bila tidak ada yang bergerak).
   */
  shiftTiles(onDone) {
    const moves = applyShift(this.grid, this.shiftMode);
    if (moves.length === 0) {
      onDone();
      return;
    }

    // Ambil semua tile dulu sebelum map diubah (kunci lama & baru bisa bertabrakan).
    const moving = moves.map((m) => ({ m, tile: this.tiles.get(this.key(m.from.r, m.from.c)) }));
    for (const { m } of moving) this.tiles.delete(this.key(m.from.r, m.from.c));

    const isDown = this.shiftMode === SHIFT_MODES.DOWN;
    let pending = moving.length;
    const done = () => {
      if (--pending === 0) onDone();
    };

    for (const { m, tile } of moving) {
      if (!tile) {
        done();
        continue;
      }
      this.tiles.set(this.key(m.to.r, m.to.c), tile);
      const dist = Math.abs(m.to.r - m.from.r) + Math.abs(m.to.c - m.from.c);
      tile.moveTo(
        m.to.r,
        m.to.c,
        this.boardX + (m.to.c - 0.5) * this.tileSize,
        this.boardY + (m.to.r - 0.5) * this.tileSize,
        {
          duration: Phaser.Math.Clamp(140 + dist * 60, 160, 420),
          ease: isDown ? 'Bounce.easeOut' : 'Cubic.easeInOut',
        },
        done
      );
    }
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

    // Tiga lapis garis jalur dibuat sekali & dipakai ulang tiap pasangan (tanpa membuat/membuang Graphics baru).
    this.pathLayers = [
      { width: 14, color: 0x35f3ff, alpha: 0.2, depth: 8 },
      { width: 6, color: 0x35f3ff, alpha: 0.9, depth: 9 },
      { width: 2, color: 0xffffff, alpha: 1, depth: 10 },
    ].map((style) => ({ style, gfx: this.add.graphics().setDepth(style.depth).setVisible(false) }));

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
    const points = path.map((point) => ({
      x: this.boardX + (point.c - 0.5) * this.tileSize,
      y: this.boardY + (point.r - 0.5) * this.tileSize,
    }));
    const layers = this.pathLayers.map(({ style, gfx }) => {
      gfx.clear();
      gfx.lineStyle(style.width, style.color, style.alpha);
      gfx.beginPath();
      points.forEach((p, index) => (index === 0 ? gfx.moveTo(p.x, p.y) : gfx.lineTo(p.x, p.y)));
      gfx.strokePath();
      return gfx.setAlpha(1).setVisible(true);
    });
    this.tweens.add({
      targets: layers,
      alpha: 0,
      delay: 100,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        layers.forEach((gfx) => gfx.clear().setVisible(false));
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
    this.playSfx('shuffle');
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
    this.playSfx('hint');
    this.tiles.get(this.key(pair.a.r, pair.a.c))?.startHint();
    this.tiles.get(this.key(pair.b.r, pair.b.c))?.startHint();
  }

  /**
   * Dipanggil sekali saat scene shutdown/destroy (lewat setupSceneCleanup). Listener di emitter
   * panjang-umur sudah dilepas oleh `this.cleanup`; di sini objek & referensi yang tersisa dibuang.
   */
  releaseResources() {
    // BGM: lanjut antar level (keepMusic), selain itu berhenti & dibuang.
    if (!this.keepMusic) {
      this.backgroundMusic?.stop();
      this.backgroundMusic?.destroy();
    }
    this.backgroundMusic = null;

    this.hud?.destroy();
    this.hud = null;
    this.menuBtn?.destroy();
    this.menuBtn = null;
    this.matchParticles?.destroy();
    this.matchParticles = null;
    this.pathLayers?.forEach(({ gfx }) => gfx.destroy());
    this.pathLayers = null;
    this.tiles?.forEach((tile) => tile.destroy());
    this.tiles?.clear();
    this.selectedTile = null;
  }

  finishGame(win) {
    if (this.isResolving && !win) return;
    this.isResolving = true;
    this.scene.start(SCENES.GAME_OVER, { win, score: this.score, timeLeft: this.timeLeft, level: this.level });
  }
}