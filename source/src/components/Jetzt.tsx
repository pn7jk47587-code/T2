import { useEffect, useState } from "react";
import { useStored } from "../core/db";
import { todayISO } from "../core/overview";
import { DEFAULT, addDays, catOf, freeSlot, materialize, toHHMM, toMin, type Tagwerk } from "../core/tagwerk";

/**
 * Große Anzeige „Jetzt ist …“: erscheint, solange die App offen ist, zur Startzeit einer Aufgabe.
 * Ein Kurzbefehl kann sie über die Adresse #jetzt?vorlage=<id> auch von außen öffnen.
 */
export function Jetzt() {
  const [raw, setW, ready] = useStored<Tagwerk>("tagwerk", DEFAULT);
  const w: Tagwerk = { ...DEFAULT, ...raw };
  const [id, setId] = useState<string | null>(null);
  const [run, setRun] = useState<number | null>(null);
  const [tick, setTick] = useState(Date.now());

  useEffect(() => { const i = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(i); }, []);

  // Aufruf von außen über die Adresse
  useEffect(() => {
    if (!ready) return;
    const check = () => {
      const m = location.hash.match(/jetzt\?vorlage=([^&]+)/);
      if (!m) return;
      const today = todayISO();
      const full = materialize(w, [today]);
      if (full !== w) setW(full);
      const t = full.tasks.find((x) => x.tpl === decodeURIComponent(m[1]) && x.date === today);
      if (t) setId(t.id);
      history.replaceState(null, "", location.pathname + location.search + "#");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, [ready, raw]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zur Startzeit von selbst erscheinen (solange die App geöffnet ist)
  useEffect(() => {
    if (!ready || id) return;
    const d = new Date(tick), today = todayISO(), m = d.getHours() * 60 + d.getMinutes();
    const due = w.tasks.find((t) => t.date === today && t.start && !t.done && !w.seen.includes(t.id) && m >= toMin(t.start) && m < toMin(t.start) + Math.min(t.dur, 10));
    if (due) setId(due.id);
  }, [tick, ready, id, w]);

  const t = id ? w.tasks.find((x) => x.id === id) : null;
  if (!t) return null;
  const c = catOf(w, t.cat);
  const close = (patch?: Partial<(typeof w.tasks)[number]>) => {
    setW((p0) => { const p = { ...DEFAULT, ...p0 }; return { ...p, seen: [...p.seen.slice(-200), t.id], tasks: patch ? p.tasks.map((x) => (x.id === t.id ? { ...x, ...patch } : x)) : p.tasks }; });
    setId(null); setRun(null);
  };
  const left = run ? Math.max(0, t.dur * 60 - (tick - run) / 1000) : t.dur * 60;
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(Math.floor(left % 60)).padStart(2, "0");

  return (
    <div className="jz" style={{ "--c": c.color } as React.CSSProperties} role="dialog" aria-modal="true">
      <small>Jetzt ist</small>
      <h1>{t.title}</h1>
      <div className="jz-time">{t.start} · {t.dur} Min. · {t.points} Ehre</div>
      <div className="jz-clock">{left === 0 ? "Vollbracht" : `${mm}:${ss}`}</div>
      {!run && <button className="au-btn primary" onClick={() => setRun(Date.now())}>Beginnen</button>}
      <button className="au-btn primary" onClick={() => close({ done: true, doneAt: Date.now() })}>Vollbracht</button>
      <button className="au-btn" onClick={() => {
        const at = freeSlot({ ...w, tasks: w.tasks.filter((x) => x.id !== t.id) }, t.date ?? todayISO(), t.dur, toMin(t.start ?? "08:00") + 15);
        close(at ? { start: at } : { date: addDays(t.date ?? todayISO(), 1) });
      }}>Später</button>
      <button className="jz-x" onClick={() => close()}>Schließen</button>
      <span className="jz-hint">{toHHMM(toMin(t.start ?? "00:00") + t.dur)} Uhr endet der Block</span>
    </div>
  );
}
