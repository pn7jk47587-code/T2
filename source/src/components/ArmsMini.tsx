import { useState } from "react";
import { CHARGES, CoatOfArms, DIVISIONS, METALS, TINCTURES } from "../core/heraldry";
import { SHIELDS } from "../core/shields";
import type { Arms } from "../core/types";

const TABS = ["Form", "Teilung", "Symbol", "Farben"] as const;

/** Kompakter Wappengestalter: kleine Vorschau, vier Reiter, Auswahl in einer Zeile */
export function ArmsMini({ arms, onChange }: { arms: Arms; onChange: (a: Arms) => void }) {
  const [tab, setTab] = useState(0);
  const set = (p: Partial<Arms>) => onChange({ ...arms, ...p });
  const three = DIVISIONS.find((d) => d.id === arms.division)?.colors === 3;
  const Sw = ({ label, value, pick, metals }: { label: string; value: string; pick: (v: string) => void; metals?: boolean }) => (
    <div className="am-sw-row">
      <small>{label}</small>
      <div className="am-sws">
        {metals && METALS.map((m) => (
          <button key={m.id} type="button" className={"am-sw" + (value === m.id ? " on" : "")} aria-label={m.name} title={m.name} onClick={() => pick(m.id)}
            style={{ background: `linear-gradient(135deg, ${m.dark}, ${m.hi} 48%, ${m.dark} 52%, ${m.base})` }} />
        ))}
        {TINCTURES.map((t) => (
          <button key={t.id} type="button" className={"am-sw" + (value === t.id ? " on" : "")} aria-label={t.name} title={t.name} onClick={() => pick(t.id)} style={{ background: t.hex }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="am">
      <div className="am-top">
        <CoatOfArms arms={arms} className="am-preview" />
        <div className="am-tabs">
          {TABS.map((t, i) => <button key={t} type="button" className={"am-tab" + (i === tab ? " on" : "")} onClick={() => setTab(i)}>{t}</button>)}
        </div>
      </div>
      {tab < 3 && (
        <div className="am-row">
          {tab === 0 && SHIELDS.map((s) => (
            <button key={s.id} type="button" className={"am-opt" + (arms.shape === s.id ? " on" : "")} onClick={() => set({ shape: s.id })} aria-label={s.name}>
              <CoatOfArms arms={{ ...arms, shape: s.id, division: "einfarbig", charge: "keins" }} />
            </button>
          ))}
          {tab === 1 && DIVISIONS.map((d) => (
            <button key={d.id} type="button" className={"am-opt" + (arms.division === d.id ? " on" : "")} onClick={() => set({ division: d.id })} aria-label={d.name}>
              <CoatOfArms arms={{ ...arms, division: d.id, charge: "keins" }} />
            </button>
          ))}
          {tab === 2 && CHARGES.map((c) => (
            <button key={c.id} type="button" className={"am-opt" + (arms.charge === c.id ? " on" : "")} onClick={() => set({ charge: c.id })} aria-label={c.name}>
              <CoatOfArms arms={{ ...arms, charge: c.id }} />
            </button>
          ))}
        </div>
      )}
      {tab === 3 && (
        <div className="am-colors">
          <Sw label="Feld" value={arms.c1} pick={(c1) => set({ c1 })} />
          <Sw label="Teilung" value={arms.c2} pick={(c2) => set({ c2 })} />
          {three && <Sw label="Drittes Feld" value={arms.c3 ?? "schwarz"} pick={(c3) => set({ c3 })} />}
          {arms.charge !== "keins" && <Sw label="Symbol" value={arms.cc} pick={(cc) => set({ cc })} metals />}
          <Sw label="Rand" value={arms.bc ?? "silber"} pick={(bc) => set({ bc })} />
        </div>
      )}
    </div>
  );
}
