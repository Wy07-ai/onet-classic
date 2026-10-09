import Phaser from 'phaser';
import { SCENES, COLORS } from '../constants.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.BOOT);
  }

  preload() {
    // Nanti bisa diganti: this.load.image('logo', 'assets/images/logo.png');
    // Untuk saat ini semua asset boot dibuat prosedural (tanpa file eksternal).
  }

  create() {
    // Placeholder "logo": kotak bulat dengan huruf O
    const logo = this.make.graphics({ x: 0, y: 0 }, false);
    logo.fillStyle(COLORS.primary, 1);
    logo.fillRoundedRect(0, 0, 128, 128, 24);
    logo.lineStyle(6, COLORS.stroke, 1);
    logo.strokeRoundedRect(3, 3, 122, 122, 22);
    logo.generateTexture('logo', 128, 128);
    logo.destroy();

    // Placeholder frame & isi progress bar
    const barBg = this.make.graphics({ x: 0, y: 0 }, false);
    barBg.fillStyle(COLORS.panel, 1);
    barBg.fillRoundedRect(0, 0, 500, 32, 16);
    barBg.lineStyle(3, COLORS.stroke, 1);
    barBg.strokeRoundedRect(0, 0, 500, 32, 16);
    barBg.generateTexture('bar-bg', 500, 32);
    barBg.destroy();

    this.scene.start(SCENES.PRELOAD);
  }
}