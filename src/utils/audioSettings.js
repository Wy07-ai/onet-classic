/**
 * Status mute SFX & BGM. Disimpan di registry global game, jadi tetap berlaku
 * saat pindah scene / restart level / membuka menu pause.
 */
const KEYS = { bgm: 'audio.muteBgm', sfx: 'audio.muteSfx' };

export function isMuted(scene, channel) {
  return Boolean(scene.registry.get(KEYS[channel]));
}

/**
 * Instance BGM yang masih hidup (atau undefined). Sound yang sudah di-destroy
 * baru dibuang manager di frame berikutnya, jadi harus difilter lewat pendingRemove.
 */
export function getBgm(scene) {
  return scene.sound.getAll('bgm').find((sound) => !sound.pendingRemove);
}

/** Terapkan status mute BGM ke instance musik yang sedang ada (kalau ada). */
export function applyBgmMute(scene) {
  getBgm(scene)?.setMute(isMuted(scene, 'bgm'));
}

export function toggleMuted(scene, channel) {
  scene.registry.set(KEYS[channel], !isMuted(scene, channel));
  if (channel === 'bgm') applyBgmMute(scene);
  return isMuted(scene, channel);
}

export function audioLabel(scene, channel) {
  const name = channel === 'bgm' ? 'MUSIK' : 'SFX';
  return `${name}: ${isMuted(scene, channel) ? 'OFF' : 'ON'}`;
}
