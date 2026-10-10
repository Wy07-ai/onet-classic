import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { saveHighScore } from '../utils/highScore.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }

  create({ win = false, score = 0, level = 1 } = {}) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.fadeIn(300);

    // Game Over maupun Win: simpan skor bila memecahkan rekor lama.
    const { highScore, isNew } = saveHighScore(score);

    this.add
      .text(cx, cy - 100, win ? 'YOU WIN!' : 'GAME OVER', {
        fontFamily: FONT_FAMILY,
        fontSize: '80px',
        fontStyle: 'bold',
        color: win ? '#4cd964' : '#ef476f',
        stroke: '#16213e',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 20, `Skor: ${score}  •  ${win ? 'Semua level selesai' : `Level ${level}`}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy + 35, `High Score: ${highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    if (isNew) this.showNewHighScore(cx, cy - 180);

    createButton(this, cx, cy + 105, 'RESTART', () => {
      // Data eksplisit: tanpa ini Phaser memakai ulang data start sebelumnya (level terakhir)
      this.scene.start(SCENES.GAME, { level: 1, score: 0 });
    }, { width: 300, height: 80, fontSize: 38 });

    createButton(this, cx, cy + 200, 'MENU', () => {
      this.scene.start(SCENES.MENU);
    }, { width: 220, height: 56, fontSize: 24 });
  }

  /** Teks "NEW HIGH SCORE!" berdenyut + confetti sederhana. */
  showNewHighScore(x, y) {
    const text = this.add
      .text(x, y, 'NEW HIGH SCORE!', {
        fontFamily: FONT_FAMILY,
        fontSize: '44px',
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
          scale: 1.12,
          angle: { from: -3, to: 3 },
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
    this.add
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
      .setDepth(19)
      .explode(60);
  }
}
