/** Silhouetten als SVG-Masken. Sie werden einmal erzeugt und als CSS-Variablen bereitgestellt. */

function mkRnd(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

const wrap = (inner: string, w = 400, h = 120) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'>${inner}</svg>`
  )}")`;

function pines() {
  const rnd = mkRnd(7);
  let x = -10;
  const out: string[] = [];
  while (x < 410) {
    const w = 18 + rnd() * 26, h = 40 + rnd() * 70, base = 120, cx = x + w / 2, tiers = 4;
    const pts: string[] = [`${x},${base}`];
    for (let t = 0; t < tiers; t++) {
      const y = base - (h * (t + 1)) / tiers, half = (w / 2) * (1 - t / (tiers + 0.6));
      pts.push(`${cx - half},${y + h / tiers / 2}`, `${cx - half * 0.45},${y + h / tiers / 2}`);
    }
    pts.push(`${cx},${base - h - 6}`);
    for (let t = tiers - 1; t >= 0; t--) {
      const y = base - (h * (t + 1)) / tiers, half = (w / 2) * (1 - t / (tiers + 0.6));
      pts.push(`${cx + half * 0.45},${y + h / tiers / 2}`, `${cx + half},${y + h / tiers / 2}`);
    }
    pts.push(`${x + w},${base}`);
    out.push(`<polygon points='${pts.join(" ")}'/>`);
    x += w * (0.55 + rnd() * 0.35);
  }
  return wrap(out.join(""));
}

function castle() {
  const rnd = mkRnd(11);
  const o: string[] = [`<rect x='0' y='94' width='400' height='26'/>`];
  for (let i = 0; i < 400; i += 10) o.push(`<rect x='${i}' y='88' width='5' height='7'/>`);
  let tx = 12;
  while (tx < 385) {
    const w = 20 + rnd() * 14, h = 40 + rnd() * 48, y = 120 - h;
    o.push(`<rect x='${tx}' y='${y}' width='${w}' height='${h}'/>`);
    if (rnd() > 0.4) {
      const peak = y - 16 - rnd() * 12;
      o.push(`<polygon points='${tx - 3},${y} ${tx + w / 2},${peak} ${tx + w + 3},${y}'/>`);
      o.push(`<rect x='${tx + w / 2}' y='${peak - 9}' width='1' height='9'/><polygon points='${tx + w / 2 + 1},${peak - 9} ${tx + w / 2 + 8},${peak - 6.5} ${tx + w / 2 + 1},${peak - 4}'/>`);
    } else {
      for (let k = 0; k < 4; k++) o.push(`<rect x='${tx + (k * w) / 4}' y='${y - 6}' width='${w / 8}' height='6'/>`);
    }
    tx += w + 22 + rnd() * 42;
  }
  return wrap(o.join(""));
}

function skyline() {
  const rnd = mkRnd(23);
  const o: string[] = [];
  let x = 0;
  while (x < 400) {
    const w = 14 + rnd() * 20, h = 30 + rnd() * 80;
    o.push(`<rect x='${x}' y='${120 - h}' width='${w}' height='${h}'/>`);
    if (rnd() > 0.7) o.push(`<rect x='${x + w / 2 - 0.5}' y='${120 - h - 14}' width='1' height='14'/>`);
    x += w + rnd() * 3;
  }
  return wrap(o.join(""));
}

function trunks() {
  const rnd = mkRnd(5);
  const o: string[] = [];
  const side = (from: number, dir: number) => {
    let x = from;
    for (let i = 0; i < 4; i++) {
      const w = 16 + rnd() * 26;
      o.push(`<polygon points='${x},800 ${x + dir * w},800 ${x + dir * (w * 0.8)},0 ${x + dir * 2},0'/>`);
      x += dir * (w * (0.6 + rnd() * 0.5));
    }
  };
  side(-6, 1);
  side(406, -1);
  return wrap(o.join(""), 400, 800);
}

function mountains() {
  const rnd = mkRnd(31);
  const pts = ["0,120"];
  for (let x = 0; x <= 400; x += 25) pts.push(`${x},${50 + rnd() * 55 - (x % 100 === 0 ? 25 : 0)}`);
  pts.push("400,120");
  return wrap(`<polygon points='${pts.join(" ")}'/>`);
}

function hills(a = 70, b = 55) {
  return wrap(`<path d='M0,120 L0,${a} Q50,${a - 30} 100,${a - 5} T200,${a - 8} T300,${a + 4} T400,${b} L400,120 Z'/>`);
}

export function installShapes() {
  const r = document.documentElement.style;
  r.setProperty("--shape-pines", pines());
  r.setProperty("--shape-castle", castle());
  r.setProperty("--shape-skyline", skyline());
  r.setProperty("--shape-trunks", trunks());
  r.setProperty("--shape-mountains", mountains());
  r.setProperty("--shape-hills", hills());
  r.setProperty("--shape-hills2", hills(88, 80));
}
