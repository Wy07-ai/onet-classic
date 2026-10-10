import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../constants.js';

/** Warna lebih gelap (dipakai sebagai warna "ditekan"). */
export function darken(color, amount = 18) {
  return Phaser.Display.Color.ValueToColor(color).darken(amount).color;
}

/**
 * Pasang efek interaktif pada sebuah tombol: tint warna + scale tween saat
 * hover / press / lepas. Dipakai bersama oleh createButton dan kartu level.
 *
 * Klik hanya dihitung bila pointer ditekan DAN dilepas di atas tombol yang sama
 * (menggeser pointer keluar sebelum melepas = batal).
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Container} target objek yang di-scale
 * @param {Phaser.GameObjects.Rectangle} hit shape yang menerima input & diwarnai
 * @param {{baseColor: number, hoverColor: number, pressColor?: number,
 *          hoverScale?: number, pressScale?: number, onClick?: Function}} opts
 * @returns {{setEnabled: (flag: boolean) => void, isEnabled: () => boolean}}
 */
export function addButtonFeedback(scene, target, hit, opts) {
  const { baseColor, hoverColor, onClick } = opts;
  const pressColor = opts.pressColor ?? darken(baseColor);
  const hoverScale = opts.hoverScale ?? 1.06;
  const pressScale = opts.pressScale ?? 0.95;
  let enabled = true;
  let pressed = false;

  const tweenScale = (scale, duration = 90) => {
    scene.tweens.killTweensOf(target);
    scene.tweens.add({ targets: target, scale, duration, ease: 'Quad.easeOut' });
  };

  hit.setInteractive({ useHandCursor: true });

  hit.on('pointerover', () => {
    if (!enabled) return;
    hit.setFillStyle(pressed ? pressColor : hoverColor);
    tweenScale(pressed ? pressScale : hoverScale);
  });

  hit.on('pointerout', () => {
    if (!enabled) return;
    hit.setFillStyle(baseColor);
    tweenScale(1);
  });

  hit.on('pointerdown', () => {
    if (!enabled) return;
    pressed = true;
    hit.setFillStyle(pressColor);
    tweenScale(pressScale, 60);
  });

  hit.on('pointerup', () => {
    if (!enabled || !pressed) return;
    pressed = false;
    hit.setFillStyle(hoverColor);
    tweenScale(hoverScale);
    onClick?.();
  });

  // Pointer dilepas di luar tombol: batalkan state "ditekan".
  hit.on('pointerupoutside', () => {
    pressed = false;
  });

  return {
    setEnabled(flag) {
      enabled = flag;
      pressed = false;
      if (!flag) {
        scene.tweens.killTweensOf(target);
        target.setScale(1);
      }
      if (hit.input) hit.input.cursor = flag ? 'pointer' : 'default';
    },
    isEnabled: () => enabled,
  };
}

/**
 * Membuat tombol interaktif (hover, press, klik) berbasis shape Phaser.
 *
 * Container berisi [background, label] (urutan dipakai kode lain lewat `list[1]`);
 * keduanya juga tersedia sebagai `.bg` dan `.label`.
 *
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} label
 * @param {Function} onClick
 * @param {{width?: number, height?: number, fontSize?: number, color?: number,
 *          hoverColor?: number, pressColor?: number}} [options]
 * @returns {Phaser.GameObjects.Container & {bg: Phaser.GameObjects.Rectangle,
 *          label: Phaser.GameObjects.Text, setEnabled: (flag: boolean) => void}}
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
    .setOrigin(0.5)
    .setShadow(0, 2, '#000000', 4, false, true);

  const container = scene.add.container(x, y, [bg, text]);
  container.bg = bg;
  container.label = text;

  const feedback = addButtonFeedback(scene, container, bg, {
    baseColor,
    hoverColor,
    pressColor: options.pressColor,
    onClick,
  });

  container.setEnabled = (flag) => {
    feedback.setEnabled(flag);
    bg.setFillStyle(flag ? baseColor : COLORS.locked);
    bg.setStrokeStyle(4, flag ? COLORS.stroke : COLORS.lockedStroke);
    text.setAlpha(flag ? 1 : 0.55);
  };

  return container;
}
