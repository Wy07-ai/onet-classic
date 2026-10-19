import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS, MAX_LEVEL } from '../constants.js';
import { createButton } from '../utils/createButton.js';
import { getHighScore } from '../utils/highScore.js';
import { getUnlockedLevel } from '../utils/levelProgress.js';
import { addThemedBackground } from '../utils/background.js';
import { isMuted, toggleMuted } from '../utils/audioSettings.js';
import { fadeToScene } from '../utils/transitions.js';
import { setupSceneCleanup } from '../utils/sceneCleanup.js';
import { isTouchDevice } from '../utils/device.js';
import { MENU_LAYOUT, SETTINGS_LAYOUT, SETTINGS_PANEL, SETTINGS_SECTIONS } from '../utils/uiLayout.js';
import { getSelectedMapTheme, MAP_THEMES, setSelectedMapTheme } from '../utils/mapThemes.js';
import {
  describeDifficulty,
  DIFFICULTIES,
  getSelectedDifficulty,
  setSelectedDifficulty,
} from '../utils/difficulty.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.MENU);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cleanup = setupSceneCleanup(this, () => {
      this.settingsObjects = null;
      this.settingsThemeButtons = null;
      this.settingsDifficultyButtons = null;
      this.highScoreText = null;
      this.decorativeTiles = null;
    });

    this.cameras.main.fadeIn(300);
    addThemedBackground(this);
    const selectedTheme = getSelectedMapTheme();
    this.decorativeTiles = [];

    // Deretan tile hias yang melayang pelan di atas judul
    for (let i = 0; i < 5; i++) {
      const x = cx - 240 + i * 120;
      this.add.ellipse(x, 214, 70, 14, 0x000000, 0.28); // bayangan
      const tile = this.add.image(x, 160, selectedTheme.textureKey, i * 3).setScale(0.72);
      this.decorativeTiles.push(tile);
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
    this.highScoreText = this.add
      .text(cx, 645, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#16213e',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.refreshHighScore();
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
    cleanup.on(this.input.keyboard, 'keydown-ESC', () => this.closeSettings());
  }

  openSettings() {
    if (this.settingsObjects) return;

    const addSettingsObject = (object, depth = 12) => {
      object.setDepth(depth);
      this.settingsObjects.push(object);
      return object;
    };
    this.settingsObjects = [];
    const cx = GAME_WIDTH / 2;

    // Latar gelap + panel
    addSettingsObject(
      this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d1c, 0.82).setInteractive(),
      10
    );
    addSettingsObject(
      this.add
        .rectangle(SETTINGS_PANEL.x, SETTINGS_PANEL.y, SETTINGS_PANEL.width, SETTINGS_PANEL.height, COLORS.panel, 0.99)
        .setStrokeStyle(4, COLORS.primary),
      11
    );

    // Judul + garis aksen
    addSettingsObject(
      this.add
        .text(cx, 90, 'PENGATURAN', {
          fontFamily: FONT_FAMILY,
          fontSize: '40px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setShadow(0, 4, '#4f8cff', 14, true, true)
    );
    addSettingsObject(this.add.rectangle(cx, 122, 120, 4, COLORS.accent));

    const addSectionHeading = (y, label) => {
      addSettingsObject(
        this.add
          .text(cx, y, label, {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffd166',
          })
          .setOrigin(0.5)
      );
    };
    const addDivider = (y) => {
      addSettingsObject(this.add.rectangle(cx, y, 1040, 2, 0x3b4d78, 0.9));
    };

    // Bagian 1: audio
    addSectionHeading(SETTINGS_SECTIONS.audioHeading, 'AUDIO');
    const audioButtons = {};
    const addAudioToggle = (channel, layout, label) => {
      const button = createButton(
        this,
        layout.x,
        layout.y,
        '',
        () => {
          toggleMuted(this, channel);
          this.syncSettingsAudio(audioButtons);
        },
        {
          width: layout.width,
          height: layout.height,
          fontSize: layout.fontSize,
          color: COLORS.success,
          hoverColor: 0x7aea8c,
        }
      );
      button.audioLabel = label;
      audioButtons[channel] = button;
      addSettingsObject(button);
    };
    addAudioToggle('bgm', SETTINGS_LAYOUT.bgm, 'MUSIK LATAR');
    addAudioToggle('sfx', SETTINGS_LAYOUT.sfx, 'EFEK SUARA');
    this.syncSettingsAudio(audioButtons);

    addDivider(SETTINGS_SECTIONS.audioDivider);

    // Bagian 2: tingkat kesulitan (tiga kartu: label + ringkasan aturan)
    addSectionHeading(SETTINGS_SECTIONS.difficultyHeading, 'TINGKAT KESULITAN');
    const difficultyLayouts = {
      easy: SETTINGS_LAYOUT.difficultyEasy,
      normal: SETTINGS_LAYOUT.difficultyNormal,
      hard: SETTINGS_LAYOUT.difficultyHard,
    };
    this.settingsDifficultyButtons = new Map();
    DIFFICULTIES.forEach((difficulty) => {
      const layout = difficultyLayouts[difficulty.id];
      const card = createButton(
        this,
        layout.x,
        layout.y,
        difficulty.label,
        () => {
          if (getSelectedDifficulty().id === difficulty.id) return;
          setSelectedDifficulty(difficulty.id);
          this.syncSettingsDifficulty();
          this.refreshHighScore();
        },
        {
          width: layout.width,
          height: layout.height,
          fontSize: layout.fontSize,
          color: COLORS.primary,
          hoverColor: COLORS.primaryHover,
        }
      );

      // Label di atas, ringkasan aturan (waktu & jatah acak) di bawahnya.
      card.label.setY(-17);
      card.add(
        this.add
          .text(0, 17, describeDifficulty(difficulty), {
            fontFamily: FONT_FAMILY,
            fontSize: '16px',
            color: '#dbe6ff',
          })
          .setOrigin(0.5)
      );

      // Lencana centang di pojok kanan atas kartu aktif.
      const badge = this.add.container(layout.width / 2 - 6, -layout.height / 2 + 6, [
        this.add.circle(0, 0, 14, COLORS.accent).setStrokeStyle(3, COLORS.stroke),
        this.add
          .text(0, 0, '✓', { fontFamily: FONT_FAMILY, fontSize: '18px', fontStyle: 'bold', color: '#16213e' })
          .setOrigin(0.5),
      ]);
      card.add(badge);
      card.badge = badge;
      // createButton mengembalikan warna dasar saat pointer keluar; sinkronkan agar kartu aktif tetap hijau.
      card.bg.on('pointerout', () => this.settingsDifficultyButtons && this.syncSettingsDifficulty());

      this.settingsDifficultyButtons.set(difficulty.id, card);
      addSettingsObject(card);
    });
    this.syncSettingsDifficulty();

    addDivider(SETTINGS_SECTIONS.difficultyDivider);

    // Bagian 3: tema map (tiga kartu dengan contoh tile)
    addSectionHeading(SETTINGS_SECTIONS.themeHeading, 'PILIH TEMA MAP');
    const themeLayouts = {
      faces: SETTINGS_LAYOUT.themeFaces,
      countries: SETTINGS_LAYOUT.themeCountries,
      food: SETTINGS_LAYOUT.themeFood,
    };
    const previewFrames = [0, 4, 8];
    this.settingsThemeButtons = new Map();
    MAP_THEMES.forEach((theme) => {
      const layout = themeLayouts[theme.id];
      const card = createButton(
        this,
        layout.x,
        layout.y,
        theme.label,
        () => {
          if (getSelectedMapTheme().id === theme.id) return;
          setSelectedMapTheme(theme.id);
          this.decorativeTiles.forEach((tile, tileIndex) => {
            tile.setTexture(theme.textureKey, tileIndex * 3);
          });
          this.syncSettingsThemes();
        },
        {
          width: layout.width,
          height: layout.height,
          fontSize: layout.fontSize,
          color: COLORS.primary,
          hoverColor: COLORS.primaryHover,
        }
      );

      // Contoh tile di bagian atas kartu, label di bawahnya.
      card.label.setY(layout.height / 2 - 24);
      previewFrames.forEach((frame, index) => {
        const sample = this.add.image((index - 1) * 74, -18, theme.textureKey, frame).setScale(0.56);
        card.add(sample);
      });

      // Lencana centang di pojok kanan atas kartu aktif.
      const badge = this.add.container(layout.width / 2 - 6, -layout.height / 2 + 6, [
        this.add.circle(0, 0, 18, COLORS.accent).setStrokeStyle(3, COLORS.stroke),
        this.add
          .text(0, 0, '\u2713', { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: 'bold', color: '#16213e' })
          .setOrigin(0.5),
      ]);
      card.add(badge);
      card.badge = badge;
      // createButton mengembalikan warna dasar saat pointer keluar; sinkronkan agar kartu aktif tetap hijau.
      card.bg.on('pointerout', () => this.settingsThemeButtons && this.syncSettingsThemes());

      this.settingsThemeButtons.set(theme.id, card);
      addSettingsObject(card);
    });
    this.syncSettingsThemes();

    addDivider(SETTINGS_SECTIONS.themeDivider);

    // Tombol tutup, kembali, dan versi
    const close = SETTINGS_LAYOUT.close;
    addSettingsObject(
      createButton(this, close.x, close.y, 'X', () => this.closeSettings(), {
        width: close.width,
        height: close.height,
        fontSize: close.fontSize,
        color: COLORS.danger,
        hoverColor: 0xff7a96,
      })
    );

    const back = SETTINGS_LAYOUT.back;
    addSettingsObject(
      createButton(this, back.x, back.y, 'KEMBALI', () => this.closeSettings(), {
        width: back.width,
        height: back.height,
        fontSize: back.fontSize,
        color: COLORS.locked,
        hoverColor: COLORS.primaryHover,
      })
    );

    addSettingsObject(
      this.add
        .text(cx, SETTINGS_SECTIONS.version, 'Onet Classic v0.1.0', {
          fontFamily: FONT_FAMILY,
          fontSize: '15px',
          color: '#8899bb',
        })
        .setOrigin(0.5)
    );
  }

  syncSettingsAudio(buttons) {
    for (const [channel, button] of Object.entries(buttons)) {
      const muted = isMuted(this, channel);
      button.label.setText(`${button.audioLabel}: ${muted ? 'OFF' : 'ON'}`);
      button.label.setColor(muted ? '#ff9aa8' : '#ffffff');
      button.bg.setFillStyle(muted ? COLORS.locked : COLORS.success);
    }
  }

  syncSettingsThemes() {
    const selectedTheme = getSelectedMapTheme();
    for (const theme of MAP_THEMES) {
      const card = this.settingsThemeButtons.get(theme.id);
      const active = theme.id === selectedTheme.id;
      card.label.setText(theme.label);
      card.badge.setVisible(active);
      card.bg.setStrokeStyle(4, active ? COLORS.accent : COLORS.stroke);
      card.bg.setFillStyle(active ? COLORS.success : COLORS.primary);
    }
  }

  syncSettingsDifficulty() {
    const selected = getSelectedDifficulty();
    for (const difficulty of DIFFICULTIES) {
      const card = this.settingsDifficultyButtons.get(difficulty.id);
      const active = difficulty.id === selected.id;
      card.badge.setVisible(active);
      card.bg.setStrokeStyle(4, active ? COLORS.accent : COLORS.stroke);
      card.bg.setFillStyle(active ? COLORS.success : COLORS.primary);
    }
  }

  /** Rekor ditampilkan per tingkat kesulitan yang sedang dipilih. */
  refreshHighScore() {
    if (!this.highScoreText) return;
    const difficulty = getSelectedDifficulty();
    this.highScoreText.setText(`High Score (${difficulty.label}): ${getHighScore(difficulty.id)}`);
  }

  closeSettings() {
    this.settingsObjects?.forEach((object) => object.destroy());
    this.settingsObjects = null;
    this.settingsThemeButtons = null;
    this.settingsDifficultyButtons = null;
  }

  startGame() {
    fadeToScene(
      this,
      SCENES.GAME,
      { level: 1, score: 0, mapTheme: getSelectedMapTheme().id, difficulty: getSelectedDifficulty().id },
      250
    );
  }

  openLevelSelect() {
    fadeToScene(this, SCENES.LEVEL_SELECT);
  }
}
