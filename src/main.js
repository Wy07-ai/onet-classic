import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './constants.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import PauseScene from './scenes/PauseScene.js';
import { installOrientationHint } from './utils/orientationHint.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  // Responsif: kanvas logis tetap 1280x720, lalu diskalakan proporsional (FIT) mengisi
  // #game-container (yang memenuhi viewport, lihat index.html) dan dipusatkan di kedua sumbu.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true, // hindari ukuran piksel pecahan (teks buram)
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  fps: { target: 60 },
  // Layar sentuh: tahan menu konteks (long-press) dan scroll/zoom bawaan browser.
  disableContextMenu: true,
  input: { touch: { capture: true } },
  render: { powerPreference: 'high-performance' },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    LevelSelectScene,
    GameScene,
    PauseScene,
    GameOverScene,
  ],
};

const game = new Phaser.Game(config);
const removeOrientationHint = installOrientationHint();

// Hanya mode dev: akses instance game dari console / uji otomatis browser.
if (import.meta.env.DEV) window.__ONET_GAME__ = game;

// Dev (vite HMR): bebaskan instance lama sebelum modul dimuat ulang, supaya tidak ada
// banyak Phaser.Game / listener window yang menumpuk di memori.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    removeOrientationHint();
    game.destroy(true);
  });
}

export default game;