// Uji helper pembersihan scene: listener tidak menumpuk setelah banyak siklus start/shutdown.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createListenerBag, setupSceneCleanup } from '../src/utils/sceneCleanup.js';

function fakeScene() {
  const calls = [];
  const input = new EventEmitter();
  const keyboard = new EventEmitter();
  input.keyboard = keyboard;
  return {
    calls,
    events: new EventEmitter(),
    sound: new EventEmitter(),
    registry: new EventEmitter(),
    input,
    tweens: { killAll: () => calls.push('tweens.killAll') },
    time: { removeAllEvents: () => calls.push('time.removeAllEvents') },
    cameras: { main: undefined }, // pada shutdown Phaser, cameras.main sudah undefined
  };
}

// --- listener bag ---
{
  const emitter = new EventEmitter();
  const bag = createListenerBag();
  bag.on(emitter, 'a', () => {});
  bag.once(emitter, 'b', () => {});
  assert.equal(emitter.listenerCount('a') + emitter.listenerCount('b'), 2);
  assert.equal(bag.size, 2);
  bag.release();
  assert.equal(emitter.listenerCount('a') + emitter.listenerCount('b'), 0);
  assert.equal(bag.size, 0);
}

// --- satu siklus: cleanup jalan tepat sekali (shutdown lalu destroy tidak menggandakan) ---
{
  const scene = fakeScene();
  let cleaned = 0;
  const bag = setupSceneCleanup(scene, () => cleaned++);
  bag.on(scene.sound, 'unlocked', () => {});
  bag.on(scene.events, 'resume', () => {});
  bag.once(scene.input.keyboard, 'keydown-ENTER', () => {});
  scene.input.on('pointerup', () => {});

  scene.events.emit('shutdown');
  scene.events.emit('destroy');
  assert.equal(cleaned, 1, 'cleanup harus tepat sekali');
  assert.equal(scene.sound.listenerCount('unlocked'), 0);
  assert.equal(scene.events.listenerCount('resume'), 0);
  assert.equal(scene.events.listenerCount('shutdown'), 0);
  assert.equal(scene.events.listenerCount('destroy'), 0);
  assert.equal(scene.input.keyboard.listenerCount('keydown-ENTER'), 0);
  assert.equal(scene.input.listenerCount('pointerup'), 0, 'jaring pengaman melepas listener input');
  assert.deepEqual(scene.calls, ['tweens.killAll', 'time.removeAllEvents']);
}

// --- 500 siklus restart pada instance scene yang sama: jumlah listener tetap konstan ---
{
  const scene = fakeScene();
  for (let i = 0; i < 500; i++) {
    const bag = setupSceneCleanup(scene, () => {});
    bag.on(scene.events, 'resume', () => {});
    bag.once(scene.sound, 'unlocked', () => {});
    bag.on(scene.input.keyboard, 'keydown-ESC', () => {});
    scene.events.emit('shutdown');
  }
  for (const [emitter, event] of [
    [scene.events, 'shutdown'],
    [scene.events, 'destroy'],
    [scene.events, 'resume'],
    [scene.sound, 'unlocked'],
    [scene.input.keyboard, 'keydown-ESC'],
  ]) {
    assert.equal(emitter.listenerCount(event), 0, `listener "${event}" menumpuk`);
  }
}

// --- error di cleanup khusus scene tetap menjalankan jaring pengaman ---
{
  const scene = fakeScene();
  setupSceneCleanup(scene, () => {
    throw new Error('boom');
  });
  assert.throws(() => scene.events.emit('shutdown'), /boom/);
  assert.ok(scene.calls.includes('tweens.killAll'));
  assert.equal(scene.events.listenerCount('shutdown'), 0);
}

console.log('OK — pembersihan scene valid (500 siklus tanpa kebocoran listener).');
