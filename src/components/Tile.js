import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants.js';

/**
 * Kartu Onet sederhana: kotak berwarna + angka (placeholder sebelum ada sprite).
 * Posisi grid disimpan di this.r / this.c.
 */
export default class Tile extends Phaser.GameObjects.Container {
  constructor(scene, x, y, value, r, c) {
    super(scene, x, y);
    this.value = value;
    this.r = r;
    this.c = c;
    this.selected = false;

    const half = TILE_SIZE / 2;
    const hue = ((value * 47) % 360) / 360; // warna unik per tipe
    this.fillColor = Phaser.Display.Color.HSLToColor(hue, 0.65, 0.55).color;

    this.bg = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, String(value), {
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.label.setStroke('#000000', 3);

    this.add([this.bg, this.label]);
    this.setSize(TILE_SIZE, TILE_SIZE);
    this.setInteractive({ useHandCursor: true });
    this.draw();
    scene.add.existing(this);
    this._half = half;
  }

  draw() {
    const half = TILE_SIZE / 2;
    this.bg.clear();
    this.bg.fillStyle(this.fillColor, 1);
    this.bg.fillRoundedRect(-half, -half, TILE_SIZE, TILE_SIZE, 8);
    if (this.selected) {
      this.bg.lineStyle(4, COLORS.highlight, 1);
      this.bg.strokeRoundedRect(-half, -half, TILE_SIZE, TILE_SIZE, 8);
    } else {
      this.bg.lineStyle(2, 0x000000, 0.35);
      this.bg.strokeRoundedRect(-half, -half, TILE_SIZE, TILE_SIZE, 8);
    }
  }

  setSelected(flag) {
    this.selected = flag;
    this.draw();
    this.setScale(flag ? 1.06 : 1);
  }

  /** Getar horizontal + flash merah singkat (dipakai saat pasangan tidak cocok). */
  shake(onDone) {
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 5, to: this.x + 5 },
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.x = this.getData('homeX') ?? this.x;
        if (onDone) onDone();
      },
    });
    const half = TILE_SIZE / 2;
    this.bg.lineStyle(4, 0xff0000, 1);
    this.bg.strokeRoundedRect(-half, -half, TILE_SIZE, TILE_SIZE, 8);
  }

  /** Animasi hilang (mengecil + memudar) lalu destroy. */
  vanish(onDone) {
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
