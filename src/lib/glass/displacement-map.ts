// R/G encode an inward displacement (128 = none): strongest at the edge, fading to 0 across the bezel, like a lens rim.
function createDisplacementMap(width: number, height: number, radius: number, bezel: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const r = Math.min(radius, w / 2, h / 2);
  const band = Math.max(1, Math.min(bezel, w / 2, h / 2));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const data = img.data;

  const hx = w / 2 - r;
  const hy = h / 2 - r;

  for (let py = 0; py < h; py++) {
    const y = py + 0.5 - h / 2;
    const qy = Math.abs(y) - hy;
    for (let px = 0; px < w; px++) {
      const x = px + 0.5 - w / 2;
      const qx = Math.abs(x) - hx;

      // Signed distance to the rounded rect (negative inside) and its outward normal.
      let dist: number, nx: number, ny: number;
      if (qx > 0 && qy > 0) {
        const len = Math.hypot(qx, qy);
        dist = len - r;
        nx = (qx / len) * Math.sign(x);
        ny = (qy / len) * Math.sign(y);
      } else if (qx > qy) {
        dist = qx - r;
        nx = Math.sign(x);
        ny = 0;
      } else {
        dist = qy - r;
        nx = 0;
        ny = Math.sign(y);
      }

      const depth = Math.min(1, Math.max(0, -dist / band));
      const mag = dist > 0 ? 0 : (1 - depth) ** 2;

      const i = (py * w + px) * 4;
      data[i] = 128 - nx * mag * 127;
      data[i + 1] = 128 - ny * mag * 127;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

const cache = new Map<string, string>();
const CACHE_SIZE = 48;

/** Cached by geometry: buttons of the same size share one map. */
export function getDisplacementMap(width: number, height: number, radius: number, bezel: number): { key: string; url: string } {
  const key = `${Math.round(width)}x${Math.round(height)}r${radius}b${bezel}`;
  let url = cache.get(key);
  if (url) cache.delete(key); // re-insert as most recent
  else url = createDisplacementMap(width, height, radius, bezel);
  cache.set(key, url);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return { key, url };
}
