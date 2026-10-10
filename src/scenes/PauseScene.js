import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants.js';
import { audioLabel, isMuted, toggleMuted } from '../utils/audioSettings.js';
import { createButton } from '../utils/createButton.js';

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

    // Latar gelap pekat: papan tidak bisa "diintip" saat pause. Interaktif agar
    // klik tidak tembus ke GameScene.
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.98).setInteractive();
    this.add.rectangle(cx, cy, 480, 500, COLORS.panel).setStrokeStyle(4, COLORS.primary);

    this.add
      .text(cx, cy - 195, 'PAUSE', {
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#0b1020',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, cy - 140, `Level ${this.level}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#7aa9ff',
      })
      .setOrigin(0.5);

    const wide = { width: 320, height: 60, fontSize: 28 };
    createButton(this, cx, cy - 70, 'LANJUTKAN', () => this.resumeGame(), wide);
    createButton(this, cx, cy + 10, 'RESTART LEVEL', () => this.restartLevel(), wide);
    createButton(this, cx, cy + 90, 'MENU UTAMA', () => this.exitToMenu(), {
      ...wide,
      color: COLORS.danger,
      hoverColor: 0xff7a96,
    });

    // Toggle audio
    const small = { width: 150, height: 46, fontSize: 20 };
    this.bgmBtn = createButton(this, cx - 90, cy + 180, '', () => this.toggle('bgm'), small);
    this.sfxBtn = createButton(this, cx + 90, cy + 180, '', () => this.toggle('sfx'), small);
    this.syncAudio();

    this.add
      .text(cx, cy + 232, 'ESC / P untuk lanjut', {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: '#8899bb',
      })
      .setOrigin(0.5);

    const onKey = (event) => {
      if (!event.repeat) this.resumeGame();
    };
    this.input.keyboard.on('keydown-ESC', onKey);
    this.input.keyboard.on('keydown-P', onKey);
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
