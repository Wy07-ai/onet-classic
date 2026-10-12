import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, MAX_LEVEL } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { getHighScore } from '../utils/highScore.js';
import { getUnlockedLevel } from '../utils/levelProgress.js';
import { addThemedBackground } from '../utils/background.js';
import { fadeToScene } from '../utils/transitions.js';
import { setupSceneCleanup } from '../utils/sceneCleanup.js';
import { isTouchDevice } from '../utils/device.js';
import { MENU_LAYOUT } from '../utils/uiLayout.js';
import { getSelectedMapTheme, MAP_THEMES, setSelectedMapTheme } from '../utils/mapThemes.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cleanup = setupSceneCleanup(this);

    this.cameras.main.fadeIn(300);
    addThemedBackground(this);
    const selectedTheme = getSelectedMapTheme();

    // Deretan tile hias yang melayang pelan di atas judul
    for (let i = 0; i < 5; i++) {
      const x = cx - 240 + i * 120;
      this.add.ellipse(x, 214, 70, 14, 0x000000, 0.28); // bayangan
      const tile = this.add.image(x, 160, selectedTheme.textureKey, i * 3).setScale(0.72);
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
      .text(cx, 266, 'ONET CLASSIC', {
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
      .text(cx, 332, 'Sambungkan dua tile yang sama  •  maksimal 2 belokan', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color: '#b8c4e8',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 372, 'PILIH TEMA MAP', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
      })
      .setOrigin(0.5);

    const themeButtons = [
      { theme: MAP_THEMES[0], layout: MENU_LAYOUT.themeFaces },
      { theme: MAP_THEMES[1], layout: MENU_LAYOUT.themeCountries },
      { theme: MAP_THEMES[2], layout: MENU_LAYOUT.themeFood },
    ];
    themeButtons.forEach(({ theme, layout }) => {
      const isSelected = selectedTheme.id === theme.id;
      createButton(
        this,
        layout.x,
        layout.y,
        `${theme.preview} ${theme.label}`,
        () => {
          if (getSelectedMapTheme().id === theme.id) return;
          setSelectedMapTheme(theme.id);
          this.scene.restart();
        },
        {
          width: layout.width,
          height: layout.height,
          fontSize: layout.fontSize,
          color: isSelected ? COLORS.success : COLORS.primary,
          hoverColor: isSelected ? 0x7aea8c : COLORS.primaryHover,
        }
      );
    });

    // Tombol PLAY -> GameScene, SELECT LEVEL -> LevelSelectScene
    const { play, levelSelect } = MENU_LAYOUT;
    createButton(this, play.x, play.y, 'PLAY', () => this.startGame(), {
      width: play.width,
      height: play.height,
      fontSize: play.fontSize,
      color: COLORS.success,
      hoverColor: 0x7aea8c,
    });
    createButton(this, levelSelect.x, levelSelect.y, 'SELECT LEVEL', () => this.openLevelSelect(), {
      width: levelSelect.width,
      height: levelSelect.height,
      fontSize: levelSelect.fontSize,
    });

    // Rekor & progres
    this.add
      .text(cx, 651, `High Score: ${getHighScore()}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#16213e',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 679, `Level terbuka: ${getUnlockedLevel()} / ${MAX_LEVEL}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#7aa9ff',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, GAME_HEIGHT - 15, isTouchDevice(this) ? 'Ketuk PLAY untuk mulai' : 'ENTER: Main   •   L: Pilih Level', {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    // Shortcut keyboard
    cleanup.once(this.input.keyboard, 'keydown-ENTER', () => this.startGame());
    cleanup.once(this.input.keyboard, 'keydown-L', () => this.openLevelSelect());
  }

  startGame() {
    fadeToScene(this, SCENES.GAME, { level: 1, score: 0, mapTheme: getSelectedMapTheme().id }, 250);
  }

  openLevelSelect() {
    fadeToScene(this, SCENES.LEVEL_SELECT);
  }
}
