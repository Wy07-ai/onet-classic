import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants.js';
import { audioLabel, isMuted, toggleMuted } from '../utils/audioSettings.js';
import { createButton } from '../utils/createButton.js';
import { setupSceneCleanup } from '../utils/sceneCleanup.js';
import { isTouchDevice } from '../utils/device.js';
import { PAUSE_LAYOUT, PAUSE_PANEL } from '../utils/uiLayout.js';

/**
 * Modal pause. Dijalankan di atas GameScene (scene.launch) sementara GameScene
 * di-pause: update, tween, dan timer GameScene otomatis berhenti, jadi waktu
 * tidak berkurang selama modal terbuka.
 */
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PAUSE);
  }

  init(data) {
    this.level = data?.level ?? 1;
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    this.closing = false;
    const cleanup = setupSceneCleanup(this, () => {
      this.bgmBtn = null;
      this.sfxBtn = null;
    });

    // Latar gelap pekat: papan tidak bisa "diintip" saat pause. Interaktif agar
    // klik tidak tembus ke GameScene.
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.98).setInteractive();
    this.add.rectangle(PAUSE_PANEL.x, PAUSE_PANEL.y, PAUSE_PANEL.width, PAUSE_PANEL.height, COLORS.panel).setStrokeStyle(4, COLORS.primary);

    this.add
      .text(cx, cy - 205, 'PAUSE', {
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#0b1020',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, cy - 154, `Level ${this.level}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#7aa9ff',
      })
      .setOrigin(0.5);

    const sizeOf = (spec) => ({ width: spec.width, height: spec.height, fontSize: spec.fontSize });
    const { resume, restart, menu, bgm, sfx } = PAUSE_LAYOUT;
    createButton(this, resume.x, resume.y, 'LANJUTKAN', () => this.resumeGame(), sizeOf(resume));
    createButton(this, restart.x, restart.y, 'RESTART LEVEL', () => this.restartLevel(), sizeOf(restart));
    createButton(this, menu.x, menu.y, 'MENU UTAMA', () => this.exitToMenu(), {
      ...sizeOf(menu),
      color: COLORS.danger,
      hoverColor: 0xff7a96,
    });

    // Toggle audio
    this.bgmBtn = createButton(this, bgm.x, bgm.y, '', () => this.toggle('bgm'), sizeOf(bgm));
    this.sfxBtn = createButton(this, sfx.x, sfx.y, '', () => this.toggle('sfx'), sizeOf(sfx));
    this.syncAudio();

    if (!isTouchDevice(this)) {
      this.add
        .text(cx, cy + 240, 'ESC / P untuk lanjut', {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          color: '#8899bb',
        })
        .setOrigin(0.5);
    }

    const onKey = (event) => {
      if (!event.repeat) this.resumeGame();
    };
    cleanup.on(this.input.keyboard, 'keydown-ESC', onKey);
    cleanup.on(this.input.keyboard, 'keydown-P', onKey);
  }

  toggle(channel) {
    toggleMuted(this, channel);
    this.syncAudio();
  }

  syncAudio() {
    [['bgm', this.bgmBtn], ['sfx', this.sfxBtn]].forEach(([channel, btn]) => {
      const label = btn.list[1];
      label.setText(audioLabel(this, channel));
      label.setColor(isMuted(this, channel) ? '#ff9aa8' : '#ffffff');
    });
  }

  resumeGame() {
    if (this.closing) return;
    this.closing = true;
    this.scene.resume(SCENES.GAME);
    this.scene.stop();
  }

  restartLevel() {
    if (this.closing) return;
    this.closing = true;
    const game = this.scene.get(SCENES.GAME);
    this.scene.resume(SCENES.GAME);
    this.scene.stop();
    game.restartLevel();
  }

  exitToMenu() {
    if (this.closing) return;
    this.closing = true;
    this.scene.stop(SCENES.GAME);
    this.scene.start(SCENES.MENU);
  }
}
