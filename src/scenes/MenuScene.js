import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, MAX_LEVEL } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { getHighScore } from '../utils/highScore.js';
import { getUnlockedLevel } from '../utils/levelProgress.js';
import { addThemedBackground } from '../utils/background.js';
import { fadeToScene } from '../utils/transitions.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const cx = GAME_WIDTH / 2;

    this.cameras.main.fadeIn(300);
    addThemedBackground(this);

    // Deretan tile hias yang melayang pelan di atas judul
    for (let i = 0; i < 5; i++) {
      const x = cx - 240 + i * 120;
      this.add.ellipse(x, 214, 70, 14, 0x000000, 0.28); // bayangan
      const tile = this.add.image(x, 160, 'animal-tiles', i * 3).setScale(0.72);
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
    const title = this.add
      .text(cx, 285, 'ONET CLASSIC', {
        fontFamily: FONT_FAMILY,
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#16213e',
        strokeThickness: 12,
        padding: { x: 40, y: 40 }, // ruang untuk blur glow agar tidak terpotong jadi kotak
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#4f8cff', 24, true, true);
    this.tweens.add({
      targets: title,
      scale: 1.025,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add
      .text(cx, 352, 'Sambungkan dua tile yang sama  •  maksimal 2 belokan', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#b8c4e8',
      })
      .setOrigin(0.5);

    // Tombol PLAY -> GameScene, SELECT LEVEL -> LevelSelectScene
    createButton(this, cx, 438, 'PLAY', () => this.startGame(), {
      width: 320,
      height: 80,
      fontSize: 38,
      color: COLORS.success,
      hoverColor: 0x7aea8c,
    });
    createButton(this, cx, 534, 'SELECT LEVEL', () => this.openLevelSelect(), {
      width: 320,
      height: 64,
      fontSize: 28,
    });

    // Rekor & progres
    this.add
      .text(cx, 614, `High Score: ${getHighScore()}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#16213e',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 650, `Level terbuka: ${getUnlockedLevel()} / ${MAX_LEVEL}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#7aa9ff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 22, 'ENTER: Main   •   L: Pilih Level', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    // Shortcut keyboard
    this.input.keyboard.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard.once('keydown-L', () => this.openLevelSelect());
  }

  startGame() {
    fadeToScene(this, SCENES.GAME, { level: 1, score: 0 }, 250);
  }

  openLevelSelect() {
    fadeToScene(this, SCENES.LEVEL_SELECT);
  }
}
