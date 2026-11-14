import { useEffect, useRef, useState } from "react";
import { Shell } from "../components/Shell";
import { FoldHead } from "../components/Fold";
import { SortList } from "../components/SortList";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { BOOK, DEFAULT_OPTS, PAPER, impose, lagenName, plan, suggestions, type Opts } from "../core/ausschiessen";
import { DEFAULT_SATZ, docxToPdf } from "../core/wordSatz";

function save(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}
type Src = { id: string; name: string; kind: "pdf" | "docx"; buf: ArrayBuffer; pages?: number };
const lbl = (n: number | null) => (n === null ? "–" : String(n + 1));

// PDF robust laden: Vorspann vor „%PDF“ abschneiden, strenge Prüfung lockern
async function ladePdf(buf: ArrayBuffer | Uint8Array) {
  const { PDFDocument } = await import("pdf-lib");
  let u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const kopf = new TextDecoder("latin1").decode(u8.subarray(0, Math.min(u8.length, 4096))).indexOf("%PDF");
  if (kopf > 0) u8 = u8.subarray(kopf);
  let last: unknown;
  for (const opt of [{ ignoreEncryption: true }, { ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false }]) {
    try { return await PDFDocument.load(u8, opt); } catch (e) { last = e; }
  }
  throw last;
}

