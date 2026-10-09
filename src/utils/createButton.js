import { COLORS, FONT_FAMILY } from '../constants.js';

/**
 * Membuat tombol interaktif (hover, press, klik) berbasis shape Phaser.
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {Function} onClick
 * @param {{width?: number, height?: number, fontSize?: number, color?: number}} [options]
 * @returns {Phaser.GameObjects.Container}
 */
export function createButton(scene, x, y, label, onClick, options = {}) {
  const width = options.width ?? 280;
  const height = options.height ?? 72;
  const fontSize = options.fontSize ?? 32;
  const baseColor = options.color ?? COLORS.primary;
  const hoverColor = options.hoverColor ?? COLORS.primaryHover;

  const bg = scene.add
    .rectangle(0, 0, width, height, baseColor)
    .setStrokeStyle(4, COLORS.stroke);

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT_FAMILY,
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, text]);

  const tweenScale = (scale) =>
    scene.tweens.add({
      targets: container,
      scale,
      duration: 90,
      ease: 'Quad.easeOut',
    });

  // Hit area ditaruh di rectangle (origin 0.5) agar posisi input akurat
  bg.setInteractive({ useHandCursor: true });

  bg.on('pointerover', () => {
    bg.setFillStyle(hoverColor);
    tweenScale(1.06);
  });

  bg.on('pointerout', () => {
    bg.setFillStyle(baseColor);
    tweenScale(1);
  });

  bg.on('pointerdown', () => tweenScale(0.95));

  bg.on('pointerup', () => {
    tweenScale(1.06);
    onClick?.();
  });

  return container;
}