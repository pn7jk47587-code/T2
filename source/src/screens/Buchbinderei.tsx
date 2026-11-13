import { useEffect, useRef, useState } from "react";
import { Shell } from "../components/Shell";
import { FoldHead } from "../components/Fold";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { BOOK, DEFAULT_OPTS, PAPER, impose, plan, suggestions, type Opts } from "../core/ausschiessen";
import { DEFAULT_SATZ, docxToPdf } from "../core/wordSatz";

function save(bytes: Uint8Array, name: string) {
  const url = URL.createObjectURL(new Blob([bytes as unknown as ArrayBuffer], { type: "application/pdf" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}
const lbl = (n: number | null) => (n === null ? "–" : String(n + 1));

export function Buchbinderei({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [raw, setRaw] = useStored<Opts>("buchbinderei", DEFAULT_OPTS);
  const o: Opts = { ...DEFAULT_OPTS, ...raw };
  const set = (p: Partial<Opts>) => setRaw({ ...o, ...p });
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; buf: ArrayBuffer; pages: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [more, setMore] = useState(false);
  const [sheetsText, setSheetsText] = useState(o.sheets.join(", "));
  const [rawSatz, setSatz] = useStored("buchbinderei-satz", DEFAULT_SATZ);
  const satz = { ...DEFAULT_SATZ, ...rawSatz };
  const [word, setWord] = useState<{ name: string; buf: ArrayBuffer } | null>(null);
  const [skipped, setSkipped] = useState(0);

  const pick = async (f?: File) => {
    setErr(""); if (!f) return;
    if (/\.doc$/i.test(f.name)) { setErr("Alte .doc-Dateien in Word als .docx speichern."); return; }
    if (/\.docx$/i.test(f.name)) { setFile(null); setWord({ name: f.name.replace(/\.docx$/i, ""), buf: await f.arrayBuffer() }); return; }
    setWord(null); setSkipped(0);
    try {
      const buf = await f.arrayBuffer();
      const { PDFDocument } = await import("pdf-lib");
      const d = await PDFDocument.load(buf.slice(0), { ignoreEncryption: true });
      setFile({ name: f.name.replace(/\.pdf$/i, ""), buf, pages: d.getPageCount() });
    } catch { setErr("Die Datei lässt sich nicht als PDF lesen."); }
  };

  const [pw, ph] = PAPER[o.paper];
  const bookW = o.bookW || ph / 2, bookH = o.bookH || pw;
  const fits = bookW * 2 <= ph + 0.5 && bookH <= pw + 0.5;
  const trim = fits ? { side: (ph - bookW * 2) / 2, top: (pw - bookH) / 2 } : null;

  useEffect(() => {
    if (!word || !fits) return;
    let off = false;
    setBusy(true); setErr("");
    docxToPdf(word.buf.slice(0), { pageW: bookW, pageH: bookH, ...satz })
      .then((r) => { if (!off) { setFile({ name: word.name, buf: r.bytes.buffer.slice(r.bytes.byteOffset, r.bytes.byteOffset + r.bytes.byteLength) as ArrayBuffer, pages: r.pages }); setSkipped(r.skipped); } })
      .catch(() => { if (!off) setErr("Die Word-Datei lässt sich nicht lesen."); })
      .finally(() => { if (!off) setBusy(false); });
    return () => { off = true; };
  }, [word, bookW, bookH, fits, satz.size, satz.numbers, satz.stil, satz.schrift, satz.initiale, satz.pergament]);

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
    setBusy(true); setErr("");
    try {
      const r = await impose(file.buf.slice(0), word ? { ...o, fill: "original" } : o);
      if (o.split) { save(r.bytes[0], `${file.name}-vorderseiten.pdf`); setTimeout(() => save(r.bytes[1], `${file.name}-rueckseiten.pdf`), 600); }
      else save(r.bytes[0], `${file.name}-zum-binden.pdf`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Ausschießen fehlgeschlagen."); }
    setBusy(false);
  };

  const Chips = <T extends string | number>({ v, opts, on }: { v: T; opts: [T, string][]; on: (x: T) => void }) => (
    <div className="bf-chips">{opts.map(([k, name]) => <button key={String(k)} className={"bf-chip" + (v === k ? " on" : "")} onClick={() => on(k)}>{name}</button>)}</div>
  );

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <input ref={input} type="file" accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      <button className="card bb-file" onClick={() => input.current?.click()}>
        {word && !file ? <><b>{word.name}</b><small>Wird gesetzt …</small></> : file ? <><b>{file.name}</b><small>{file.pages} Seiten{word ? " im Buchformat gesetzt" : ""} · andere Datei wählen</small></> : <><b>PDF oder Word wählen</b><small>Die Datei bleibt auf diesem Gerät</small></>}
      </button>

      <div className="sheet-label">Druckbogen</div>
      <Chips v={o.paper} opts={Object.keys(PAPER).map((k) => [k, k] as [string, string]) as [Opts["paper"], string][]} on={(paper) => set({ paper })} />

      <div className="sheet-label">Buchformat (fertige Seite)</div>
      <Chips v={presetKey} opts={[...Object.keys(BOOK), "Eigenes"].map((k) => [k, k] as [string, string])} on={(k) => { if (k !== "Eigenes") { const [w, h] = BOOK[k]; set({ bookW: w, bookH: h }); } else set({ bookW: o.bookW || 140, bookH: o.bookH || 200 }); }} />
      {presetKey === "Eigenes" && (
        <div className="bb-mm">
          <label><small>Breite</small><input className="sheet-in" type="number" inputMode="decimal" value={o.bookW} onChange={(e) => set({ bookW: Number(e.target.value) || 0 })} /> mm</label>
          <label><small>Höhe</small><input className="sheet-in" type="number" inputMode="decimal" value={o.bookH} onChange={(e) => set({ bookH: Number(e.target.value) || 0 })} /> mm</label>
        </div>
      )}
      <p className={"bb-info" + (fits ? "" : " bad")}>
        {fits ? (trim && (trim.side > 0.5 || trim.top > 0.5) ? `Beschnitt mit der Guillotine: außen je ${trim.side.toFixed(1).replace(".", ",")} mm, oben und unten je ${trim.top.toFixed(1).replace(".", ",")} mm.` : "Passt genau auf den Bogen, kein Beschnitt nötig.")
          : `Zwei Seiten à ${bookW}×${bookH} mm passen nicht auf ${o.paper} quer (${ph}×${pw} mm).`}
      </p>

      <div className="sheet-label">Bogen pro Lage</div>
      <div className="bb-mm">
        <label className="wide"><input className="sheet-in" value={sheetsText} inputMode="numeric" onChange={(e) => { setSheetsText(e.target.value); const v = e.target.value.split(/[,; ]+/).map(Number).filter((x) => x > 0 && x < 20); if (v.length) set({ sheets: v }); }} /></label>
      </div>
      <p className="bb-info">{o.sheets.length > 1 ? `Abwechselnd ${o.sheets.join(", ")} Bogen.` : `${o.sheets[0]} Bogen = ${o.sheets[0] * 4} Seiten je Lage.`} Mehrere Zahlen mit Komma für wechselnde Lagengrößen.</p>

      {word ? (
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
          <div className="sheet-label">Schriftgröße</div>
          <div className="hb-num"><button onClick={() => setSatz({ ...satz, size: Math.max(7, satz.size - 0.5) })}>−</button><b>{String(satz.size).replace(".", ",")} pt</b><button onClick={() => setSatz({ ...satz, size: Math.min(16, satz.size + 0.5) })}>+</button></div>
          <div className="sheet-label">Seitenzahlen</div>
          <Chips v={satz.numbers ? "ja" : "nein"} opts={[["ja", "Ja"], ["nein", "Nein"]]} on={(v) => setSatz({ ...satz, numbers: v === "ja" })} />
          {file && !busy && <button className="au-btn bb-look" onClick={preview}>Satz ansehen</button>}
          {skipped > 0 && <p className="bb-info">{skipped} {skipped === 1 ? "Bild wurde" : "Bilder wurden"} ausgelassen.</p>}
        </>
      ) : (
        <>
          <div className="sheet-label">Seite einpassen</div>
          <Chips v={o.fill} opts={[["einpassen", "Einpassen"], ["fuellen", "Füllen"], ["original", "Originalgröße"]]} on={(fill) => set({ fill })} />
        </>
      )}

      <div className="sheet-label">Beidseitig drucken, wenden über</div>
      <Chips v={o.flip} opts={[["kurz", "Kurze Kante"], ["lang", "Lange Kante"]]} on={(flip) => set({ flip })} />

      <FoldHead label="Weitere Einstellungen" open={more} onToggle={() => setMore((v) => !v)} />
      {more && (
        <div className="bb-more">
          <div className="sheet-label">Zusätzlicher Bundsteg</div>
          <div className="hb-num"><button onClick={() => set({ gutter: Math.max(0, o.gutter - 1) })}>−</button><b>{o.gutter} mm</b><button onClick={() => set({ gutter: o.gutter + 1 })}>+</button></div>
          <div className="sheet-label">Leerseiten zum Auffüllen</div>
          <Chips v={o.pad} opts={[["hinten", "Hinten"], ["vorne", "Vorne"], ["verteilt", "Vorne und hinten"]]} on={(pad) => set({ pad })} />
          <div className="sheet-label">Vorsatz (leere Seiten)</div>
          <div className="bb-two">
            <span>Vorne</span><div className="hb-num"><button onClick={() => set({ flyFront: Math.max(0, o.flyFront - 1) })}>−</button><b>{o.flyFront}</b><button onClick={() => set({ flyFront: o.flyFront + 1 })}>+</button></div>
            <span>Hinten</span><div className="hb-num"><button onClick={() => set({ flyBack: Math.max(0, o.flyBack - 1) })}>−</button><b>{o.flyBack}</b><button onClick={() => set({ flyBack: o.flyBack + 1 })}>+</button></div>
          </div>
          <div className="sheet-label">Bindung</div>
          <Chips v={o.rtl ? "r" : "l"} opts={[["l", "Links"], ["r", "Rechts"]]} on={(v) => set({ rtl: v === "r" })} />
          <div className="sheet-label">Marken</div>
          <div className="bf-chips">
            <button className={"bf-chip" + (o.crop ? " on" : "")} onClick={() => set({ crop: !o.crop })}>Schnittmarken</button>
            <button className={"bf-chip" + (o.fold ? " on" : "")} onClick={() => set({ fold: !o.fold })}>Falzmarken</button>
            <button className={"bf-chip" + (o.sigMark ? " on" : "")} onClick={() => set({ sigMark: !o.sigMark })}>Flattermarke und Lagennummer</button>
          </div>
          <div className="sheet-label">Stechlöcher auf dem Falz</div>
          <div className="bb-two">
            <span>Anzahl</span><div className="hb-num"><button onClick={() => set({ holes: o.holes <= 2 ? 0 : o.holes - 1 })}>−</button><b>{o.holes || "keine"}</b><button onClick={() => set({ holes: o.holes < 2 ? 2 : o.holes + 1 })}>+</button></div>
            {o.holes > 1 && <><span>Abstand Kopf/Fuß</span><div className="hb-num"><button onClick={() => set({ holeEdge: Math.max(3, o.holeEdge - 1) })}>−</button><b>{o.holeEdge} mm</b><button onClick={() => set({ holeEdge: o.holeEdge + 1 })}>+</button></div></>}
          </div>
          <div className="sheet-label">Drucker ohne Beidseitendruck</div>
          <Chips v={o.split ? "ja" : "nein"} opts={[["nein", "Eine Datei"], ["ja", "Vorder- und Rückseiten getrennt"]]} on={(v) => set({ split: v === "ja" })} />
        </div>
      )}

      {pl && (
        <>
          <div className="sheet-label">Plan</div>
          <div className="card bb-plan">
            <p>{pl.sigs.length} {pl.sigs.length === 1 ? "Lage" : "Lagen"} · {pl.sigs.reduce((a, s) => a + s.sheets.length, 0)} Bogen · {pl.blanks} Leerseiten ergänzt</p>
            {pl.sigs.map((s, i) => (
              <details key={i}>
                <summary>Lage {i + 1}: {s.sheets.length} Bogen</summary>
                <table className="bb-tab"><thead><tr><th>Bogen</th><th>Vorderseite</th><th>Rückseite</th></tr></thead>
                  <tbody>{s.sheets.map((sh, k) => <tr key={k}><td>{k + 1}</td><td>{lbl(sh.front[0])} | {lbl(sh.front[1])}</td><td>{lbl(sh.back[0])} | {lbl(sh.back[1])}</td></tr>)}</tbody>
                </table>
              </details>
            ))}
          </div>
        </>
      )}

      {sug && pl && sug.list.length > 0 && (
        <>
          <div className="sheet-label">Vorschläge ohne Leerseiten</div>
          <div className="bf-chips bb-sug">
            {sug.list.map((v) => {
              const on = v.sheets.join() === pl.sigs.map((x) => x.sheets.length).join();
              return <button key={v.label} className={"bf-chip" + (on ? " on" : "")} onClick={() => { set({ sheets: v.sheets }); setSheetsText(v.sheets.join(", ")); }}>{v.label}</button>;
            })}
          </div>
          {sug.rest > 0 && <p className="bb-info">{sug.rest} {sug.rest === 1 ? "Leerseite bleibt" : "Leerseiten bleiben"}, weil jeder Bogen vier Seiten trägt.</p>}
        </>
      )}

      {err && <p className="bb-info bad">{err}</p>}
      <button className="au-btn primary bb-go" disabled={!file || !fits || busy} onClick={run}>{busy ? (word && !pl ? "Wird gesetzt …" : "Wird ausgeschossen …") : "Zum Binden vorbereiten"}</button>
      <p className="bb-info">
        Drucken in Originalgröße (100 %, nicht „an Seite anpassen“), {o.paper} quer, {o.split ? "erst die Vorderseiten, den Stapel wenden, dann die Rückseiten" : `beidseitig, wenden über die ${o.flip === "kurz" ? "kurze" : "lange"} Kante`}. Bogen jeder Lage in der gedruckten Reihenfolge ineinanderlegen und falzen.
      </p>
    </Shell>
  );
}
