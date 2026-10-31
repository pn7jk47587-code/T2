import { useMemo, useState } from "react";
import { Shell } from "../components/Shell";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { todayISO } from "../core/overview";
import { FEELINGS, FEELING_COLORS, colorById, feelingById, type FeelingColor, type FeelingLog } from "../core/feelings";
import { getShield } from "../core/shields";

function Mark({ color }: { color: FeelingColor }) {
  const c = colorById(color);
  const gid = "fg-" + color;
  return (
    <svg viewBox="0 0 100 120" className="gf-mark" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.glow} /><stop offset="1" stopColor={c.hex} />
        </linearGradient>
      </defs>
      <path d={getShield("giebel").d} fill={`url(#${gid})`} />
    </svg>
  );
}

export function Gefuehle({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [log, setLog] = useStored<FeelingLog>("gefuehle", {});
  const [color, setColor] = useState<FeelingColor>("gelb");
  const [q, setQ] = useState("");
  const today = todayISO();
  const chosen = log[today] ?? [];

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? FEELINGS.filter((f) => f.name.toLowerCase().includes(s) || f.desc.toLowerCase().includes(s)) : FEELINGS.filter((f) => f.color === color);
  }, [q, color]);

  const toggle = (id: string) => setLog((p) => {
    const cur = p[today] ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    const out = { ...p, [today]: next };
    if (!next.length) delete out[today];
    return out;
  });

  return (
    <Shell mod={mod} back={back} emblem={false}>
      {chosen.length > 0 && (
        <div className="gf-today">
          {chosen.map((id) => {
            const f = feelingById(id); if (!f) return null;
            return (
              <button key={id} className="gf-chip" style={{ "--fc": colorById(f.color).hex } as React.CSSProperties} onClick={() => toggle(id)} aria-label={`${f.name} entfernen`}>
                {f.name}<span aria-hidden="true">×</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="gf-search">
        <input className="sheet-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gefühle suchen" />
        {q && <button className="gf-clear" onClick={() => setQ("")} aria-label="Suche leeren">×</button>}
      </div>

      {!q && (
        <div className="gf-colors" role="tablist">
          {FEELING_COLORS.map((c) => (
            <button key={c.id} role="tab" aria-selected={color === c.id} className={"gf-color" + (color === c.id ? " on" : "")}
              style={{ "--fc": c.hex, "--fg": c.glow } as React.CSSProperties} onClick={() => setColor(c.id)}>{c.name}</button>
          ))}
        </div>
      )}

      <div className="gf-list">
        {list.map((f) => {
          const on = chosen.includes(f.id);
          return (
            <button key={f.id} className={"gf-row" + (on ? " on" : "")} style={{ "--fc": colorById(f.color).hex, "--fg": colorById(f.color).glow } as React.CSSProperties}
              onClick={() => toggle(f.id)} aria-pressed={on}>
              <Mark color={f.color} />
              <span className="gf-name">{f.name}</span>
              <span className="gf-desc">{f.desc}</span>
            </button>
          );
        })}
        {list.length === 0 && <div className="empty">Nichts gefunden</div>}
      </div>
    </Shell>
  );
}
