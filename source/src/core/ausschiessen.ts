/**
 * Ausschießen für die Handbindung (Folio): Je Bogen zwei Seiten nebeneinander pro Seite,
 * Bogen werden ineinandergelegt und zu Lagen gefaltet.
 */
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

export const MM = 72 / 25.4;
export const PAPER: Record<string, [number, number]> = { A4: [210, 297], B5: [176, 250], A5: [148, 210] };
export const BOOK: Record<string, [number, number]> = { A5: [148, 210], B6: [125, 176], A6: [105, 148], Folio: [0, 0] };

export interface Opts {
  paper: keyof typeof PAPER;
  bookW: number; bookH: number; // fertige Seite in mm (0 = halber Druckbogen)
  sheets: number[];             // Bogen pro Lage, wird wiederholt
  fill: "einpassen" | "fuellen" | "original";
  gutter: number;               // zusätzlicher Bundsteg in mm (Inhalt rückt vom Falz weg)
  pad: "hinten" | "vorne" | "verteilt";
  flyFront: number; flyBack: number; // leere Seiten vorne und hinten
  flip: "kurz" | "lang";
  rtl: boolean;
  crop: boolean; fold: boolean; sigMark: boolean;
  holes: number; holeEdge: number; // Anzahl Stechlöcher, Abstand vom Kopf/Fuß in mm
  split: boolean;               // Vorder- und Rückseiten getrennt (Rückseiten umgekehrt)
}

export const DEFAULT_OPTS: Opts = {
  paper: "A4", bookW: 148, bookH: 210, sheets: [4], fill: "einpassen", gutter: 0, pad: "hinten",
  flyFront: 0, flyBack: 0, flip: "kurz", rtl: false, crop: true, fold: true, sigMark: true, holes: 0, holeEdge: 15, split: false,
};

/** Seitenfolge mit Leerseiten (null) in Lagen aufteilen */
export function plan(pageCount: number, o: Opts) {
  const pages: (number | null)[] = [...Array(o.flyFront).fill(null), ...Array.from({ length: pageCount }, (_, i) => i), ...Array(o.flyBack).fill(null)];
  // Lagen bilden, bis alle Seiten untergebracht sind
  const sigs: number[] = []; let cap = 0, k = 0;
  while (cap < pages.length) { const n = Math.max(1, o.sheets[k % o.sheets.length] || 1); sigs.push(n); cap += n * 4; k++; }
  // Wenn die letzte Lage fast leer ist, sie verkleinern
  const over = cap - pages.length;
  if (sigs.length > 0) { const last = sigs.length - 1; const shrink = Math.floor(over / 4); if (shrink > 0 && sigs[last] - shrink >= 1) { sigs[last] -= shrink; cap -= shrink * 4; } }
  const blanks = cap - pages.length;
  let seq: (number | null)[];
  if (o.pad === "vorne") seq = [...Array(blanks).fill(null), ...pages];
  else if (o.pad === "verteilt") { const a = Math.floor(blanks / 2); seq = [...Array(a).fill(null), ...pages, ...Array(blanks - a).fill(null)]; }
  else seq = [...pages, ...Array(blanks).fill(null)];
  // Je Lage: Bogen von außen nach innen, Vorderseite [links, rechts], Rückseite [links, rechts]
  const out: { sheets: { front: [number | null, number | null]; back: [number | null, number | null] }[]; first: number }[] = [];
  let pos = 0;
  for (const n of sigs) {
    const p = seq.slice(pos, pos + n * 4), m = n * 4, sh = [];
    for (let i = 0; i < n; i++) {
      let front: [number | null, number | null] = [p[m - 1 - 2 * i], p[2 * i]];
      let back: [number | null, number | null] = [p[2 * i + 1], p[m - 2 - 2 * i]];
      if (o.rtl) { front = [front[1], front[0]]; back = [back[1], back[0]]; }
      sh.push({ front, back });
    }
    out.push({ sheets: sh, first: pos });
    pos += m;
  }
  return { sigs: out, blanks, total: cap };
}

