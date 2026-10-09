import Phaser from 'phaser';
import { SCENES } from '../constants.js';
import animalTilesUrl from '../assets/animal-tiles.svg';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    this.load.spritesheet('animal-tiles', animalTilesUrl, {
      frameWidth: 96,
      frameHeight: 96,
    });
  }

  create() {
    this.scene.start(SCENES.MENU);
  }
}