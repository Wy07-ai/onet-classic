import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js';
import { createButton } from '../utils/createButton.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }
  create() {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'ONET CLASSIC', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5);
    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.55, 'MAIN', () =>
      this.scene.start(SCENES.GAME)
    );
  }
}
