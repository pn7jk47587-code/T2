/**
 * Setzt eine Word-Datei (.docx) als PDF im Buchformat: Absätze im Blocksatz, Überschriften,
 * fett und kursiv, Listen, Seitenzahlen. Bilder und Tabellen werden in der ersten Version ausgelassen
 * (Tabellentext bleibt als Absatz erhalten).
 */
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage, rgb } from "pdf-lib";
import frakturUrl from "../assets/fonts/fraktur.ttf?url";
import cookUrl from "../assets/fonts/cook.ttf?url";
import fellUrl from "../assets/fonts/fell.ttf?url";
import fellItUrl from "../assets/fonts/fell-kursiv.ttf?url";

const MM = 72 / 25.4;
export type Stil = "schlicht" | "manuskript";
export type Schrift = "fraktur" | "buchschrift";
export interface SatzOpts { pageW: number; pageH: number; size: number; lead: number; inner: number; outer: number; top: number; bottom: number; numbers: boolean; stil: Stil; schrift: Schrift; initiale: boolean; pergament: boolean; firstPage?: number }
export const DEFAULT_SATZ = { size: 11, lead: 1.35, inner: 18, outer: 14, top: 16, bottom: 20, numbers: true, stil: "schlicht" as Stil, schrift: "fraktur" as Schrift, initiale: true, pergament: false };

const C = {
  tinte: rgb(0.17, 0.11, 0.07), rubrum: rgb(0.64, 0.13, 0.11), gold: rgb(0.74, 0.58, 0.2), goldHell: rgb(0.93, 0.8, 0.45),
  pergament: rgb(0.96, 0.92, 0.82), grund: [rgb(0.48, 0.11, 0.16), rgb(0.14, 0.25, 0.48), rgb(0.24, 0.42, 0.23)],
};
const NOLIG = { features: { liga: false, clig: false, dlig: false, calt: false, rlig: false, ccmp: false } };
const bytesOf = async (u: string) => new Uint8Array(await (await fetch(u)).arrayBuffer());

/** Illuminierte Initiale: Goldrahmen, farbiger Grund mit Goldpunkten, Buchstabe, Ranke im Rand */
function illuminate(page: PDFPage, letter: string, x: number, top: number, box: number, k: number, cook: PDFFont, rankeX: number, rankeLen: number) {
  const g = C.grund[k % C.grund.length];
  const yb = top - box;
  page.drawRectangle({ x: x - 1.2, y: yb - 1.2, width: box + 2.4, height: box + 2.4, color: C.gold });
  page.drawRectangle({ x, y: yb, width: box, height: box, color: g });
  page.drawRectangle({ x: x + box * 0.06, y: yb + box * 0.06, width: box * 0.88, height: box * 0.88, borderColor: C.goldHell, borderWidth: 0.4 });
  const n = 6, st = box / n;
  for (let i = 1; i < n; i++) for (let j = 1; j < n; j++) if ((i + j) % 2 === 0) page.drawCircle({ x: x + i * st, y: yb + j * st, size: box * 0.012 + 0.25, color: C.goldHell, opacity: 0.55 });
  [[0.06, 0.06], [0.94, 0.06], [0.06, 0.94], [0.94, 0.94]].forEach(([a, b]) => page.drawCircle({ x: x + a * box, y: yb + b * box, size: box * 0.045, color: C.goldHell }));
  let fs = box * 0.82; const w = () => cook.widthOfTextAtSize(letter, fs);
  while (w() > box * 0.8) fs *= 0.92;
  const lx = x + (box - w()) / 2, ly = yb + box * 0.2;
  page.drawText(letter, { x: lx + box * 0.02, y: ly - box * 0.02, size: fs, font: cook, color: rgb(0.08, 0.04, 0.03), opacity: 0.5 });
  page.drawText(letter, { x: lx, y: ly, size: fs, font: cook, color: C.goldHell });
  // Ranke
  if (rankeLen > box * 0.6) {
    const y0 = yb - 1.2, y1 = yb - rankeLen;
    page.drawLine({ start: { x: rankeX, y: top }, end: { x: rankeX, y: y1 }, thickness: 0.9, color: C.gold });
    const leaf = "M0,0 C3,-4.5 8,-4.5 10,0 C8,4.5 3,4.5 0,0 Z";
    const cols = [C.rubrum, C.grund[2], C.grund[1]];
    let side = 1, i = 0;
    for (let y = y0 - 6; y > y1 + 4; y -= 13) {
      page.drawLine({ start: { x: rankeX, y }, end: { x: rankeX + side * 2, y: y - 2 }, thickness: 0.6, color: C.gold });
      page.drawSvgPath(leaf, { x: rankeX + side * 2, y: y - 2, scale: side * 0.62, color: cols[i % 3], borderColor: C.gold, borderWidth: 0.3 });
      page.drawCircle({ x: rankeX - side * 2.2, y: y - 5, size: 0.8, color: C.gold });
      side = -side; i++;
    }
    for (let a = 0; a < 6; a++) page.drawCircle({ x: rankeX + Math.cos(a * 1.1) * (3 - a * 0.4), y: y1 + Math.sin(a * 1.1) * (3 - a * 0.4), size: 0.45, color: C.gold });
    page.drawCircle({ x: rankeX, y: top + 2, size: 1.6, color: C.gold });
    page.drawLine({ start: { x: rankeX, y: top - box * 0.25 }, end: { x: x - 1.2, y: top - box * 0.25 }, thickness: 0.9, color: C.gold });
    page.drawLine({ start: { x: rankeX, y: yb + box * 0.25 }, end: { x: x - 1.2, y: yb + box * 0.25 }, thickness: 0.9, color: C.gold });
  }
}



