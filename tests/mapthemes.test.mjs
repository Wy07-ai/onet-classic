import assert from 'node:assert/strict';
import {
  DEFAULT_MAP_THEME_ID,
  MAP_THEME_KEY,
  MAP_THEMES,
  getMapTheme,
  getSelectedMapTheme,
  setSelectedMapTheme,
} from '../src/utils/mapThemes.js';

assert.equal(MAP_THEMES.length, 5);
assert.deepEqual(
  MAP_THEMES.map(({ id, textureKey, frameCount }) => [id, textureKey, frameCount]),
  [
    ['faces', 'face-tiles', 24],
    ['countries', 'country-tiles', 24],
    ['food', 'food-tiles', 24],
    ['animals', 'animal-tiles', 24],
    ['clocks', 'clock-tiles', 24],
  ]
);
assert.equal(new Set(MAP_THEMES.map((theme) => theme.id)).size, MAP_THEMES.length, 'id tema harus unik');
assert.equal(new Set(MAP_THEMES.map((theme) => theme.textureKey)).size, MAP_THEMES.length, 'textureKey tema harus unik');
assert.equal(DEFAULT_MAP_THEME_ID, 'faces');
assert.equal(getSelectedMapTheme().id, DEFAULT_MAP_THEME_ID);
assert.equal(getMapTheme('missing').id, DEFAULT_MAP_THEME_ID);
assert.throws(() => setSelectedMapTheme('missing'), /Tema map tidak dikenal/);

const stored = new Map();
globalThis.localStorage = {
  getItem(key) {
    return stored.get(key) ?? null;
  },
  setItem(key, value) {
    stored.set(key, value);
  },
};

for (const theme of MAP_THEMES) {
  assert.equal(setSelectedMapTheme(theme.id).id, theme.id);
  assert.equal(stored.get(MAP_THEME_KEY), theme.id);
  assert.equal(getSelectedMapTheme().id, theme.id);
}

globalThis.localStorage = {
  getItem() {
    throw new Error('storage unavailable');
  },
  setItem() {
    throw new Error('storage unavailable');
  },
};
assert.equal(setSelectedMapTheme('countries').id, 'countries');
assert.equal(getSelectedMapTheme().id, 'countries');

console.log('OK — pilihan tema map valid dan tetap bekerja tanpa localStorage.');
