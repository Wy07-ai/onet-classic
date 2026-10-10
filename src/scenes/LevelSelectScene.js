import Phaser from 'phaser';
import {
  COLORS,
  FONT_FAMILY,
  GAME_HEIGHT,
  GAME_WIDTH,
  LEVELS,
  MAX_LEVEL,
  SCENES,
  SHIFT_LABELS,
} from '../constants.js';
import { addButtonFeedback, createButton } from '../utils/createButton.js';
import { getUnlockedLevel } from '../utils/levelProgress.js';
import { computeLevelGrid } from '../utils/levelGrid.js';
import { addThemedBackground } from '../utils/background.js';
import { fadeToScene } from '../utils/transitions.js';

const GRID_AREA = { left: 40, right: GAME_WIDTH - 40, top: 190, bottom: 610, maxCols: 5, gap: 28 };

/**
 * Layar pemilihan level. Level yang sudah terbuka (tersimpan di localStorage lewat
 * utils/levelProgress.js) bisa dimainkan ulang; sisanya terkunci.
 */
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.LEVEL_SELECT);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.cameras.main.fadeIn(250);
    addThemedBackground(this, { alpha: 0.12 });

    const unlocked = getUnlockedLevel();

    this.add
      .text(cx, 84, 'SELECT LEVEL', {
        fontFamily: FONT_FAMILY,
        fontSize: '68px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#16213e',
        strokeThickness: 10,
        padding: { x: 30, y: 30 }, // ruang untuk blur glow agar tidak terpotong jadi kotak
      })
      .setOrigin(0.5)
      .setShadow(0, 5, '#4f8cff', 18, true, true);

    this.add
      .text(cx, 142, `Pilih level yang ingin dimainkan  •  ${unlocked} / ${MAX_LEVEL} terbuka`, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#b8c4e8',
      })
      .setOrigin(0.5);

    // --- Grid tombol level ---
    const grid = computeLevelGrid(MAX_LEVEL, GRID_AREA);
    grid.positions.forEach((pos, i) => {
      this.createLevelCard(i + 1, pos.x, pos.y, grid.cardWidth, grid.cardHeight, unlocked);
    });

    // --- Navigasi ---
    createButton(this, 130, GAME_HEIGHT - 50, 'BACK', () => this.goBack(), {
      width: 180,
      height: 58,
      fontSize: 26,
      color: 0x2f3d6e,
      hoverColor: 0x4458a0,
    });

    this.add
      .text(cx, GAME_HEIGHT - 22, 'ESC: Kembali ke menu', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    this.input.keyboard.once('keydown-ESC', () => this.goBack());
  }

  /**
   * Satu kartu level.
   * - terkunci: abu-abu + ikon gembok, klik hanya memberi umpan balik
   * - sudah selesai (level < level tertinggi yang terbuka): centang hijau
   * - level tertinggi yang terbuka: bingkai emas berdenyut
   */
  createLevelCard(level, x, y, w, h, unlocked) {
    const config = LEVELS[level - 1];
    const isLocked = level > unlocked;
    const isCurrent = level === unlocked;
    const isDone = level < unlocked;

    const items = [];
    let glow = null;
    if (isCurrent) {
      glow = this.add.rectangle(0, 0, w + 14, h + 14).setStrokeStyle(4, COLORS.accent);
      items.push(glow);
    }

    const baseColor = isLocked ? COLORS.locked : COLORS.primary;
    const bg = this.add
      .rectangle(0, 0, w, h, baseColor)
      .setStrokeStyle(4, isLocked ? COLORS.lockedStroke : COLORS.stroke);
    items.push(bg);

    const numberText = this.add
      .text(0, isLocked ? -h * 0.28 : -h * 0.22, String(level), {
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        fontStyle: 'bold',
        color: isLocked ? '#7d86a8' : '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(0, 3, '#000000', 4, false, true);
    items.push(numberText);

    if (isLocked) {
      items.push(this.drawLock(0, h * 0.14));
      items.push(
        this.add
          .text(0, h * 0.36, 'TERKUNCI', {
            fontFamily: FONT_FAMILY,
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#7d86a8',
          })
          .setOrigin(0.5)
      );
    } else {
      const lines = [`${config.rows} × ${config.cols}`, `${config.timeLimit} detik`];
      lines.forEach((line, i) => {
        items.push(
          this.add
            .text(0, h * 0.1 + i * 28, line, {
              fontFamily: FONT_FAMILY,
              fontSize: '22px',
              color: '#dbe6ff',
            })
            .setOrigin(0.5)
        );
      });
      const shift = SHIFT_LABELS[config.shift];
      if (shift) {
        items.push(
          this.add
            .text(0, h * 0.1 + 2 * 28 + 6, shift, {
              fontFamily: FONT_FAMILY,
              fontSize: '15px',
              fontStyle: 'bold',
              color: '#ffd166',
            })
            .setOrigin(0.5)
        );
      }
    }

    if (isDone) items.push(this.drawCheck(w / 2 - 28, -h / 2 + 28));

    const card = this.add.container(x, y, items);
    card.baseX = x;

    if (isCurrent && glow) {
      this.tweens.add({
        targets: glow,
        alpha: { from: 1, to: 0.25 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (isLocked) {
      // Tetap interaktif supaya bisa memberi umpan balik, tanpa hover/scale.
      bg.setInteractive({ useHandCursor: false });
      bg.on('pointerup', () => this.rejectLockedLevel(card, level));
    } else {
      addButtonFeedback(this, card, bg, {
        baseColor,
        hoverColor: COLORS.primaryHover,
        onClick: () => this.startLevel(level),
      });
    }
    return card;
  }

  drawLock(x, y) {
    const g = this.add.graphics({ x, y });
    g.lineStyle(7, 0x8f98ba, 1);
    g.beginPath();
    g.arc(0, 0, 13, Math.PI, 0, false); // gagang gembok
    g.strokePath();
    g.fillStyle(0x8f98ba, 1);
    g.fillRoundedRect(-20, -2, 40, 32, 7);
    g.fillStyle(0x2a3150, 1);
    g.fillCircle(0, 11, 4.5);
    g.fillRect(-1.8, 13, 3.6, 9);
    return g;
  }

  drawCheck(x, y) {
    const g = this.add.graphics({ x, y });
    g.fillStyle(COLORS.success, 1);
    g.fillCircle(0, 0, 17);
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(0, 0, 17);
    g.lineStyle(4, 0xffffff, 1);
    g.beginPath();
    g.moveTo(-7, 1);
    g.lineTo(-2, 7);
    g.lineTo(8, -6);
    g.strokePath();
    return g;
  }

  rejectLockedLevel(card, level) {
    if (this.isLeaving) return;
    this.tweens.killTweensOf(card);
    card.x = card.baseX;
    this.tweens.add({
      targets: card,
      x: { from: card.baseX - 8, to: card.baseX },
      duration: 260,
      ease: 'Elastic.easeOut',
    });
    this.showToast(`Selesaikan Level ${level - 1} dulu untuk membuka Level ${level}`);
  }

  showToast(msg) {
    this.toast?.destroy();
    this.toast = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 110, msg, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: this.toast,
      alpha: 0,
      delay: 1300,
      duration: 400,
      onComplete: () => {
        this.toast?.destroy();
        this.toast = null;
      },
    });
  }

  startLevel(level) {
    fadeToScene(this, SCENES.GAME, { level, score: 0 }, 250);
  }

  goBack() {
    fadeToScene(this, SCENES.MENU);
  }
}
