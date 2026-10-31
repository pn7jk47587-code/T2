import { useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { iso, todayISO } from "../core/overview";

type State = "gesund" | "angeschlagen" | "krank";
interface HealthDay {
  state?: State;
  symptoms?: string[];
  kopf?: { level?: 1 | 2 | 3 | 4; dauer?: string };
  meds?: string[];
  note?: string;
}
type HealthLog = Record<string, HealthDay>;

const STATES: { id: State; name: string }[] = [{ id: "gesund", name: "Gesund" }, { id: "angeschlagen", name: "Angeschlagen" }, { id: "krank", name: "Krank" }];
const BASE_SYMPTOMS = ["Schleim im Hals", "Halsschmerzen", "Husten", "Schnupfen", "Fieber", "Muskelkater", "Übelkeit", "Erschöpfung"];
const LEVELS = ["leicht", "mittel", "stark", "sehr stark"] as const;
const DAUER = ["unter 1 Std.", "1–4 Std.", "halber Tag", "ganzer Tag"];
const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function Befinden({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [log, setLog] = useStored<HealthLog>("befinden", {});
  const [extra, setExtra] = useStored<string[]>("befindenBeschwerden", []);
  const [medList, setMedList] = useStored<string[]>("befindenMedikamente", []);
  const today = todayISO();
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [newSym, setNewSym] = useState("");
  const [newMed, setNewMed] = useState("");

  const e: HealthDay = log[day] ?? {};
  const update = (patch: Partial<HealthDay>) => setLog((p) => {
    const next: HealthDay = { ...(p[day] ?? {}), ...patch };
    (Object.keys(next) as (keyof HealthDay)[]).forEach((k) => {
      const v = next[k];
      if (v === undefined || (Array.isArray(v) && !v.length && k !== "meds") || (k === "kopf" && v && !Object.keys(v).length)) delete next[k];
    });
    const out = { ...p };
    if (Object.keys(next).length) out[day] = next; else delete out[day];
    return out;
  });
  const toggleIn = (arr: string[] | undefined, v: string) => (arr ?? []).includes(v) ? (arr ?? []).filter((x) => x !== v) : [...(arr ?? []), v];

  const symptoms = [...BASE_SYMPTOMS, ...extra.filter((x) => !BASE_SYMPTOMS.includes(x))];
  const kopfOn = !!e.kopf;
  const medOn = !!e.meds;

  const first = new Date(month);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const dayLabel = new Date(day + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <div className="card zy-cal">
        <div className="zy-head">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Voriger Monat"><Icon name="links" /></button>
          <span>{month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</span>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Nächster Monat"><Icon name="rechts" /></button>
        </div>
        <div className="zy-grid">
          {WD.map((w) => <div key={w} className="zy-wd">{w}</div>)}
          {cells.map((c, i) => {
            if (!c) return <div key={"e" + i} />;
            const x = log[c];
            const n = (x?.symptoms?.length ?? 0) + (x?.kopf ? 1 : 0);
            return (
              <button key={c} className={"zy-day bf-day" + (c === day ? " sel" : "") + (c === today ? " today" : "") + (c > today ? " future" : "")}
                data-state={x?.state} onClick={() => setDay(c)} disabled={c > today}>
                <span>{Number(c.slice(8))}</span>
                <span className="zy-marks">
                  {n > 0 && <i className="bf-dot" />}{n > 1 && <i className="bf-dot" />}{n > 2 && <i className="bf-dot" />}
                  {x?.meds && <i className="bf-dot med" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="section eyebrow">{dayLabel}</div>
      <div className="card zy-block">
        <div className="zy-label">Zustand</div>
        <div className="bf-states">
          {STATES.map((s) => (
            <button key={s.id} className={"bf-state " + s.id + (e.state === s.id ? " on" : "")} onClick={() => update({ state: e.state === s.id ? undefined : s.id })}>{s.name}</button>
          ))}
        </div>

        <div className="zy-label">Beschwerden</div>
        <div className="bf-chips">
          {symptoms.map((s) => (
            <button key={s} className={"bf-chip" + (e.symptoms?.includes(s) ? " on" : "")} onClick={() => update({ symptoms: toggleIn(e.symptoms, s) })}>{s}</button>
          ))}
          <button className={"bf-chip" + (kopfOn ? " on" : "")} onClick={() => update({ kopf: kopfOn ? undefined : { level: 2 } })}>Kopfschmerzen</button>
        </div>
        <form className="bf-add" onSubmit={(ev) => { ev.preventDefault(); const v = newSym.trim(); if (!v) return; if (!symptoms.includes(v)) setExtra((p) => [...p, v]); update({ symptoms: toggleIn((e.symptoms ?? []).filter((x) => x !== v), v) }); setNewSym(""); }}>
          <input className="sheet-in" value={newSym} onChange={(ev) => setNewSym(ev.target.value)} placeholder="Weitere Beschwerde" />
          {newSym.trim() && <button className="bf-add-btn" type="submit">Hinzufügen</button>}
        </form>

        {kopfOn && (
          <>
            <div className="zy-label">Kopfschmerzen · Stärke</div>
            <div className="zy-opts">
              {LEVELS.map((l, i) => {
                const v = (i + 1) as 1 | 2 | 3 | 4;
                return (
                  <button key={l} className={"zy-opt" + (e.kopf?.level === v ? " on" : "")} onClick={() => update({ kopf: { ...e.kopf, level: v } })}>
                    <span className="zy-many bf-blitze">{Array.from({ length: v }, (_, k) => <Icon key={k} name="blitz" />)}</span>
                    <small>{l}</small>
                  </button>
                );
              })}
            </div>
            <div className="zy-label">Kopfschmerzen · Dauer</div>
            <div className="bf-chips">
              {DAUER.map((d) => (
                <button key={d} className={"bf-chip" + (e.kopf?.dauer === d ? " on" : "")} onClick={() => update({ kopf: { ...e.kopf, dauer: e.kopf?.dauer === d ? undefined : d } })}>{d}</button>
              ))}
            </div>
          </>
        )}

        <div className="zy-label">Tablette genommen</div>
        <div className="bf-states two">
          <button className={"bf-state" + (!medOn ? " on" : "")} onClick={() => update({ meds: undefined })}>Nein</button>
          <button className={"bf-state" + (medOn ? " on" : "")} onClick={() => !medOn && setLog((p) => ({ ...p, [day]: { ...(p[day] ?? {}), meds: [] } }))}>Ja</button>
        </div>
        {medOn && (
          <>
            <div className="bf-chips" style={{ marginTop: 10 }}>
              {medList.map((m) => (
                <button key={m} className={"bf-chip" + (e.meds?.includes(m) ? " on" : "")} onClick={() => setLog((p) => ({ ...p, [day]: { ...(p[day] ?? {}), meds: toggleIn(p[day]?.meds, m) } }))}>{m}</button>
              ))}
            </div>
            <form className="bf-add" onSubmit={(ev) => { ev.preventDefault(); const v = newMed.trim(); if (!v) return; if (!medList.includes(v)) setMedList((p) => [...p, v]); setLog((p) => ({ ...p, [day]: { ...(p[day] ?? {}), meds: [...(p[day]?.meds ?? []).filter((x) => x !== v), v] } })); setNewMed(""); }}>
              <input className="sheet-in" value={newMed} onChange={(ev) => setNewMed(ev.target.value)} placeholder="Welche?" />
              {newMed.trim() && <button className="bf-add-btn" type="submit">Hinzufügen</button>}
            </form>
          </>
        )}

        <div className="zy-label">Notiz</div>
        <textarea className="sheet-in bf-note" rows={2} value={e.note ?? ""} onChange={(ev) => update({ note: ev.target.value || undefined })} />
      </div>
    </Shell>
  );
}
