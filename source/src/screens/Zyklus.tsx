import { useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { FloImport } from "../components/FloImport";
import type { CycleDay, CycleLog } from "../core/types";
import { iso, todayISO } from "../core/overview";

const LEVELS = ["leicht", "mittel", "stark", "sehr stark"] as const;
const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function Many({ name, n, cls }: { name: string; n: number; cls: string }) {
  return (
    <span className={"zy-many " + cls}>
      {Array.from({ length: n }, (_, i) => <Icon key={i} name={name} />)}
    </span>
  );
}

export function Zyklus({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [log, setLog] = useStored<CycleLog>("zyklus", {});
  const today = todayISO();
  const [day, setDay] = useState(today);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  const entry: CycleDay = log[day] ?? {};
  function update(patch: Partial<CycleDay>) {
    setLog((prev) => {
      const next = { ...(prev[day] ?? {}), ...patch };
      (Object.keys(next) as (keyof CycleDay)[]).forEach((k) => next[k] === undefined && delete next[k]);
      const out = { ...prev };
      if (Object.keys(next).length) out[day] = next; else delete out[day];
      return out;
    });
  }

  // Monatsraster, Woche beginnt am Montag
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
            const e = log[c];
            return (
              <button key={c} className={"zy-day" + (c === day ? " sel" : "") + (c === today ? " today" : "") + (c > today ? " future" : "")}
                style={e?.flow ? { "--f": String(0.25 + e.flow * 0.19) } as React.CSSProperties : undefined}
                data-flow={e?.flow ? "1" : undefined} onClick={() => setDay(c)} disabled={c > today}>
                <span>{Number(c.slice(8))}</span>
                <span className="zy-marks">
                  {e?.spotting && <i className={"zy-dot " + e.spotting} />}
                  {e?.pain && <Icon name="schwert" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="section eyebrow">{dayLabel}</div>

      <div className="card zy-block">
        <div className="zy-label">Periode</div>
        <div className="zy-opts">
          {LEVELS.map((l, i) => {
            const v = (i + 1) as 1 | 2 | 3 | 4;
            return (
              <button key={l} className={"zy-opt" + (entry.flow === v ? " on" : "")} onClick={() => update({ flow: entry.flow === v ? undefined : v, spotting: undefined })}>
                <Many name="tropfen" n={v} cls="blut" />
                <small>{l}</small>
              </button>
            );
          })}
        </div>

        <div className="zy-label">Schmierblutung</div>
        <div className="zy-opts two">
          {(["rot", "braun"] as const).map((c) => (
            <button key={c} className={"zy-opt" + (entry.spotting === c ? " on" : "")} onClick={() => update({ spotting: entry.spotting === c ? undefined : c, flow: undefined })}>
              <Many name="tropfen" n={1} cls={"klein " + c} />
              <small>{c}</small>
            </button>
          ))}
        </div>

        <div className="zy-label">Schmerzen</div>
        <div className="zy-opts">
          {LEVELS.map((l, i) => {
            const v = (i + 1) as 1 | 2 | 3 | 4;
            return (
              <button key={l} className={"zy-opt" + (entry.pain === v ? " on" : "")} onClick={() => update({ pain: entry.pain === v ? undefined : v })}>
                <Many name="schwert" n={v} cls="schwerter" />
                <small>{l}</small>
              </button>
            );
          })}
        </div>
      </div>
      <FloImport log={log} setLog={setLog} />
    </Shell>
  );
}
