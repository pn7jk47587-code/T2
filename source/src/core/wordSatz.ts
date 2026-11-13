/**
 * Setzt eine Word-Datei (.docx) als PDF im Buchformat: Absätze im Blocksatz, Überschriften,
 * fett und kursiv, Listen, Seitenzahlen. Bilder und Tabellen werden in der ersten Version ausgelassen
 * (Tabellentext bleibt als Absatz erhalten).
 */
import { PDFDocument, StandardFonts, type PDFFont, rgb } from "pdf-lib";

const MM = 72 / 25.4;
export interface SatzOpts { pageW: number; pageH: number; size: number; lead: number; inner: number; outer: number; top: number; bottom: number; numbers: boolean }
export const DEFAULT_SATZ = { size: 11, lead: 1.35, inner: 18, outer: 14, top: 16, bottom: 20, numbers: true };

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

  const pdf = await PDFDocument.create();
  const F: Record<string, PDFFont> = {
    "00": await pdf.embedFont(StandardFonts.TimesRoman), "10": await pdf.embedFont(StandardFonts.TimesRomanBold),
    "01": await pdf.embedFont(StandardFonts.TimesRomanItalic), "11": await pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
  };
  const font = (st: Style) => F[`${st.b ? 1 : 0}${st.i ? 1 : 0}`];
  const W = o.pageW * MM, H = o.pageH * MM;
  let page = pdf.addPage([W, H]); let pageNo = 1; let y = H - o.top * MM;
  const left = () => (pageNo % 2 === 1 ? o.inner : o.outer) * MM; // ungerade Seite = rechts, Bund links
  const width = () => W - (o.inner + o.outer) * MM;
  const newPage = () => { page = pdf.addPage([W, H]); pageNo++; y = H - o.top * MM; };
  const bottom = o.bottom * MM;

  for (const b of blocks) {
    if (b.kind === "break") { newPage(); continue; }
    const size = b.kind === "h1" ? o.size * 1.6 : b.kind === "h2" ? o.size * 1.3 : b.kind === "h3" ? o.size * 1.12 : o.size;
    const lh = size * (b.kind === "p" || b.kind === "li" ? o.lead : 1.2);
    const before = b.kind === "h1" ? size * 1.2 : b.kind.startsWith("h") ? size * 0.9 : 0;
    const after = b.kind.startsWith("h") ? size * 0.5 : o.size * 0.45;
    if (b.kind === "h1" && y < H - o.top * MM - 1) newPage();
    else y -= before;
    // Wörter mit Stil sammeln (mit weichen Trennstellen)
    const words: { w: string; st: Style; nl?: boolean }[] = [];
    for (const r of b.runs) for (const p of clean(r.text).split(/(\n| +)/)) {
      if (p === "\n") words.push({ w: "", st: r.st, nl: true });
      else if (p.trim()) words.push({ w: b.kind === "p" || b.kind === "li" ? hyphenateSync(p, { minWordLength: 6 }) : p, st: r.st });
    }
    const indent = b.kind === "li" ? size * 1.4 : 0;
    const maxW = width() - indent;
    const SHY = /\u00ad/g;
    const tw = (w: string, st: Style) => font(st).widthOfTextAtSize(w.replace(SHY, ""), size);
    const sp = (st: Style) => font(st).widthOfTextAtSize(" ", size);
    let line: typeof words = [], lw = 0, first = true;
    const flush = (last: boolean) => {
      if (y - lh < bottom) newPage();
      y -= lh;
      const x0 = left() + indent;
      if (first && b.marker) page.drawText(b.marker, { x: left(), y, size, font: F["00"] });
      const natural = line.reduce((a, t) => a + tw(t.w, t.st), 0);
      const gaps = line.length - 1;
      const just = !last && gaps > 0 && b.kind === "p";
      const extra = just ? (maxW - natural) / gaps : 0;
      let x = x0;
      line.forEach((t, k) => {
        page.drawText(t.w.replace(SHY, ""), { x, y, size, font: font(t.st), color: rgb(0, 0, 0) });
        x += tw(t.w, t.st) + (k < gaps ? (just ? extra : sp(t.st)) : 0);
      });
      line = []; lw = 0; first = false;
    };
    for (const t of words) {
      if (t.nl) { if (line.length) flush(true); continue; }
      let cur = t.w;
      for (;;) {
        const add = (line.length ? sp(t.st) : 0) + tw(cur, t.st);
        if (!line.length || lw + add <= maxW) { line.push({ w: cur, st: t.st }); lw += add; break; }
        // längsten Wortanfang suchen, der mit Trennstrich noch in die Zeile passt
        const parts = cur.split("\u00ad");
        let k = parts.length - 1, done = false;
        for (; k > 0; k--) {
          const head = parts.slice(0, k).join("") + "-";
          if (lw + sp(t.st) + tw(head, t.st) <= maxW) { line.push({ w: head, st: t.st }); cur = parts.slice(k).join("\u00ad"); done = true; break; }
        }
        flush(false);
        if (!done) { line.push({ w: cur, st: t.st }); lw = tw(cur, t.st); break; }
      }
    }
    if (line.length) flush(true);
    y -= after;
  }
  if (o.numbers) pdf.getPages().forEach((p, i) => {
    const s = String(i + 1), f = F["00"], fs = o.size * 0.85;
    p.drawText(s, { x: (W - f.widthOfTextAtSize(s, fs)) / 2, y: (o.bottom * MM) / 2 - fs / 2, size: fs, font: f });
  });
  return { bytes: await pdf.save(), pages: pdf.getPageCount(), skipped };
}
