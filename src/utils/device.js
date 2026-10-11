/** True bila perangkat punya layar sentuh (dipakai untuk teks petunjuk & beban visual). */
export function isTouchDevice(scene) {
  return Boolean(scene.sys.game.device.input.touch);
}

/** True bila bukan desktop (HP/tablet): kurangi dekorasi animasi demi 60 FPS. */
export function isMobileDevice(scene) {
  return !scene.sys.game.device.os.desktop;
}