type Style = { b: boolean; i: boolean };
interface Run { text: string; st: Style }
interface Block { kind: "p" | "h1" | "h2" | "h3" | "li" | "break"; runs: Run[]; marker?: string }

/** Zeichen, die die Standardschriften (WinAnsi) nicht kennen, ersetzen */
const ALLOWED = /[ -~ -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/;
const clean = (s: string) => Array.from(s.replace(/­/g, "").replace(/[‐‑]/g, "-").replace(/−/g, "-").replace(/[ -  ]/g, " ")).map((c) => (ALLOWED.test(c) ? c : c.trim() ? "?" : " ")).join("");

function blocksFromHtml(html: string): Block[] {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const out: Block[] = [];
  const runsOf = (el: Node, st: Style, acc: Run[]) => {
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) acc.push({ text: n.textContent ?? "", st });
      else if (n instanceof HTMLElement) {
        if (n.tagName === "BR") acc.push({ text: "\n", st });
        else runsOf(n, { b: st.b || n.tagName === "STRONG" || n.tagName === "B", i: st.i || n.tagName === "EM" || n.tagName === "I" }, acc);
      }
    });
    return acc;
  };
  const walk = (el: Element, listDepth = 0) => {
    Array.from(el.children).forEach((c) => {
      const t = c.tagName;
      if (t === "P") out.push({ kind: "p", runs: runsOf(c, { b: false, i: false }, []) });
      else if (t === "H1") out.push({ kind: "h1", runs: runsOf(c, { b: true, i: false }, []) });
      else if (t === "H2") out.push({ kind: "h2", runs: runsOf(c, { b: true, i: false }, []) });
      else if (/^H[3-6]$/.test(t)) out.push({ kind: "h3", runs: runsOf(c, { b: true, i: false }, []) });
      else if (t === "UL" || t === "OL") {
        let k = 0;
        Array.from(c.children).forEach((li) => {
          k++;
          const sub = Array.from(li.children).filter((x) => x.tagName === "UL" || x.tagName === "OL");
          const clone = li.cloneNode(true) as Element; clone.querySelectorAll("ul,ol").forEach((x) => x.remove());
          out.push({ kind: "li", runs: runsOf(clone, { b: false, i: false }, []), marker: (t === "OL" ? `${k}.` : "•") + " ".repeat(listDepth) });
          sub.forEach((s) => walk({ children: [s] } as unknown as Element, listDepth + 1));
        });
      } else if (t === "TABLE") c.querySelectorAll("tr").forEach((tr) => out.push({ kind: "p", runs: [{ text: Array.from(tr.children).map((td) => td.textContent?.trim()).filter(Boolean).join("  ·  "), st: { b: false, i: false } }] }));
      else if (t === "HR") out.push({ kind: "break", runs: [] });
      else walk(c, listDepth);
    });
  };
  walk(doc.body.firstElementChild!);
  return out.filter((b) => b.kind === "break" || b.runs.some((r) => r.text.trim()));
}

