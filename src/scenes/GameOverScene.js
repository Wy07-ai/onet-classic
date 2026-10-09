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
    const { win = false, score = 0, timeLeft = 0 } = this.result;
    const font = 'Arial, sans-serif';

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, win ? 'MENANG!' : 'GAME OVER', {
        fontFamily: font,
        fontSize: '72px',
        fontStyle: 'bold',
        color: win ? '#7CFC00' : '#ff4d6d',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.37,
        win ? `Papan bersih! Sisa waktu ${timeLeft} detik` : 'Waktu habis sebelum papan bersih',
        { fontFamily: font, fontSize: '26px', color: '#c8d0f0' }
      )
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.46, `SKOR AKHIR: ${score}`, {
        fontFamily: font,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffe066',
      })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.62, 'MAIN LAGI', () =>
      this.scene.start(SCENES.GAME)
    );
    createButton(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.76, 'MENU', () =>
      this.scene.start(SCENES.MENU)
    );
  }
}
