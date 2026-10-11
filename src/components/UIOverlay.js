import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { audioLabel, isMuted } from '../utils/audioSettings.js';
import { HUD_LAYOUT } from '../utils/uiLayout.js';

const FONT = 'Arial, sans-serif';
const DEPTH = 20;

/**
 * HUD game: timer bar, skor, indikator level, tombol Pause, toggle audio,
 * tombol Shuffle & Hint (bawah), toast, dan teks melayang.
 * Hanya menampilkan data; semua logika gameplay tetap di GameScene.
 *
 * Posisi & ukuran tombol ada di utils/uiLayout.js (HUD_LAYOUT); area sentuh
 * tiap tombol otomatis diperlebar oleh createButton.
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
   * @param {number} o.level level yang sedang dimainkan
   * @param {() => void} o.onPause
   * @param {() => void} o.onToggleBgm
   * @param {() => void} o.onToggleSfx
   */
  constructor(scene, { x, width, shuffles, onShuffle, onHint, level = 1, onPause, onToggleBgm, onToggleSfx }) {
    this.scene = scene;
    this.barX = x;
    this.barW = width;
    this.barY = 14;
    this.barH = 24;
    this.destroyed = false;
    this.toast = null;
    this.floaters = new Set();
    // Cache nilai terakhir yang digambar: setTime() dipanggil tiap frame, jangan gambar ulang bila tak berubah.
    this.lastFillWidth = -1;
    this.lastFillColor = -1;
    this.lastSecond = -1;

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
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setStroke('#000000', 3)
      .setDepth(DEPTH + 1);

    // --- Skor ---
    this.scoreText = scene.add
      .text(x, 70, 'SKOR: 0', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH);

    // --- Indikator level (sejajar dengan skor, rata kanan timer bar) ---
    this.levelText = scene.add
      .text(x + width, 70, '', {
        fontFamily: FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#7aa9ff',
      })
      .setOrigin(1, 0.5)
      .setDepth(DEPTH);
    this.setLevel(level);

    // --- Tombol atas & bawah ---
    this.pauseBtn = this.makeButton(HUD_LAYOUT.pause, 'PAUSE', onPause);
    this.bgmBtn = this.makeButton(HUD_LAYOUT.bgm, '', onToggleBgm);
    this.sfxBtn = this.makeButton(HUD_LAYOUT.sfx, '', onToggleSfx);
    this.shuffleBtn = this.makeButton(HUD_LAYOUT.shuffle, '', onShuffle);
    this.hintBtn = this.makeButton(HUD_LAYOUT.hint, 'PETUNJUK', onHint);
    this.syncAudio();
    this.setShuffles(shuffles);
  }

  /** Tombol HUD dari spesifikasi layout (posisi, ukuran, font). */
  makeButton(spec, label, onClick) {
    return createButton(this.scene, spec.x, spec.y, label, () => onClick?.(), {
      width: spec.width,
      height: spec.height,
      fontSize: spec.fontSize,
    }).setDepth(DEPTH);
  }

  /** Perbarui label tombol MUSIK / SFX sesuai status mute saat ini. */
  syncAudio() {
    [['bgm', this.bgmBtn], ['sfx', this.sfxBtn]].forEach(([channel, btn]) => {
      btn.label.setText(audioLabel(this.scene, channel));
      btn.label.setColor(isMuted(this.scene, channel) ? '#ff9aa8' : '#ffffff');
    });
  }

  setLevel(n) {
    this.levelText.setText(`LEVEL ${n}`);
  }

  setShuffles(n) {
    this.shuffleBtn.label.setText(`ACAK (${n})`);
    this.shuffleBtn.setEnabled(n > 0);
  }

  /**
   * Dipanggil setiap frame dari GameScene.update. Graphics hanya digambar ulang bila lebar
   * bar (dibulatkan ke piksel) atau warnanya berubah, dan teks hanya bila detiknya berganti —
   * bukan 60x per detik — supaya tidak membuang waktu frame.
   */
  setTime(left, max) {
    const ratio = Phaser.Math.Clamp(left / max, 0, 1);
    const color = ratio > 0.5 ? 0x4cd964 : ratio > 0.2 ? 0xffcc00 : COLORS.line;
    const fillWidth = ratio > 0 ? Math.max(8, Math.round((this.barW - 4) * ratio)) : 0;

    if (fillWidth !== this.lastFillWidth || color !== this.lastFillColor) {
      this.lastFillWidth = fillWidth;
      this.lastFillColor = color;
      this.barFill.clear();
      if (fillWidth > 0) {
        this.barFill.fillStyle(color, 1);
        this.barFill.fillRoundedRect(this.barX + 2, this.barY + 2, fillWidth, this.barH - 4, 6);
      }
    }

    const s = Math.ceil(left);
    if (s !== this.lastSecond) {
      this.lastSecond = s;
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      this.timeText.setText(`${mm}:${ss}`);
    }
  }

  setScore(n) {
    this.scoreText.setText(`SKOR: ${n}`);
    // Satu tween saja: skor yang berubah beruntun tidak menumpuk tween.
    this.scene.tweens.killTweensOf(this.scoreText);
    this.scoreText.setScale(1);
    this.scene.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.25, to: 1 },
      duration: 160,
    });
  }

  /** Teks yang naik lalu memudar di posisi (x, y), mis. "+100". */
  floatText(x, y, msg, color = '#ffe066') {
    const t = this.scene.add
      .text(x, y, msg, { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color })
      .setOrigin(0.5)
      .setStroke('#10172c', 5)
      .setShadow(0, 3, '#000000', 8)
      .setScale(0.72)
      .setDepth(DEPTH + 5);
    this.floaters.add(t);
    this.scene.tweens.add({
      targets: t,
      y: y - 64,
      alpha: 0,
      scale: 1.12,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.floaters.delete(t);
        t.destroy();
      },
    });
  }

  /** Pesan singkat di tengah layar yang memudar sendiri. Toast baru menggantikan yang lama. */
  showToast(msg) {
    this.clearToast();
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
    this.toast = t;
    this.scene.tweens.add({
      targets: t,
      alpha: 0,
      delay: 1100,
      duration: 400,
      onComplete: () => {
        if (this.toast === t) this.toast = null;
        t.destroy();
      },
    });
  }

  clearToast() {
    if (!this.toast) return;
    this.scene.tweens.killTweensOf(this.toast);
    this.toast.destroy();
    this.toast = null;
  }

  /** Buang semua objek HUD (Graphics, teks, tombol, tween yang masih jalan) dan lepas referensinya. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    const tweens = this.scene.tweens;
    this.clearToast();
    for (const t of this.floaters) {
      tweens?.killTweensOf(t);
      t.destroy();
    }
    this.floaters.clear();
    const objects = [
      this.barBg, this.barFill, this.timeText, this.scoreText, this.levelText,
      this.pauseBtn, this.bgmBtn, this.sfxBtn, this.shuffleBtn, this.hintBtn,
    ];
    for (const obj of objects) {
      tweens?.killTweensOf(obj);
      obj?.destroy();
    }
    this.barBg = this.barFill = this.timeText = this.scoreText = this.levelText = null;
    this.pauseBtn = this.bgmBtn = this.sfxBtn = this.shuffleBtn = this.hintBtn = null;
    this.scene = null;
  }
}
