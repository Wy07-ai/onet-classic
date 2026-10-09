import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS } from '../constants.js';
import { createButton } from '../utils/createButton.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME);
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this.cameras.main.fadeIn(250);

    this.add
      .text(cx, 90, 'Game Scene Loaded', {
        fontFamily: FONT_FAMILY,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Area papan (placeholder) - tempat board Onet akan dirender di fase berikutnya
    const boardW = 760;
    const boardH = 340;
    const boardY = GAME_HEIGHT / 2 + 10;

    this.add
      .rectangle(cx, boardY, boardW, boardH, COLORS.panel)
      .setStrokeStyle(4, COLORS.primary);

    this.add
      .text(cx, boardY - boardH / 2 + 28, '[ Board Area ]', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    // Tile placeholder agar terlihat sesuatu
    for (let i = 0; i < 5; i++) {
      this.add.image(cx - 200 + i * 100, boardY + 10, 'animal-tiles', i).setDisplaySize(56, 56);
    }

    // Tombol navigasi
    createButton(this, 200, GAME_HEIGHT - 70, 'MENU', () => {
      this.scene.start(SCENES.MENU);
    }, { width: 220, height: 64, fontSize: 28 });

    // Tombol debug untuk menguji alur ke GameOverScene
    createButton(this, GAME_WIDTH - 220, GAME_HEIGHT - 70, 'END GAME (debug)', () => {
      this.scene.start(SCENES.GAME_OVER);
    }, {
      width: 320,
      height: 64,
      fontSize: 24,
      color: COLORS.danger,
      hoverColor: 0xff7a95,
    });
  }
}