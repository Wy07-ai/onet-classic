/**
 * Layar HP potret terlalu sempit untuk papan Onet (kanvas 16:9 jadi sangat kecil).
 * Tampilkan imbauan memutar ke landscape; pemain boleh menutupnya ("Tetap main").
 * Mengembalikan fungsi pembersih (lepas listener + hapus elemen).
 */
export function installOrientationHint() {
  const query = window.matchMedia('(orientation: portrait) and (max-width: 900px)');
  let dismissed = false;

  const el = document.createElement('div');
  el.id = 'rotate-hint';
  el.setAttribute('role', 'dialog');
  el.innerHTML =
    '<div class="rotate-icon" aria-hidden="true">&#x21BB;</div>' +
    '<p>Putar perangkat ke mode <b>landscape</b><br />untuk pengalaman bermain terbaik.</p>' +
    '<button type="button">Tetap main</button>';
  document.body.appendChild(el);

  const onDismiss = () => {
    dismissed = true;
    sync();
  };
  el.querySelector('button').addEventListener('click', onDismiss);

  function sync() {
    el.classList.toggle('visible', query.matches && !dismissed);
  }
  query.addEventListener('change', sync);
  sync();

  return () => {
    query.removeEventListener('change', sync);
    el.remove();
  };
}