export function Buchbinderei({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [raw, setRaw] = useStored<Opts>("buchbinderei", DEFAULT_OPTS);
  const o: Opts = { ...DEFAULT_OPTS, ...raw };
  const set = (p: Partial<Opts>) => setRaw({ ...o, ...p });
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; buf: ArrayBuffer; pages: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [going, setGoing] = useState(false);
  const [err, setErr] = useState("");
  const [more, setMore] = useState(false);
  const [sheetsText, setSheetsText] = useState(o.sheets.join(", "));
  const [rawSatz, setSatz] = useStored("buchbinderei-satz", DEFAULT_SATZ);
  const satz = { ...DEFAULT_SATZ, ...rawSatz };
  const [srcs, setSrcs] = useState<Src[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState(0);
  const hasWord = srcs.some((x) => x.kind === "docx"), hasPdf = srcs.some((x) => x.kind === "pdf");

  const add = async (list: FileList | null) => {
    setErr(""); if (!list) return;
    const next: Src[] = [];
    for (const f of Array.from(list)) {
      const id = `${Date.now()}-${Math.random()}`;
      if (/\.doc$/i.test(f.name)) { setErr("Alte .doc-Dateien in Word als .docx speichern."); continue; }
      if (/\.docx$/i.test(f.name)) { next.push({ id, name: f.name.replace(/\.docx$/i, ""), kind: "docx", buf: await f.arrayBuffer() }); continue; }
      try {
        const buf = await f.arrayBuffer();
        const d = await ladePdf(buf);
        next.push({ id, name: f.name.replace(/\.pdf$/i, ""), kind: "pdf", buf, pages: d.getPageCount() });
      } catch (e) { setErr(`„${f.name}“ lässt sich nicht als PDF lesen (${e instanceof Error ? e.message.slice(0, 90) : "unbekannt"}).`); }
    }
    if (next.length) setSrcs((s) => [...s, ...next]);
  };

  const [pw, ph] = PAPER[o.paper];
  const bookW = o.bookW || ph / 2, bookH = o.bookH || pw;
  const fits = bookW * 2 <= ph + 0.5 && bookH <= pw + 0.5;
  const trim = fits ? { side: (ph - bookW * 2) / 2, top: (pw - bookH) / 2 } : null;

  // Alle Dateien in der gewählten Reihenfolge zu einem Buchblock zusammenführen
  useEffect(() => {
    if (!srcs.length) { setFile(null); return; }
    if (hasWord && !fits) return;
    // Eine einzelne PDF-Datei wird nicht neu zusammengesetzt: kein zweites Einlesen, keine Kopie
    if (srcs.length === 1 && srcs[0].kind === "pdf" && srcs[0].pages) {
      const x = srcs[0];
      setFile({ name: x.name, buf: x.buf, pages: x.pages! }); setCounts({ [x.id]: x.pages! }); setSkipped(0); setErr("");
      return;
    }
    let off = false;
    setBusy(true); setErr("");
    (async () => {
      const { PDFDocument } = await import("pdf-lib");
      const out = await PDFDocument.create();
      const c: Record<string, number> = {}; let sk = 0;
      for (const x of srcs) {
        let bytes: ArrayBuffer | Uint8Array = x.buf.slice(0);
        if (x.kind === "docx") {
          const r = await docxToPdf(x.buf.slice(0), { pageW: bookW, pageH: bookH, ...satz, firstPage: out.getPageCount() + 1 });
          bytes = r.bytes; sk += r.skipped;
        }
        const d = await ladePdf(bytes);
        (await out.copyPages(d, d.getPageIndices())).forEach((pg) => out.addPage(pg));
        c[x.id] = d.getPageCount();
      }
      if (off) return;
      const u8 = await out.save();
      setFile({ name: srcs.length === 1 ? srcs[0].name : "Buch", buf: u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer, pages: out.getPageCount() });
      setCounts(c); setSkipped(sk);
    })()
      .catch((e) => { if (!off) setErr(`Eine der Dateien lässt sich nicht lesen (${e instanceof Error ? e.message.slice(0, 90) : "unbekannt"}).`); })
      .finally(() => { if (!off) setBusy(false); });
    return () => { off = true; };
  }, [srcs, bookW, bookH, fits, satz.size, satz.numbers, satz.stil, satz.schrift, satz.initiale, satz.pergament]);

  const preview = () => {
    if (!file) return;
    const url = URL.createObjectURL(new Blob([file.buf], { type: "application/pdf" }));
    window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const pl = file ? plan(file.pages, o) : null;
  const sug = file ? suggestions(file.pages, o) : null;
  const presetKey = Object.entries(BOOK).find(([, v]) => v[0] === o.bookW && v[1] === o.bookH)?.[0] ?? "Eigenes";

  const run = async () => {
    if (!file) return;
    setBusy(true); setGoing(true); setErr("");
    try {
      const r = await impose(file.buf, hasPdf ? o : { ...o, fill: "original" });
      if (o.split) { save(r.bytes[0], `${file.name}-schoendruck.pdf`); setTimeout(() => save(r.bytes[1], `${file.name}-widerdruck.pdf`), 600); }
      else save(r.bytes[0], `${file.name}-ausgeschossen.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Ausschießen fehlgeschlagen."); }
    setBusy(false); setGoing(false);
  };

  const Chips = <T extends string | number>({ v, opts, on }: { v: T; opts: [T, string][]; on: (x: T) => void }) => (
    <div className="bf-chips">{opts.map(([k, name]) => <button key={String(k)} className={"bf-chip" + (v === k ? " on" : "")} onClick={() => on(k)}>{name}</button>)}</div>
  );

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <input ref={input} type="file" multiple accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {srcs.length === 0 ? (
        <button className="card bb-file" onClick={() => input.current?.click()}><b>PDF oder Word wählen</b><small>Mehrere Dateien werden zu einem Buch. Sie bleiben auf diesem Gerät.</small></button>
      ) : (
        <div className="card bb-srcs">
          <SortList items={srcs} keyOf={(x) => x.id} onReorder={setSrcs} onTap={() => {}} render={(x) => (
            <div className="bb-src">
              <span><b>{x.name}</b><small>{x.kind === "docx" ? "Word" : "PDF"}{counts[x.id] ? ` · ${counts[x.id]} Seiten` : ""}</small></span>
              <button aria-label="Entfernen" onPointerDown={(e) => e.stopPropagation()} onClick={() => setSrcs((s) => s.filter((y) => y.id !== x.id))}>×</button>
            </div>
          )} />
          <div className="bb-src-foot">
            <small>{busy && !file ? "Wird gesetzt …" : file ? `${file.pages} Seiten im Buchblock` : ""}</small>
            <button className="bf-chip" onClick={() => input.current?.click()}>Datei hinzufügen</button>
          </div>
        </div>
      )}

      <div className="sheet-label">Druckbogen</div>
      <Chips v={o.paper} opts={Object.keys(PAPER).map((k) => [k, k] as [string, string]) as [Opts["paper"], string][]} on={(paper) => set({ paper })} />

      <div className="sheet-label">Endformat</div>
      <Chips v={presetKey} opts={[...Object.keys(BOOK), "Eigenes"].map((k) => [k, k] as [string, string])} on={(k) => { if (k !== "Eigenes") { const [w, h] = BOOK[k]; set({ bookW: w, bookH: h }); } else set({ bookW: o.bookW || 140, bookH: o.bookH || 200 }); }} />
      {presetKey === "Eigenes" && (
        <div className="bb-mm">
          <label><small>Breite</small><input className="sheet-in" type="number" inputMode="decimal" value={o.bookW} onChange={(e) => set({ bookW: Number(e.target.value) || 0 })} /> mm</label>
          <label><small>Höhe</small><input className="sheet-in" type="number" inputMode="decimal" value={o.bookH} onChange={(e) => set({ bookH: Number(e.target.value) || 0 })} /> mm</label>
        </div>
      )}
      <p className={"bb-info" + (fits ? "" : " bad")}>
        {fits ? (trim && (trim.side > 0.5 || trim.top > 0.5) ? `Beschnitt: vorne je ${trim.side.toFixed(1).replace(".", ",")} mm, Kopf und Fuß je ${trim.top.toFixed(1).replace(".", ",")} mm.` : "Passt genau auf den Bogen, kein Beschnitt nötig.")
          : `Zwei Seiten à ${bookW}×${bookH} mm passen nicht auf ${o.paper} quer (${ph}×${pw} mm).`}
      </p>

      <div className="sheet-label">Doppelblätter je Lage</div>
      <div className="bb-mm">
        <label className="wide"><input className="sheet-in" value={sheetsText} inputMode="numeric" onChange={(e) => { setSheetsText(e.target.value); const v = e.target.value.split(/[,; ]+/).map(Number).filter((x) => x > 0 && x < 20); if (v.length) set({ sheets: v }); }} /></label>
      </div>
      <p className="bb-info">{o.sheets.length > 1 ? `Abwechselnd ${o.sheets.map((n) => lagenName(n)).join(", ")}.` : `${lagenName(o.sheets[0])}: ${o.sheets[0]} Doppelblätter, ${o.sheets[0] * 4} Seiten je Lage.`} Mehrere Zahlen mit Komma für wechselnde Lagenstärken.</p>

      {hasWord && (
        <>
          <div className="sheet-label">Gestaltung</div>
          <Chips v={satz.stil} opts={[["schlicht", "Schlicht"], ["manuskript", "Manuskript"]]} on={(stil) => setSatz({ ...satz, stil })} />
          {satz.stil === "manuskript" && (
            <>
              <div className="sheet-label">Schrift</div>
              <Chips v={satz.schrift} opts={[["fraktur", "Fraktur"], ["buchschrift", "Buchschrift"]]} on={(schrift) => setSatz({ ...satz, schrift })} />
              <div className="sheet-label">Zier</div>
              <div className="bf-chips">
                <button className={"bf-chip" + (satz.initiale ? " on" : "")} onClick={() => setSatz({ ...satz, initiale: !satz.initiale })}>Illuminierte Initialen</button>
                <button className={"bf-chip" + (satz.pergament ? " on" : "")} onClick={() => setSatz({ ...satz, pergament: !satz.pergament })}>Pergamentgrund</button>
              </div>
            </>
          )}
          <div className="sheet-label">Schriftgrad</div>
          <div className="hb-num"><button onClick={() => setSatz({ ...satz, size: Math.max(7, satz.size - 0.5) })}>−</button><b>{String(satz.size).replace(".", ",")} pt</b><button onClick={() => setSatz({ ...satz, size: Math.min(16, satz.size + 0.5) })}>+</button></div>
          <div className="sheet-label">Pagina</div>
          <Chips v={satz.numbers ? "ja" : "nein"} opts={[["ja", "Ja"], ["nein", "Nein"]]} on={(v) => setSatz({ ...satz, numbers: v === "ja" })} />
          {file && !busy && <button className="au-btn bb-look" onClick={preview}>Satz ansehen</button>}
          {skipped > 0 && <p className="bb-info">{skipped} {skipped === 1 ? "Bild wurde" : "Bilder wurden"} ausgelassen.</p>}
        </>
      )}
      {(hasPdf || !srcs.length) && (
        <>
          <div className="sheet-label">Seite einpassen</div>
          <Chips v={o.fill} opts={[["einpassen", "Einpassen"], ["fuellen", "Füllen"], ["original", "Originalgröße"]]} on={(fill) => set({ fill })} />
        </>
      )}

      <div className="sheet-label">Widerdruck, wenden über</div>
      <Chips v={o.flip} opts={[["kurz", "Kurze Kante"], ["lang", "Lange Kante"]]} on={(flip) => set({ flip })} />

      <FoldHead label="Weitere Einstellungen" open={more} onToggle={() => setMore((v) => !v)} />
      {more && (
        <div className="bb-more">
          <div className="sheet-label">Bundzugabe</div>
          <div className="hb-num"><button onClick={() => set({ gutter: Math.max(0, o.gutter - 1) })}>−</button><b>{o.gutter} mm</b><button onClick={() => set({ gutter: o.gutter + 1 })}>+</button></div>
          <div className="sheet-label">Vakatseiten einfügen</div>
          <Chips v={o.pad} opts={[["hinten", "Hinten"], ["vorne", "Vorne"], ["verteilt", "Vorne und hinten"]]} on={(pad) => set({ pad })} />
          <div className="sheet-label">Vorsatz und Nachsatz (leere Seiten)</div>
          <div className="bb-two">
            <span>Vorsatz</span><div className="hb-num"><button onClick={() => set({ flyFront: Math.max(0, o.flyFront - 1) })}>−</button><b>{o.flyFront}</b><button onClick={() => set({ flyFront: o.flyFront + 1 })}>+</button></div>
            <span>Nachsatz</span><div className="hb-num"><button onClick={() => set({ flyBack: Math.max(0, o.flyBack - 1) })}>−</button><b>{o.flyBack}</b><button onClick={() => set({ flyBack: o.flyBack + 1 })}>+</button></div>
          </div>
          <div className="sheet-label">Bundseite</div>
          <Chips v={o.rtl ? "r" : "l"} opts={[["l", "Links"], ["r", "Rechts"]]} on={(v) => set({ rtl: v === "r" })} />
          <div className="sheet-label">Druckmarken</div>
          <div className="bf-chips">
            <button className={"bf-chip" + (o.crop ? " on" : "")} onClick={() => set({ crop: !o.crop })}>Schnittmarken</button>
            <button className={"bf-chip" + (o.fold ? " on" : "")} onClick={() => set({ fold: !o.fold })}>Falzmarken</button>
            <button className={"bf-chip" + (o.sigMark ? " on" : "")} onClick={() => set({ sigMark: !o.sigMark })}>Flattermarke und Bogensignatur</button>
          </div>
          <div className="sheet-label">Heftlöcher im Falz</div>
          <div className="bb-two">
            <span>Anzahl</span><div className="hb-num"><button onClick={() => set({ holes: o.holes <= 2 ? 0 : o.holes - 1 })}>−</button><b>{o.holes || "keine"}</b><button onClick={() => set({ holes: o.holes < 2 ? 2 : o.holes + 1 })}>+</button></div>
            {o.holes > 1 && <><span>Abstand Kopf/Fuß</span><div className="hb-num"><button onClick={() => set({ holeEdge: Math.max(3, o.holeEdge - 1) })}>−</button><b>{o.holeEdge} mm</b><button onClick={() => set({ holeEdge: o.holeEdge + 1 })}>+</button></div></>}
          </div>
          <div className="sheet-label">Drucker ohne beidseitigen Druck</div>
          <Chips v={o.split ? "ja" : "nein"} opts={[["nein", "Eine Datei"], ["ja", "Schön- und Widerdruck getrennt"]]} on={(v) => set({ split: v === "ja" })} />
        </div>
      )}

      {pl && (
        <>
          <div className="sheet-label">Plan</div>
          <div className="card bb-plan">
            <p>{pl.sigs.length} {pl.sigs.length === 1 ? "Lage" : "Lagen"} · {pl.sigs.reduce((a, s) => a + s.sheets.length, 0)} Bogen · {pl.blanks} {pl.blanks === 1 ? "Vakatseite" : "Vakatseiten"}</p>
            {pl.sigs.map((s, i) => (
              <details key={i}>
                <summary>Lage {i + 1}: {lagenName(s.sheets.length)}</summary>
                <table className="bb-tab"><thead><tr><th>Bogen</th><th>Schöndruck</th><th>Widerdruck</th></tr></thead>
                  <tbody>{s.sheets.map((sh, k) => <tr key={k}><td>{k + 1}</td><td>{lbl(sh.front[0])} | {lbl(sh.front[1])}</td><td>{lbl(sh.back[0])} | {lbl(sh.back[1])}</td></tr>)}</tbody>
                </table>
              </details>
            ))}
          </div>
        </>
      )}

      {sug && pl && sug.list.length > 0 && (
        <>
          <div className="sheet-label">Lagenvorschläge ohne Vakatseiten</div>
          <div className="bf-chips bb-sug">
            {sug.list.map((v) => {
              const on = v.sheets.join() === pl.sigs.map((x) => x.sheets.length).join();
              return <button key={v.label} className={"bf-chip" + (on ? " on" : "")} onClick={() => { set({ sheets: v.sheets }); setSheetsText(v.sheets.join(", ")); }}>{v.label}</button>;
            })}
          </div>
          {sug.rest > 0 && <p className="bb-info">{sug.rest} {sug.rest === 1 ? "Vakatseite bleibt" : "Vakatseiten bleiben"}, weil jeder Bogen vier Seiten trägt.</p>}
        </>
      )}

      {err && <p className="bb-info bad">{err}</p>}
      <button className="au-btn primary bb-go" disabled={!file || !fits || busy} onClick={run}>{going ? "Wird ausgeschossen …" : busy ? "Wird zusammengestellt …" : "Ausschießen"}</button>
      <p className="bb-info">
        Drucken in Originalgröße (100 %, nicht „an Seite anpassen“), {o.paper} quer, {o.split ? "erst den Schöndruck, den Stapel wenden, dann den Widerdruck" : `beidseitig, wenden über die ${o.flip === "kurz" ? "kurze" : "lange"} Kante`}. Die Bogen jeder Lage in der Druckreihenfolge falzen und ineinanderstecken, dann die Lagen zusammentragen.
      </p>
    </Shell>
  );
}
