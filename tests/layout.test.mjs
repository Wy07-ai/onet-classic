// Uji tata letak sentuh: area sentuh tombol tidak saling tumpang-tindih, tetap di dalam layar,
// dan tidak menutupi papan permainan. Logika murni (tanpa Phaser).
import assert from 'node:assert/strict';
import { BOARD_AREA, GAME_HEIGHT, GAME_WIDTH, LEVELS, TOUCH } from '../src/constants.js';
import { computeBoardLayout } from '../src/utils/boardLayout.js';
import {
  GAME_OVER_LAYOUT,
  HUD_LAYOUT,
  LEVEL_COMPLETE_LAYOUT,
  LEVEL_SELECT_LAYOUT,
  MENU_LAYOUT,
  PAUSE_LAYOUT,
  PAUSE_PANEL,
  SETTINGS_LAYOUT,
  hitPadding,
  hitRect,
  rectsOverlap,
} from '../src/utils/uiLayout.js';

const groups = {
  HUD: HUD_LAYOUT,
  Menu: MENU_LAYOUT,
  Settings: SETTINGS_LAYOUT,
  GameOver: GAME_OVER_LAYOUT,
  Pause: PAUSE_LAYOUT,
  LevelSelect: LEVEL_SELECT_LAYOUT,
  LevelComplete: LEVEL_COMPLETE_LAYOUT,
};

// --- hitPadding / hitRect ---
assert.deepEqual(hitPadding(40, 40, 84), { x: 22, y: 22 });
assert.deepEqual(hitPadding(200, 100, 84), { x: 0, y: 0 }, 'tombol besar tidak diberi padding');
const small = hitRect({ x: 100, y: 100, width: 40, height: 40 });
assert.equal(small.right - small.left, TOUCH.minTarget);
assert.equal(small.bottom - small.top, TOUCH.minTarget);

for (const [name, group] of Object.entries(groups)) {
  const entries = Object.entries(group);
  for (const [key, spec] of entries) {
    const rect = hitRect(spec);
    // Visual tidak boleh terlalu kecil, area sentuh harus memenuhi minimum, dan seluruhnya di layar.
    assert.ok(spec.height >= 56, `${name}.${key}: tinggi visual ${spec.height} < 56`);
    assert.ok(rect.right - rect.left >= TOUCH.minTarget && rect.bottom - rect.top >= TOUCH.minTarget, `${name}.${key}: area sentuh < ${TOUCH.minTarget}`);
    assert.ok(rect.left >= 0 && rect.top >= 0 && rect.right <= GAME_WIDTH && rect.bottom <= GAME_HEIGHT, `${name}.${key}: area sentuh keluar layar`);
  }
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      assert.ok(
        !rectsOverlap(hitRect(entries[i][1]), hitRect(entries[j][1])),
        `${name}: area sentuh ${entries[i][0]} & ${entries[j][0]} bertumpuk`
      );
    }
  }
}

// --- Tombol HUD tidak menutupi papan di level mana pun ---
for (let i = 0; i < LEVELS.length; i++) {
  const { rows, cols } = LEVELS[i];
  const layout = computeBoardLayout(rows, cols);
  const pad = layout.panelPadding;
  const board = { left: layout.x - pad, top: layout.y - pad, right: layout.x + layout.width + pad, bottom: layout.y + layout.height + pad };
  for (const [key, spec] of Object.entries(HUD_LAYOUT)) {
    assert.ok(!rectsOverlap(hitRect(spec), board), `Level ${i + 1}: tombol HUD ${key} menutupi papan`);
  }
}

// --- Tombol Pause / hasil level berada di dalam panel masing-masing ---
const panel = {
  left: PAUSE_PANEL.x - PAUSE_PANEL.width / 2,
  right: PAUSE_PANEL.x + PAUSE_PANEL.width / 2,
  top: PAUSE_PANEL.y - PAUSE_PANEL.height / 2,
  bottom: PAUSE_PANEL.y + PAUSE_PANEL.height / 2,
};
for (const [key, spec] of Object.entries(PAUSE_LAYOUT)) {
  const r = hitRect(spec);
  assert.ok(r.left >= panel.left && r.right <= panel.right && r.top >= panel.top && r.bottom <= panel.bottom, `Pause.${key} keluar panel`);
}
assert.ok(BOARD_AREA.bottom <= HUD_LAYOUT.shuffle.y - HUD_LAYOUT.shuffle.height / 2, 'papan harus berakhir di atas tombol bawah');

// Pengaturan tersedia di menu utama; pilihan tema berada di panel pengaturan.
assert.ok(MENU_LAYOUT.settings.y > MENU_LAYOUT.play.y && MENU_LAYOUT.settings.y > MENU_LAYOUT.levelSelect.y);
const settingsThemes = [SETTINGS_LAYOUT.themeFaces, SETTINGS_LAYOUT.themeCountries, SETTINGS_LAYOUT.themeFood];
assert.ok(settingsThemes.every((spec) => spec.y === settingsThemes[0].y), 'pilihan tema harus berada pada satu baris');
assert.ok(SETTINGS_LAYOUT.back.y > SETTINGS_LAYOUT.themeFaces.y, 'tombol kembali harus berada di bawah pilihan tema');
assert.ok(SETTINGS_LAYOUT.close.x > GAME_WIDTH / 2, 'tombol tutup harus berada di pojok kanan modal');
assert.ok(SETTINGS_LAYOUT.bgm.y === SETTINGS_LAYOUT.sfx.y, 'kontrol audio harus sejajar');

console.log('OK — tata letak sentuh valid (tanpa tumpang-tindih, area sentuh >= ' + TOUCH.minTarget + ').');
