import { useState } from "react";
import { Shell } from "../components/Shell";
import { DayCardView, demoCard } from "../components/DayCardView";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import type { DayCard } from "../core/types";

export function Archiv({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [cards] = useStored<DayCard[]>("daycards", []);
  const [showDemo, setShowDemo] = useState(false);
  const sorted = [...cards].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <div className="actions" style={{ marginBottom: 14 }}>
        <button className="btn ghost small" onClick={() => setShowDemo((v) => !v)}>
          {showDemo ? "Beispielkarte ausblenden" : "Beispielkarte ansehen"}
        </button>
      </div>
      {showDemo && (
        <div style={{ marginBottom: 18 }}>
          <DayCardView card={demoCard} />
        </div>
      )}
      <div className="section eyebrow">Gespeicherte Tage ({sorted.length})</div>
      <div className="list">
        {sorted.length === 0 && (
          <div className="card empty">Noch leer.</div>
        )}
        {sorted.map((c) => (
          <DayCardView key={c.date} card={c} />
        ))}
      </div>
    </Shell>
  );
}
