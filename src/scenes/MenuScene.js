import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, MAX_LEVEL } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { getHighScore } from '../utils/highScore.js';
import { getUnlockedLevel } from '../utils/levelProgress.js';
import { addThemedBackground } from '../utils/background.js';
import { fadeToScene } from '../utils/transitions.js';
import { setupSceneCleanup } from '../utils/sceneCleanup.js';
import { isTouchDevice } from '../utils/device.js';
import { MENU_LAYOUT, SETTINGS_LAYOUT } from '../utils/uiLayout.js';
import { getSelectedMapTheme, MAP_THEMES, setSelectedMapTheme } from '../utils/mapThemes.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cleanup = setupSceneCleanup(this, () => {
      this.settingsObjects = null;
    });

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

    // Tombol PLAY, SELECT LEVEL, dan SETTINGS.
    const { play, levelSelect, settings } = MENU_LAYOUT;
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
    createButton(this, settings.x, settings.y, 'PENGATURAN', () => this.openSettings(), {
      width: settings.width,
      height: settings.height,
      fontSize: settings.fontSize,
    });

    // Rekor & progres
    this.add
      .text(cx, 645, `High Score: ${getHighScore()}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#16213e',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 673, `Level terbuka: ${getUnlockedLevel()} / ${MAX_LEVEL}`, {
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

  openSettings() {
    if (this.settingsObjects) return;

    const addSettingsObject = (object, depth = 12) => {
      object.setDepth(depth);
      this.settingsObjects.push(object);
      return object;
    };
    this.settingsObjects = [];

    addSettingsObject(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d1c, 0.78).setInteractive(),
      10
    );
    addSettingsObject(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 480, COLORS.panel, 0.98).setStrokeStyle(4, COLORS.stroke),
      11
    );
    addSettingsObject(
      this.add
        .text(GAME_WIDTH / 2, 245, 'PENGATURAN', {
          fontFamily: FONT_FAMILY,
          fontSize: '38px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
    );
    addSettingsObject(
      this.add
        .text(GAME_WIDTH / 2, 315, 'PILIH TEMA MAP', {
          fontFamily: FONT_FAMILY,
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#ffd166',
        })
        .setOrigin(0.5)
    );

    const themeLayouts = [SETTINGS_LAYOUT.themeFaces, SETTINGS_LAYOUT.themeCountries, SETTINGS_LAYOUT.themeFood];
    MAP_THEMES.forEach((theme, index) => {
      const layout = themeLayouts[index];
      const isSelected = getSelectedMapTheme().id === theme.id;
      const button = createButton(
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
      addSettingsObject(button);
    });

    const back = SETTINGS_LAYOUT.back;
    const backButton = createButton(this, back.x, back.y, 'KEMBALI', () => this.closeSettings(), {
      width: back.width,
      height: back.height,
      fontSize: back.fontSize,
      color: COLORS.locked,
      hoverColor: COLORS.primaryHover,
    });
    addSettingsObject(backButton);
  }

  closeSettings() {
    this.settingsObjects?.forEach((object) => object.destroy());
    this.settingsObjects = null;
  }

  startGame() {
    fadeToScene(this, SCENES.GAME, { level: 1, score: 0, mapTheme: getSelectedMapTheme().id }, 250);
  }

  openLevelSelect() {
    fadeToScene(this, SCENES.LEVEL_SELECT);
  }
}
