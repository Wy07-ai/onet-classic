import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants.js';

/** Posisi grid disimpan di this.r / this.c. */
export default class Tile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, value, r, c, size = TILE_SIZE) {
    super(scene, x, y);
    this.homeX = x;
    this.size = size;
    this.value = value;
    this.r = r;
    this.c = c;
    this.selected = false;
    this.hinted = false;
    this.invalid = false;
    this.hintTween = null;

    this.bg = scene.add.graphics();
    this.sprite = scene.add.image(0, 0, 'animal-tiles', Tile.frameFor(value));
    this.sprite.setDisplaySize(size - 8, size - 8);

    this.add([this.sprite, this.bg]);
    this.setSize(size, size);
    this.setInteractive({ useHandCursor: true });
    this.draw();
    scene.add.existing(this);
  }

  static frameFor(value) {
    return (value - 1) % 24;
  }

  /** Ganti jenis tile (dipakai Shuffle). Posisi grid (r, c) tidak berubah. */
  setValue(value) {
    this.value = value;
    this.sprite.setFrame(Tile.frameFor(value));
    this.draw();
  }

  draw() {
    const half = this.size / 2;
    this.bg.clear();
    if (this.selected) {
      this.bg.lineStyle(4, COLORS.primaryHover, 1);
    } else if (this.hinted) {
      this.bg.lineStyle(4, COLORS.accent, 1);
    } else if (this.invalid) {
      this.bg.lineStyle(4, COLORS.danger, 1);
    } else {
      this.bg.lineStyle(2, 0x000000, 0.25);
    }
    this.bg.strokeRoundedRect(-half, -half, this.size, this.size, 8);
  }

  setSelected(flag) {
    this.selected = flag;
    this.draw();
    this.setScale(flag ? 1.06 : 1);
  }

  /** Kedip + outline cyan (efek Hint). Berhenti sendiri setelah beberapa kedipan. */
  startHint() {
    this.stopHint();
    this.hinted = true;
    this.draw();
    this.hintTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 220,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.hintTween = null;
        this.resetHintVisual();
      },
    });
  }

  stopHint() {
    const t = this.hintTween;
    this.hintTween = null;
    if (t) t.stop();
    this.resetHintVisual();
  }

  resetHintVisual() {
    if (!this.hinted) return;
    this.hinted = false;
    this.alpha = 1;
    this.draw();
  }

  /** Getar horizontal + flash merah singkat (dipakai saat pasangan tidak cocok). */
  shake(onDone) {
    this.stopHint();
    this.scene.tweens.killTweensOf(this);
    this.invalid = true;
    this.draw();
    this.scene.tweens.add({
      targets: this,
      x: { from: this.homeX - 6, to: this.homeX + 6 },
      angle: { from: -4, to: 4 },
      alpha: { from: 0.72, to: 1 },
      duration: 45,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.x = this.homeX;
        this.angle = 0;
        this.alpha = 1;
        this.invalid = false;
        this.draw();
        if (onDone) onDone();
      },
    });
  }

  /**
   * Pindah ke sel grid baru dengan tween halus (dipakai mekanik gravitasi/geser).
   * Posisi grid (r, c) & homeX diperbarui langsung supaya state konsisten
   * meski animasi belum selesai.
   */
  moveTo(r, c, x, y, { duration = 220, ease = 'Cubic.easeInOut' } = {}, onDone) {
    this.stopHint();
    this.scene.tweens.killTweensOf(this);
    this.angle = 0;
    this.alpha = 1;
    this.invalid = false;
    this.draw();
    this.r = r;
    this.c = c;
    this.homeX = x;
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease,
      onComplete: () => {
        this.x = x;
        this.y = y;
        if (onDone) onDone();
      },
    });
  }

  /** Animasi hilang (mengecil + memudar) lalu destroy. */
  vanish(onDone) {
    this.stopHint();
    this.disableInteractive();
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        this.destroy();
        if (onDone) onDone();
      },
    });
  }
}