export async function docxToPdf(buf: ArrayBuffer, o: SatzOpts): Promise<{ bytes: Uint8Array; pages: number; skipped: number }> {
  const mammoth = await import("mammoth");
  const res = await mammoth.convertToHtml({ arrayBuffer: buf }, { convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: "" })) });
  const skipped = (res.value.match(/<img/g) ?? []).length;
  const blocks = blocksFromHtml(res.value.replace(/<img[^>]*>/g, ""));
  // @ts-expect-error Paket ohne Typen
  const { hyphenateSync } = (await import("hyphen/de")) as { hyphenateSync: (t: string, o?: object) => string };

  const ms = o.stil === "manuskript";
  const pdf = await PDFDocument.create();
  let F: Record<string, PDFFont>, cook: PDFFont | null = null, fakeBold = false;
  if (ms) {
    const fontkit = (await import("@pdf-lib/fontkit")).default;
    pdf.registerFontkit(fontkit);
    cook = await pdf.embedFont(await bytesOf(cookUrl), NOLIG);
    if (o.schrift === "fraktur") {
      const fr = await pdf.embedFont(await bytesOf(frakturUrl), NOLIG);
      F = { "00": fr, "01": fr, "10": cook, "11": cook };
    } else {
      const fe = await pdf.embedFont(await bytesOf(fellUrl), NOLIG), fi = await pdf.embedFont(await bytesOf(fellItUrl), NOLIG);
      F = { "00": fe, "01": fi, "10": fe, "11": fi }; fakeBold = true;
    }
  } else F = {
    "00": await pdf.embedFont(StandardFonts.TimesRoman), "10": await pdf.embedFont(StandardFonts.TimesRomanBold),
    "01": await pdf.embedFont(StandardFonts.TimesRomanItalic), "11": await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
  const font = (st: Style) => F[`${st.b ? 1 : 0}${st.i ? 1 : 0}`];
  const ink = ms ? C.tinte : rgb(0, 0, 0);
  const W = o.pageW * MM, H = o.pageH * MM;
  let page!: PDFPage; let pageNo = (o.firstPage ?? 1) - 1; let y = 0;
  const newPage = () => {
    page = pdf.addPage([W, H]); pageNo++; y = H - o.top * MM;
    if (ms && o.pergament) page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.pergament });
  };
  newPage();
  const left = () => (pageNo % 2 === 1 ? o.inner : o.outer) * MM; // ungerade Seite = rechts, Bund links
  const width = () => W - (o.inner + o.outer) * MM;
  const bottom = o.bottom * MM;
  let chapter = 0, afterHead = true;

  for (const b of blocks) {
    if (b.kind === "break") { newPage(); continue; }
    const head = b.kind.startsWith("h");
    const size = b.kind === "h1" ? o.size * (ms ? 2 : 1.6) : b.kind === "h2" ? o.size * 1.3 : b.kind === "h3" ? o.size * 1.12 : o.size;
    const lh = size * (b.kind === "p" || b.kind === "li" ? o.lead : 1.2);
    const before = b.kind === "h1" ? size * 1.2 : head ? size * 0.9 : 0;
    const after = head ? size * 0.5 : o.size * 0.45;
    if (b.kind === "h1" && y < H - o.top * MM - 1) newPage();
    else y -= before;
    const hfont = ms && head && cook ? cook : null;
    const color = ms && head ? C.rubrum : ink;
    // Wörter mit Stil sammeln (mit weichen Trennstellen)
    const words: { w: string; st: Style; nl?: boolean }[] = [];
    for (const r of b.runs) for (const p of clean(r.text).split(/(\n| +)/)) {
      if (p === "\n") words.push({ w: "", st: r.st, nl: true });
      else if (p.trim()) words.push({ w: b.kind === "p" || b.kind === "li" ? hyphenateSync(p, { minWordLength: 6 }) : p, st: r.st });
    }
    // Initiale am Kapitelanfang, sonst rotes Absatzzeichen
    let drop: { letter: string; box: number; lines: number } | null = null;
    let pilcrow = false;
    if (ms && b.kind === "p" && words.length) {
      const fw = words.find((t) => !t.nl);
      const m = fw?.w.match(/^([„"'»«(]*)(\p{L})/u);
      if (afterHead && o.initiale && fw && m) {
        const lines = 3, box = lh * (lines - 1) + size * 0.72;
        if (y - lines * lh < bottom) newPage();
        drop = { letter: m[2].toUpperCase(), box, lines };
        fw.w = m[1] + fw.w.slice(m[0].length);
        if (!fw.w.replace(/\u00ad/g, "")) words.splice(words.indexOf(fw), 1);
      } else if (!afterHead) pilcrow = true;
    }
    if (head) afterHead = true; else afterHead = false;
    if (b.kind === "h1") chapter++;

    const indent = b.kind === "li" ? size * 1.4 : 0;
    const dropW = drop ? drop.box + size * 0.45 : 0;
    const pil = pilcrow ? "\u00b6 " : "";
    const SHY = /\u00ad/g;
    const fOf = (st: Style) => hfont ?? font(st);
    const tw = (w: string, st: Style) => fOf(st).widthOfTextAtSize(w.replace(SHY, ""), size);
    const sp = (st: Style) => fOf(st).widthOfTextAtSize(" ", size);
    let lineNo = 0;
    const lineIndent = () => indent + (drop && lineNo < drop.lines ? dropW : 0) + (lineNo === 0 && pil ? F["00"].widthOfTextAtSize(pil, size) : 0);
    const maxW = () => width() - lineIndent();
    let line: typeof words = [], lw = 0;
    const center = ms && b.kind === "h1";
    const flush = (last: boolean) => {
      if (y - lh < bottom) newPage();
      y -= lh;
      const x0 = left() + lineIndent();
      if (lineNo === 0 && b.marker) page.drawText(b.marker, { x: left(), y, size, font: F["00"], color: ms ? C.rubrum : ink });
      if (lineNo === 0 && pil) page.drawText(pil, { x: left() + indent, y, size, font: F["00"], color: C.rubrum });
      if (lineNo === 0 && drop && cook) {
        const top = y + size * 0.72;
        const rankeX = pageNo % 2 === 1 ? left() - o.inner * MM * 0.45 : left() - o.outer * MM * 0.45;
        illuminate(page, drop.letter, left(), top, drop.box, chapter - 1, cook, rankeX, Math.min(top - bottom, drop.box * 3.2));
      }
      const natural = line.reduce((a, t) => a + tw(t.w, t.st), 0);
      const gaps = line.length - 1;
      const just = !last && gaps > 0 && b.kind === "p";
      const extra = just ? (maxW() - natural) / gaps : 0;
      let x = center ? (W - natural - gaps * sp({ b: false, i: false })) / 2 : x0;
      line.forEach((t, k) => {
        const f = fOf(t.st), txt = t.w.replace(SHY, "");
        page.drawText(txt, { x, y, size, font: f, color });
        if (fakeBold && t.st.b && !hfont) page.drawText(txt, { x: x + size * 0.03, y, size, font: f, color });
        x += tw(t.w, t.st) + (k < gaps ? (just ? extra : sp(t.st)) : 0);
      });
      line = []; lw = 0; lineNo++;
    };
    for (const t of words) {
      if (t.nl) { if (line.length) flush(true); continue; }
      let cur = t.w;
      for (;;) {
        const add = (line.length ? sp(t.st) : 0) + tw(cur, t.st);
        if (!line.length || lw + add <= maxW()) { line.push({ w: cur, st: t.st }); lw += add; break; }
        // längsten Wortanfang suchen, der mit Trennstrich noch in die Zeile passt
        const parts = cur.split("\u00ad");
        let k = parts.length - 1, done = false;
        for (; k > 0; k--) {
          const hd = parts.slice(0, k).join("") + "-";
          if (lw + sp(t.st) + tw(hd, t.st) <= maxW()) { line.push({ w: hd, st: t.st }); cur = parts.slice(k).join("\u00ad"); done = true; break; }
        }
        flush(false);
        if (!done) { line.push({ w: cur, st: t.st }); lw = tw(cur, t.st); break; }
      }
    }
    if (line.length) flush(true);
    // kurze Absätze neben der Initiale: Platz bis unter die Initiale freihalten
    if (drop && lineNo < drop.lines) y -= (drop.lines - lineNo) * lh;
    y -= after;
  }
  if (o.numbers) pdf.getPages().forEach((p, i) => {
    const s = String(i + (o.firstPage ?? 1)), f = F["00"], fs = o.size * 0.85;
    p.drawText(s, { x: (W - f.widthOfTextAtSize(s, fs)) / 2, y: (o.bottom * MM) / 2 - fs / 2, size: fs, font: f, color: ms ? C.rubrum : ink });
  });
  return { bytes: await pdf.save(), pages: pdf.getPageCount(), skipped };
}
