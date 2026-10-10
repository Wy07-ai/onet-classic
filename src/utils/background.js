import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.js';

const BG_KEY = 'onet-themed-bg';
const FRAME_COUNT = 24; // jumlah frame di spritesheet animal-tiles

/** Gambar sekali (gradien + glow + pola titik + vignette) ke texture canvas, dipakai ulang antar scene. */
function ensureBackgroundTexture(scene) {
  if (scene.textures.exists(BG_KEY)) return;
  const tex = scene.textures.createCanvas(BG_KEY, GAME_WIDTH, GAME_HEIGHT);
  const ctx = tex.getContext();

  // Gradien dasar: biru malam -> indigo
  const base = ctx.createLinearGradient(0, 0, GAME_WIDTH * 0.35, GAME_HEIGHT);
  base.addColorStop(0, '#0b1020');
  base.addColorStop(0.55, '#14204a');
  base.addColorStop(1, '#1d1b4b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Pola titik halus seperti papan permainan
  ctx.fillStyle = 'rgba(122, 169, 255, 0.07)';
  for (let y = 24; y < GAME_HEIGHT; y += 48) {
    for (let x = 24; x < GAME_WIDTH; x += 48) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Glow biru di belakang judul
  const glow = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 20, GAME_WIDTH / 2, GAME_HEIGHT * 0.36, 560);
  glow.addColorStop(0, 'rgba(79, 140, 255, 0.32)');
  glow.addColorStop(1, 'rgba(79, 140, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Glow hangat di sudut bawah
  const warm = ctx.createRadialGradient(GAME_WIDTH * 0.85, GAME_HEIGHT * 1.0, 10, GAME_WIDTH * 0.85, GAME_HEIGHT * 1.0, 420);
  warm.addColorStop(0, 'rgba(255, 209, 102, 0.16)');
  warm.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Vignette: pinggir layar lebih gelap supaya fokus ke tengah
  const vignette = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.45, GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  tex.refresh();
}

/**
 * Latar bertema Onet: gradien malam + tile hewan transparan yang melayang pelan.
 * Semua objek diberi depth sangat rendah sehingga selalu di belakang UI.
 *
 * @param {Phaser.Scene} scene
 * @param {{cols?: number, rows?: number, alpha?: number}} [options] sebaran tile hias
 * @returns {Phaser.GameObjects.Image[]} tile hias (untuk keperluan tes / kustomisasi)
 */
export function addThemedBackground(scene, { cols = 7, rows = 4, alpha = 0.16 } = {}) {
  ensureBackgroundTexture(scene);
  scene.add.image(0, 0, BG_KEY).setOrigin(0).setDepth(-100);

  const decor = [];
  const cellW = GAME_WIDTH / cols;
  const cellH = GAME_HEIGHT / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * cellW + Phaser.Math.Between(-cellW * 0.3, cellW * 0.3);
      const y = (r + 0.5) * cellH + Phaser.Math.Between(-cellH * 0.3, cellH * 0.3);
      const size = Phaser.Math.Between(54, 92);
      const tile = scene.add
        .image(x, y, 'animal-tiles', Phaser.Math.Between(0, FRAME_COUNT - 1))
        .setDisplaySize(size, size)
        .setAlpha(alpha * Phaser.Math.FloatBetween(0.7, 1.2))
        .setAngle(Phaser.Math.Between(-18, 18))
        .setDepth(-90);

      scene.tweens.add({
        targets: tile,
        y: y + Phaser.Math.Between(14, 30) * (Math.random() < 0.5 ? -1 : 1),
        angle: tile.angle + Phaser.Math.Between(-9, 9),
        duration: Phaser.Math.Between(2600, 4800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1500),
      });
      decor.push(tile);
    }
  }
  return decor;
}
