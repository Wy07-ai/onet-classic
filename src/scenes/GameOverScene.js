import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY } from '../constants.js';
import { createButton } from '../utils/createButton.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }

  create({ win = false, score = 0 } = {}) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.fadeIn(300);

    this.add
      .text(cx, cy - 100, win ? 'YOU WIN!' : 'GAME OVER', {
        fontFamily: FONT_FAMILY,
        fontSize: '80px',
        fontStyle: 'bold',
        color: win ? '#4cd964' : '#ef476f',
        stroke: '#16213e',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 20, `Skor: ${score}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    createButton(this, cx, cy + 90, 'RESTART', () => {
      this.scene.start(SCENES.GAME);
    }, { width: 300, height: 80, fontSize: 38 });

    createButton(this, cx, cy + 190, 'MENU', () => {
      this.scene.start(SCENES.MENU);
    }, { width: 220, height: 56, fontSize: 24 });
  }
}