import Phaser from 'phaser';
import { COLORS, GAMEPLAY, GAME_HEIGHT, GAME_WIDTH, FONT_FAMILY, MAX_LEVEL, SCENES } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { saveHighScore } from '../utils/highScore.js';
import { addThemedBackground } from '../utils/background.js';
import { fadeToScene } from '../utils/transitions.js';
import { setupSceneCleanup } from '../utils/sceneCleanup.js';
import { isTouchDevice } from '../utils/device.js';
import { GAME_OVER_LAYOUT } from '../utils/uiLayout.js';

const PANEL = { y: 365, width: 720, height: 570 };

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }

  create({ win = false, score = 0, level = 1, timeLeft = 0 } = {}) {
    const cx = GAME_WIDTH / 2;
    const accent = win ? COLORS.success : COLORS.danger;
    const cleanup = setupSceneCleanup(this);

    this.cameras.main.fadeIn(300);
    addThemedBackground(this, { alpha: 0.1 });

    // Game Over maupun Win: simpan skor bila memecahkan rekor lama.
    const { highScore, previous, isNew } = saveHighScore(score);

    // --- Panel ---
    this.add.rectangle(cx, PANEL.y + 8, PANEL.width, PANEL.height, 0x000000, 0.35); // bayangan
    this.add.rectangle(cx, PANEL.y, PANEL.width, PANEL.height, COLORS.panel, 0.96).setStrokeStyle(4, accent);

    // --- Judul & subjudul ---
    const title = this.add
      .text(cx, 160, win ? 'YOU WIN!' : 'GAME OVER', {
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        fontStyle: 'bold',
        color: win ? '#4cd964' : '#ef476f',
        stroke: '#0b1020',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0);
    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 420, ease: 'Back.easeOut' });

    this.add
      .text(cx, 218, win ? 'Semua level berhasil diselesaikan!' : `Waktu habis di Level ${level}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#b8c4e8',
      })
      .setOrigin(0.5);

    this.add.rectangle(cx, 248, PANEL.width - 160, 2, 0x2b3768);

    // --- Skor akhir (count-up) ---
    this.add
      .text(cx, 274, 'SKOR AKHIR', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#7aa9ff',
      })
      .setOrigin(0.5);

    const scoreText = this.add
      .text(cx, 324, '0', {
        fontFamily: FONT_FAMILY,
        fontSize: '70px',
        fontStyle: 'bold',
        color: '#ffe066',
        stroke: '#0b1020',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    if (score > 0) {
      this.tweens.addCounter({
        from: 0,
        to: score,
        duration: Math.min(1100, 350 + score),
        ease: 'Cubic.easeOut',
        onUpdate: (tween) => scoreText.setText(String(Math.round(tween.getValue()))),
        onComplete: () => scoreText.setText(String(score)),
      });
    }

    // --- Indikator rekor ---
    if (isNew) {
      this.showNewHighScore(cx, 382);
      this.add
        .text(cx, 428, previous > 0 ? `Rekor lama: ${previous}` : 'Rekor pertamamu!', {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: '#b8c4e8',
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(cx, 386, `REKOR: ${highScore}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5);
      this.add
        .text(cx, 422, score === highScore ? 'Skormu menyamai rekor!' : `Kurang ${highScore - score} poin untuk memecahkan rekor`, {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: '#b8c4e8',
        })
        .setOrigin(0.5);
    }

    // --- Statistik permainan ---
    const stats = [
      ['LEVEL', `${win ? MAX_LEVEL : level} / ${MAX_LEVEL}`],
      ['PASANGAN', String(Math.floor(score / GAMEPLAY.pairScore))],
      ['SISA WAKTU', formatTime(win ? timeLeft : 0)],
    ];
    stats.forEach(([label, value], i) => this.createStatBox(cx + (i - 1) * 218, 486, 200, 76, label, value));

    // --- Tombol ---
    const { playAgain, mainMenu } = GAME_OVER_LAYOUT;
    const sizeOf = (spec) => ({ width: spec.width, height: spec.height, fontSize: spec.fontSize });
    createButton(this, playAgain.x, playAgain.y, 'PLAY AGAIN', () => this.playAgain(), {
      ...sizeOf(playAgain),
      color: COLORS.success,
      hoverColor: 0x7aea8c,
    });
    createButton(this, mainMenu.x, mainMenu.y, 'MAIN MENU', () => this.goToMenu(), sizeOf(mainMenu));

    this.add
      .text(cx, GAME_HEIGHT - 22, isTouchDevice(this) ? 'Ketuk tombol untuk melanjutkan' : 'ENTER: Main lagi   •   ESC: Menu utama', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    cleanup.once(this.input.keyboard, 'keydown-ENTER', () => this.playAgain());
    cleanup.once(this.input.keyboard, 'keydown-ESC', () => this.goToMenu());
  }

  createStatBox(x, y, w, h, label, value) {
    this.add.rectangle(x, y, w, h, 0x0f1730).setStrokeStyle(2, 0x2b3768);
    this.add
      .text(x, y - 19, label, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#7aa9ff',
      })
      .setOrigin(0.5);
    this.add
      .text(x, y + 10, value, {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  playAgain() {
    // Data eksplisit: tanpa ini Phaser memakai ulang data start sebelumnya (level terakhir)
    fadeToScene(this, SCENES.GAME, { level: 1, score: 0 }, 250);
  }

  goToMenu() {
    fadeToScene(this, SCENES.MENU);
  }

  /** Teks "NEW HIGH SCORE!" berdenyut + confetti sederhana. */
  showNewHighScore(x, y) {
    const text = this.add
      .text(x, y, 'NEW HIGH SCORE!', {
        fontFamily: FONT_FAMILY,
        fontSize: '40px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#16213e',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScale(0)
      .setAlpha(0);

    this.tweens.add({
      targets: text,
      scale: 1,
      alpha: 1,
      duration: 450,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          scale: 1.08,
          angle: { from: -2, to: 2 },
          duration: 450,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 600,
          yoyo: true,
          repeat: -1,
          onUpdate: (tween) => {
            const c = Phaser.Display.Color.Interpolate.ColorWithColor(
              new Phaser.Display.Color(255, 209, 102),
              new Phaser.Display.Color(255, 255, 255),
              100,
              tween.getValue() * 100
            );
            text.setColor(Phaser.Display.Color.RGBToString(c.r, c.g, c.b));
          },
        });
      },
    });

    const key = 'onet-confetti';
    if (!this.textures.exists(key)) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 10, 10);
      g.generateTexture(key, 10, 10);
      g.destroy();
    }
    const confetti = this.add
      .particles(x, y, key, {
        angle: { min: 200, max: 340 },
        speed: { min: 180, max: 420 },
        gravityY: 520,
        lifespan: 1400,
        scale: { start: 1, end: 0.4 },
        rotate: { min: 0, max: 360 },
        tint: [0xffd166, 0x35f3ff, 0xef476f, 0x4cd964, 0xffffff],
        emitting: false,
      })
      .setDepth(19);
    confetti.explode(60);
    // Emitter yang sudah selesai tidak perlu ikut diproses tiap frame: buang setelah partikel terakhir hilang.
    this.time.delayedCall(1600, () => confetti.destroy());
  }
}