const LAGE = ["", "Unio", "Binio", "Ternio", "Quaternio", "Quinio", "Senio", "Septenio", "Oktonio"];
/** Kodikologische Bezeichnung einer Lage nach der Zahl ihrer Doppelblätter */
export const lagenName = (n: number, plural = false) => (LAGE[n] ? LAGE[n] + (plural ? "nen" : "") : `Lage aus ${n} Doppelblättern`);

/** Ausgewogene Lagenaufteilungen mit 3 bis 8 Bogen je Lage, die nur den unvermeidlichen Rest leer lassen */
export function suggestions(pageCount: number, o: Opts, min = 3, max = 8) {
  const n = pageCount + o.flyFront + o.flyBack;
  const S = Math.ceil(n / 4);
  const out: { sheets: number[]; label: string }[] = [];
  for (let c = Math.ceil(S / max); c <= Math.floor(S / min); c++) {
    const q = Math.floor(S / c), r = S % c;
    if (q < min || q + (r ? 1 : 0) > max) continue;
    const sheets = [...Array(r).fill(q + 1), ...Array(c - r).fill(q)];
    const part = (k: number, size: number) => `${k} ${lagenName(size, k > 1)}`;
    const parts = [r && part(r, q + 1), c - r && part(c - r, q)].filter(Boolean).join(" und ");
    out.push({ sheets, label: `${c} ${c === 1 ? "Lage" : "Lagen"}: ${parts}` });
  }
  return { list: out, rest: S * 4 - n };
}

