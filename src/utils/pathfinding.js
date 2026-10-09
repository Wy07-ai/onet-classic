/**
 * Pathfinding Onet.
 *
 * Grid: matriks 2D (grid[r][c]); 0 = kosong, >0 = tipe tile.
 * Grid HARUS sudah memiliki border kosong (lihat boardGenerator.js) agar jalur
 * boleh lewat di luar papan.
 *
 * Aturan: dua tile bertipe sama terhubung jika ada jalur lewat sel kosong
 * dengan maksimal `maxTurns` belokan (default 2 => maks 3 segmen lurus).
 *
 * Metode: BFS per "lapisan belokan". State = (r, c, arah). Bergerak lurus
 * tidak menambah belokan; berganti arah menambah 1 belokan. Lapisan t=0 diproses
 * dulu, lalu t=1, dst., sehingga jalur pertama yang ketemu = belokan paling sedikit.
 *
 * @returns {{r:number,c:number}[] | null} titik sudut jalur (awal, tiap belokan, akhir) atau null
 */
const DIRS = [
  [-1, 0], // atas
  [0, 1], // kanan
  [1, 0], // bawah
  [0, -1], // kiri
];

export function findPath(grid, a, b, maxTurns = 2) {
  if (!grid || !a || !b) return null;
  if (a.r === b.r && a.c === b.c) return null;

  const rows = grid.length;
  const cols = grid[0].length;
  const inside = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  if (!inside(a.r, a.c) || !inside(b.r, b.c)) return null;

  const type = grid[a.r][a.c];
  if (type === 0 || grid[b.r][b.c] !== type) return null;

  // best[(r*cols+c)*4+d] = jumlah belokan minimum untuk mencapai state tsb
  const best = new Int16Array(rows * cols * 4).fill(32767);
  const idx = (r, c, d) => (r * cols + c) * 4 + d;

  const levels = Array.from({ length: maxTurns + 1 }, () => []);
  for (let d = 0; d < 4; d++) {
    best[idx(a.r, a.c, d)] = 0;
    levels[0].push({ r: a.r, c: a.c, d, prev: null });
  }

  for (let t = 0; t <= maxTurns; t++) {
    const queue = levels[t];
    for (let i = 0; i < queue.length; i++) {
      const node = queue[i];
      const { r, c, d } = node;

      // 1) Lurus ke arah d (belokan tetap t)
      const nr = r + DIRS[d][0];
      const nc = c + DIRS[d][1];
      if (inside(nr, nc)) {
        if (nr === b.r && nc === b.c) {
          return buildPath(node, b);
        }
        if (grid[nr][nc] === 0 && best[idx(nr, nc, d)] > t) {
          best[idx(nr, nc, d)] = t;
          queue.push({ r: nr, c: nc, d, prev: node });
        }
      }

      // 2) Belok 90 derajat (belokan t+1)
      if (t < maxTurns) {
        for (const nd of [(d + 1) % 4, (d + 3) % 4]) {
          if (best[idx(r, c, nd)] > t + 1) {
            best[idx(r, c, nd)] = t + 1;
            levels[t + 1].push({ r, c, d: nd, prev: node });
          }
        }
      }
    }
  }
  return null;
}

function buildPath(node, end) {
  const pts = [{ r: end.r, c: end.c }];
  for (let n = node; n; n = n.prev) pts.push({ r: n.r, c: n.c });
  pts.reverse();

  // Buang titik duplikat berurutan & titik yang segaris (sisakan hanya sudut)
  const dedup = pts.filter(
    (p, i) => i === 0 || p.r !== pts[i - 1].r || p.c !== pts[i - 1].c
  );
  return dedup.filter((p, i) => {
    if (i === 0 || i === dedup.length - 1) return true;
    const p0 = dedup[i - 1];
    const p1 = dedup[i + 1];
    const collinear =
      (p0.r === p.r && p.r === p1.r) || (p0.c === p.c && p.c === p1.c);
    return !collinear;
  });
}
