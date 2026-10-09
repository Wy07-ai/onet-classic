import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { createButton } from '../utils/createButton.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENES.GAME_OVER);
  }
  init(data) {
    this.result = data || {};
  }
  create() {
    const win = this.result.win;
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, win ? 'MENANG!' : 'GAME OVER', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: win ? '#7CFC00' : '#ff4d6d',
      })
      .setOrigin(0.5);
    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.55, 'MAIN LAGI', () =>
      this.scene.start(SCENES.GAME)
    );
    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.7, 'MENU', () =>
      this.scene.start(SCENES.MENU)
    );
  }
}
