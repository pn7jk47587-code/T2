import { useRef, useState } from "react";
import type { CycleLog } from "../core/types";
import { parseFloFiles, type ImportResult } from "../core/floImport";

const de = (d?: string) => (d ? d.split("-").reverse().join(".") : "");

export function FloImport({ log, setLog }: { log: CycleLog; setLog: (l: CycleLog) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [res, setRes] = useState<ImportResult | null>(null);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(0);

  const pick = async (files: FileList | null) => {
    setErr(""); setRes(null); setDone(0);
    if (!files?.length) return;
    try {
      const r = await parseFloFiles(files);
      if (!Object.keys(r.log).length) setErr("Keine Zyklusdaten erkannt");
      setRes(r);
    } catch { setErr("Datei nicht lesbar"); }
  };

  const conflicts = res ? Object.keys(res.log).filter((d) => log[d]) : [];
  const apply = (overwrite: boolean) => {
    if (!res) return;
    const next: CycleLog = { ...log };
    let n = 0;
    for (const [d, v] of Object.entries(res.log)) {
      if (next[d] && !overwrite) continue;
      next[d] = v; n++;
    }
    setLog(next); setDone(n); setRes(null);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="card zy-block zy-import">
      <div className="zy-label">Import aus Flo</div>
      <input ref={input} type="file" accept=".json,.txt,.csv,.zip,application/json,text/plain,application/zip" multiple hidden onChange={(e) => pick(e.target.files)} />
      <button className="btn ghost small" onClick={() => input.current?.click()}>Datei wählen</button>
      {err && <p className="zy-imp-msg">{err}</p>}
      {res && Object.keys(res.log).length > 0 && (
        <div className="zy-imp-prev">
          <p>{de(res.from)} bis {de(res.to)}</p>
          <p>{res.counts.flow} Periodentage · {res.counts.spotting} Schmierblutung · {res.counts.pain} Schmerzen</p>
          <div className="zy-imp-btns">
            <button className="btn ew-burgund small" onClick={() => apply(false)}>Übernehmen</button>
            {conflicts.length > 0 && <button className="btn ghost small" onClick={() => apply(true)}>{conflicts.length} Tage überschreiben</button>}
            <button className="btn ghost small" onClick={() => setRes(null)}>Abbrechen</button>
          </div>
        </div>
      )}
      {res && !Object.keys(res.log).length && res.keys.length > 0 && (
        <details className="zy-imp-keys"><summary>Gefundene Felder</summary><pre>{res.keys.join("\n")}</pre></details>
      )}
      {done > 0 && <p className="zy-imp-msg">{done} Tage übernommen</p>}
    </div>
  );
}
