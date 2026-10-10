/**
 * Pindah scene dengan fade out singkat. Aman dipanggil berulang kali
 * (klik ganda / tombol + shortcut keyboard): hanya transisi pertama yang jalan.
 *
 * @param {Phaser.Scene} scene scene asal
 * @param {string} key scene tujuan
 * @param {object} [data] data untuk scene tujuan
 * @param {number} [duration] lama fade out (ms)
 * @returns {boolean} true bila transisi dimulai
 */
export function fadeToScene(scene, key, data, duration = 220) {
  if (scene.isLeaving) return false;
  scene.isLeaving = true;
  // Instance scene dipakai ulang oleh Phaser: reset flag saat scene ditutup
  // supaya kunjungan berikutnya tidak "terkunci".
  scene.events.once('shutdown', () => {
    scene.isLeaving = false;
  });
  scene.cameras.main.fadeOut(duration);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.scene.start(key, data);
  });
  return true;
}
