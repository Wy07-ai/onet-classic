export function createButton(scene, x, y, text, onClick) {
  const btn = scene.add
    .text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      backgroundColor: '#3a56d4',
      padding: { x: 28, y: 14 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  btn.on('pointerover', () => btn.setBackgroundColor('#5775f0'));
  btn.on('pointerout', () => btn.setBackgroundColor('#3a56d4'));
  btn.on('pointerup', onClick);
  return btn;
}
