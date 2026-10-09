import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants.js';

const FONT = 'Arial, sans-serif';
const DEPTH = 20;

/**
 * HUD game: timer bar (atas), skor, tombol Shuffle & Hint (bawah), toast, dan teks melayang.
 * Hanya menampilkan data; semua logika gameplay tetap di GameScene.
 */
export default class UIOverlay {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} o
   * @param {number} o.x kiri timer bar
   * @param {number} o.width lebar timer bar
   * @param {number} o.shuffles jatah awal shuffle
   * @param {() => void} o.onShuffle
   * @param {() => void} o.onHint
   */
  constructor(scene, { x, width, shuffles, onShuffle, onHint }) {
    this.scene = scene;
    this.barX = x;
    this.barW = width;
    this.barY = 14;
    this.barH = 22;

    // --- Timer bar ---
    this.barBg = scene.add.graphics().setDepth(DEPTH);
    this.barBg.fillStyle(0x1b2447, 1);
    this.barBg.fillRoundedRect(x, this.barY, width, this.barH, 8);
    this.barBg.lineStyle(2, 0x2b3768, 1);
    this.barBg.strokeRoundedRect(x, this.barY, width, this.barH, 8);

    this.barFill = scene.add.graphics().setDepth(DEPTH);
    this.timeText = scene.add
      .text(x + width / 2, this.barY + this.barH / 2, '', {
        fontFamily: FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 3)
      .setDepth(DEPTH + 1);

    // --- Skor ---
    this.scoreText = scene.add
      .text(x, 62, 'SKOR: 0', {
        fontFamily: FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH);

    // --- Tombol bawah ---
    const by = GAME_HEIGHT - 42;
    this.shuffleBtn = this.makeButton(GAME_WIDTH / 2 - 130, by, onShuffle);
    this.hintBtn = this.makeButton(GAME_WIDTH / 2 + 130, by, onHint);
    this.hintBtn.text.setText('PETUNJUK');
    this.setShuffles(shuffles);
  }

  makeButton(x, y, onClick) {
    const btn = { enabled: true };
    btn.text = this.scene.add
      .text(x, y, '', {
        fontFamily: FONT,
        fontSize: '26px',
        color: '#ffffff',
        backgroundColor: '#3a56d4',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    btn.text.on('pointerover', () => btn.enabled && btn.text.setBackgroundColor('#5775f0'));
    btn.text.on('pointerout', () => btn.enabled && btn.text.setBackgroundColor('#3a56d4'));
    btn.text.on('pointerup', () => btn.enabled && onClick());
    return btn;
  }

  setButtonEnabled(btn, flag) {
    btn.enabled = flag;
    btn.text.setBackgroundColor(flag ? '#3a56d4' : '#3a3f55');
    btn.text.setColor(flag ? '#ffffff' : '#8a8fa8');
    btn.text.input.cursor = flag ? 'pointer' : 'default';
  }

  setShuffles(n) {
    this.shuffleBtn.text.setText(`ACAK (${n})`);
    this.setButtonEnabled(this.shuffleBtn, n > 0);
  }

  setTime(left, max) {
    const ratio = Phaser.Math.Clamp(left / max, 0, 1);
    const color = ratio > 0.5 ? 0x4cd964 : ratio > 0.2 ? 0xffcc00 : COLORS.line;
    this.barFill.clear();
    if (ratio > 0) {
      this.barFill.fillStyle(color, 1);
      this.barFill.fillRoundedRect(
        this.barX + 2,
        this.barY + 2,
        Math.max(8, (this.barW - 4) * ratio),
        this.barH - 4,
        6
      );
    }
    const s = Math.ceil(left);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    this.timeText.setText(`${mm}:${ss}`);
  }

  setScore(n) {
    this.scoreText.setText(`SKOR: ${n}`);
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.25, to: 1 },
      duration: 160,
    });
  }

  /** Teks yang naik lalu memudar di posisi (x, y), mis. "+100". */
  floatText(x, y, msg, color = '#ffe066') {
    const t = this.scene.add
      .text(x, y, msg, { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setStroke('#000000', 4)
      .setDepth(DEPTH + 5);
    this.scene.tweens.add({
      targets: t,
      y: y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => t.destroy(),
    });
  }

  /** Pesan singkat di tengah layar yang memudar sendiri. */
  showToast(msg) {
    const t = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, msg, {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 10);
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      delay: 1100,
      duration: 400,
      onComplete: () => t.destroy(),
    });
  }
}
