/**
 * Helper pembersihan scene (tanpa import Phaser supaya bisa dites di Node).
 *
 * Phaser sudah membereskan display list, tween, input & kamera milik scene saat
 * shutdown, tetapi TIDAK membereskan:
 *   - listener di emitter yang umurnya lebih panjang dari scene (`scene.events`,
 *     `scene.sound`, `scene.registry`, `game.events`, `scale`) — instance Scene
 *     dipakai ulang, jadi listener yang tidak dilepas menumpuk tiap kunjungan;
 *   - referensi di field instance (this.hud, this.tiles, ...) ke objek yang
 *     sudah di-destroy.
 */

const SHUTDOWN = 'shutdown';
const DESTROY = 'destroy';

/** Kantong listener: semua on/once tercatat sehingga bisa dilepas sekaligus. */
export function createListenerBag() {
  const entries = [];
  return {
    on(emitter, event, fn, context) {
      emitter.on(event, fn, context);
      entries.push({ emitter, event, fn, context });
      return fn;
    },
    once(emitter, event, fn, context) {
      emitter.once(event, fn, context);
      entries.push({ emitter, event, fn, context });
      return fn;
    },
    release() {
      for (const { emitter, event, fn, context } of entries) emitter.off(event, fn, context);
      entries.length = 0;
    },
    get size() {
      return entries.length;
    },
  };
}

/**
 * Jaring pengaman generik: lepas semua yang masih menempel di plugin scene.
 * Aman dipanggil setelah Phaser selesai shutdown (semua akses pakai optional chaining;
 * mis. `cameras.main` sudah undefined pada saat itu).
 */
export function releaseSceneResources(scene) {
  scene.tweens?.killAll?.();
  scene.time?.removeAllEvents?.();
  scene.input?.removeAllListeners?.();
  scene.input?.keyboard?.removeAllListeners?.();
  const cam = scene.cameras?.main;
  if (cam) {
    cam.off?.('camerafadeoutcomplete');
    cam.off?.('camerafadeincomplete');
  }
}

/**
 * Daftarkan pembersihan untuk satu siklus hidup scene (panggil di awal create()).
 * Dijalankan tepat sekali saat 'shutdown' ATAU 'destroy', lalu mencabut dirinya
 * sendiri dari `scene.events` supaya tidak menumpuk di restart berikutnya.
 *
 * @param {object} scene Phaser.Scene
 * @param {() => void} [onCleanup] pembersihan khusus scene (destroy objek, null-kan referensi)
 * @returns {ReturnType<typeof createListenerBag>} bag: pakai `.on/.once` untuk listener yang
 *   harus dilepas otomatis.
 */
export function setupSceneCleanup(scene, onCleanup) {
  const bag = createListenerBag();
  const events = scene.events;
  const run = () => {
    events.off(SHUTDOWN, run);
    events.off(DESTROY, run);
    bag.release();
    try {
      onCleanup?.();
    } finally {
      releaseSceneResources(scene);
    }
  };
  events.on(SHUTDOWN, run);
  events.on(DESTROY, run);
  return bag;
}