export async function impose(src: ArrayBuffer, o: Opts) {
  const inDoc = await PDFDocument.load(src, { ignoreEncryption: true });
  const n = inDoc.getPageCount();
  const pl = plan(n, o);
  const [pw, ph] = PAPER[o.paper];
  const W = ph * MM, H = pw * MM; // quer
  const bw = (o.bookW || ph / 2) * MM, bh = (o.bookH || pw) * MM;
  if (bw * 2 > W + 0.5 || bh > H + 0.5) throw new Error(`Buchformat passt nicht: zwei Seiten à ${o.bookW}×${o.bookH} mm brauchen mindestens ${o.bookW * 2}×${o.bookH} mm, der Bogen hat ${ph}×${pw} mm.`);

  const docs = o.split ? [await PDFDocument.create(), await PDFDocument.create()] : [await PDFDocument.create()];
  const font = await docs[0].embedFont(StandardFonts.Helvetica);
  const fonts = await Promise.all(docs.map((d) => (d === docs[0] ? font : d.embedFont(StandardFonts.Helvetica))));
  const embedded = await Promise.all(docs.map((d) => d.embedPages(inDoc.getPages())));
  const backs: (() => void)[] = [];

  const x0 = W / 2 - bw, y0 = (H - bh) / 2; // linke Seite: x0..W/2, rechte: W/2..W/2+bw
  const gut = o.gutter * MM;
  const grey = rgb(0.35, 0.35, 0.35);

  const drawSide = (di: number, pair: [number | null, number | null], meta: { sig: number; sheet: number; side: "front" | "back"; isInner: boolean; isOuter: boolean }) => {
    const doc = docs[di];
    const page = doc.addPage([W, H]);
    pair.forEach((idx, slot) => {
      if (idx === null) return;
      const ep = embedded[di][idx];
      const iw = ep.width, ih = ep.height;
      const availW = bw - gut, availH = bh;
      const s = o.fill === "original" ? 1 : o.fill === "fuellen" ? Math.max(availW / iw, availH / ih) : Math.min(availW / iw, availH / ih);
      const dw = iw * s, dh = ih * s;
      // Bundsteg: linke Seite rückt nach links, rechte nach rechts
      const slotX = slot === 0 ? x0 : W / 2;
      const cx = slot === 0 ? slotX + (bw - gut) / 2 : slotX + gut + (bw - gut) / 2;
      page.drawPage(ep, { x: cx - dw / 2, y: y0 + (bh - dh) / 2, width: dw, height: dh });
    });
    // Seiten außerhalb des Buchformats abdecken, damit beim Füllen nichts über den Schnitt ragt
    if (o.fill === "fuellen") {
      const white = rgb(1, 1, 1);
      page.drawRectangle({ x: 0, y: 0, width: W, height: y0, color: white });
      page.drawRectangle({ x: 0, y: y0 + bh, width: W, height: H - y0 - bh, color: white });
      page.drawRectangle({ x: 0, y: 0, width: x0, height: H, color: white });
      page.drawRectangle({ x: W / 2 + bw, y: 0, width: W - W / 2 - bw, height: H, color: white });
    }
    const L = 5 * MM, off = 2 * MM;
    if (o.crop) {
      const xs = [x0, W / 2 + bw], ys = [y0, y0 + bh];
      for (const x of xs) for (const y of ys) {
        const dx = x < W / 2 ? -1 : 1, dy = y < H / 2 ? -1 : 1;
        if (Math.abs(x - (x < W / 2 ? 0 : W)) > off + 1) page.drawLine({ start: { x: x + dx * off, y }, end: { x: x + dx * (off + L), y }, thickness: 0.4, color: grey });
        if (Math.abs(y - (y < H / 2 ? 0 : H)) > off + 1) page.drawLine({ start: { x, y: y + dy * off }, end: { x, y: y + dy * (off + L) }, thickness: 0.4, color: grey });
      }
    }
    if (o.fold && y0 > off + 2) {
      page.drawLine({ start: { x: W / 2, y: y0 - off }, end: { x: W / 2, y: Math.max(0, y0 - off - L) }, thickness: 0.4, color: grey, dashArray: [2, 2] });
      page.drawLine({ start: { x: W / 2, y: y0 + bh + off }, end: { x: W / 2, y: Math.min(H, y0 + bh + off + L) }, thickness: 0.4, color: grey, dashArray: [2, 2] });
    }
    // Flattermarke auf dem Rücken: Außenseite des äußersten Bogens, je Lage tiefer gesetzt
    if (o.sigMark && meta.isOuter && meta.side === "front") {
      const step = 6 * MM, mh = 5 * MM;
      const y = y0 + bh - 10 * MM - (meta.sig % Math.max(1, Math.floor((bh - 20 * MM) / step))) * step;
      page.drawRectangle({ x: W / 2 - 1.2 * MM, y: y - mh, width: 2.4 * MM, height: mh, color: rgb(0, 0, 0) });
      if (y0 > 4 * MM) page.drawText(String(meta.sig + 1), { x: W / 2 + 2 * MM, y: y0 - 4 * MM, size: 6, font: fonts[di], color: grey });
    }
    // Stechlöcher auf dem Falz der innersten Doppelseite
    if (o.holes > 1 && meta.isInner && meta.side === "back") {
      const a = y0 + o.holeEdge * MM, b = y0 + bh - o.holeEdge * MM;
      for (let i = 0; i < o.holes; i++) {
        const y = a + ((b - a) * i) / (o.holes - 1);
        page.drawCircle({ x: W / 2, y, size: 0.8 * MM, borderColor: grey, borderWidth: 0.5 });
        page.drawLine({ start: { x: W / 2 - 1.5 * MM, y }, end: { x: W / 2 + 1.5 * MM, y }, thickness: 0.3, color: grey });
      }
    }
    if (meta.side === "back" && o.flip === "lang") page.setRotation(degrees(180));
    return page;
  };

  pl.sigs.forEach((sig, si) => sig.sheets.forEach((sh, i) => {
    const meta = { sig: si, sheet: i, isOuter: i === 0, isInner: i === sig.sheets.length - 1 };
    drawSide(0, sh.front, { ...meta, side: "front" });
    if (o.split) backs.push(() => drawSide(1, sh.back, { ...meta, side: "back" }));
    else drawSide(0, sh.back, { ...meta, side: "back" });
  }));
  if (o.split) backs.reverse().forEach((f) => f());

  const bytes = await Promise.all(docs.map((d) => d.save()));
  return { bytes, plan: pl, pages: n };
}
