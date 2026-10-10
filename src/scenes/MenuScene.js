import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS } from '../constants.js';
import { createButton } from '../utils/createButton.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.fadeIn(300);

    // Dekorasi: deretan tile placeholder yang melayang pelan
    for (let i = 0; i < 5; i++) {
      const tile = this.add.image(cx - 240 + i * 120, cy - 170, 'animal-tiles', i).setScale(0.72);
      this.tweens.add({
        targets: tile,
        y: tile.y - 12,
        duration: 900 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Judul
    this.add
      .text(cx, cy - 60, 'ONET CLASSIC', {
        fontFamily: FONT_FAMILY,
        fontSize: '84px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#16213e',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    // Tombol PLAY -> GameScene
    createButton(this, cx, cy + 90, 'PLAY', () => this.startGame(), {
      width: 300,
      height: 80,
      fontSize: 38,
    });

    this.add
      .text(cx, GAME_HEIGHT - 40, 'Klik PLAY atau tekan ENTER', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    // Shortcut keyboard
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
  }

  startGame() {
    if (this.starting) return;
    this.starting = true;

    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME, { level: 1, score: 0 });
    });
  }
}