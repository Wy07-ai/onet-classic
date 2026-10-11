import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants.js';

const BORDER_PAD = 4; // ruang ekstra di tepi texture agar garis tebal tidak terpotong

/**
 * Bingkai tile digambar SEKALI ke texture (per status & ukuran), lalu dipakai ulang
 * sebagai Image biasa. Sebelumnya tiap tile punya objek Graphics yang di-tessellate
 * ulang setiap frame (160 tile = 160 path rounded-rect per frame); Image ikut
 * batching sprite sehingga jauh lebih ringan di HP.
 */
const BORDER_STYLES = {
  normal: { width: 2, color: 0x000000, alpha: 0.25 },
  selected: { width: 4, color: COLORS.primaryHover, alpha: 1 },
  hint: { width: 4, color: COLORS.accent, alpha: 1 },
  invalid: { width: 4, color: COLORS.danger, alpha: 1 },
};

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

    Tile.ensureBorderTextures(scene, size);
    this.sprite = scene.add.image(0, 0, 'animal-tiles', Tile.frameFor(value));
    this.sprite.setDisplaySize(size - 8, size - 8);
    this.border = scene.add.image(0, 0, Tile.borderKey('normal', size));

    this.add([this.sprite, this.border]);
    this.setSize(size, size);
    this.setInteractive({ useHandCursor: true });
    this.draw();
    scene.add.existing(this);
  }

  static frameFor(value) {
    return (value - 1) % 24;
  }

  static borderKey(state, size) {
    return `onet-tile-border-${state}-${size}`;
  }

  /** Buat texture bingkai untuk ukuran ini bila belum ada (cache texture dipakai bersama semua scene). */
  static ensureBorderTextures(scene, size) {
    const total = size + BORDER_PAD * 2;
    for (const [state, style] of Object.entries(BORDER_STYLES)) {
      const key = Tile.borderKey(state, size);
      if (scene.textures.exists(key)) continue;
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.lineStyle(style.width, style.color, style.alpha);
      g.strokeRoundedRect(BORDER_PAD, BORDER_PAD, size, size, 8);
      g.generateTexture(key, total, total);
      g.destroy();
    }
  }

  /** Ganti jenis tile (dipakai Shuffle). Posisi grid (r, c) tidak berubah. */
  setValue(value) {
    this.value = value;
    this.sprite.setFrame(Tile.frameFor(value));
    this.draw();
  }

  draw() {
    let state = 'normal';
    if (this.selected) state = 'selected';
    else if (this.hinted) state = 'hint';
    else if (this.invalid) state = 'invalid';
    this.border.setTexture(Tile.borderKey(state, this.size));
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

  /** Hentikan tween milik tile ini sebelum objek dibuang (mencegah callback ke objek mati). */
  preDestroy() {
    this.hintTween = null;
    this.scene?.tweens?.killTweensOf(this);
    super.preDestroy();
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
