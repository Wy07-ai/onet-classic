import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import animalTilesUrl from '../assets/animal-tiles.svg';
import backgroundMusicUrl from '../assets/audio/bgm.wav';
import tileClickUrl from '../assets/audio/tile-click.wav';
import matchUrl from '../assets/audio/match.wav';
import wrongUrl from '../assets/audio/wrong.wav';
import hintUrl from '../assets/audio/hint.wav';
import shuffleUrl from '../assets/audio/shuffle.wav';
import clockTickUrl from '../assets/audio/clock-tick.wav';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    this.load.spritesheet('animal-tiles', animalTilesUrl, {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.audio('bgm', backgroundMusicUrl);
    this.load.audio('tile-click', tileClickUrl);
    this.load.audio('match', matchUrl);
    this.load.audio('wrong', wrongUrl);
    this.load.audio('hint', hintUrl);
    this.load.audio('shuffle', shuffleUrl);
    this.load.audio('clock-tick', clockTickUrl);
  }

  create() {
    this.scene.start(SCENES.MENU);
  }
}