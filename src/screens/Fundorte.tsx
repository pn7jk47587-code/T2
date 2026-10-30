import { useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import type { StoredItem } from "../core/types";

/** Erstes funktionierendes Modul. Dient als Vorlage für die übrigen. */
export function Fundorte({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [items, setItems] = useStored<StoredItem[]>("fundorte", []);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");

  function add() {
    if (!name.trim() || !place.trim()) return;
    setItems((prev) => [
      { id: crypto.randomUUID(), name: name.trim(), place: place.trim(), note: note.trim() || undefined, createdAt: Date.now() },
      ...prev,
    ]);
    setName("");
    setPlace("");
    setNote("");
  }

  const shown = items.filter((i) => (i.name + " " + i.place + " " + (i.note ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <div className="card" style={{ padding: 16 }}>
        <div className="field">
          <label>GEGENSTAND</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Reisepass" />
        </div>
        <div className="field">
          <label>ORT</label>
          <input className="input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="z. B. Schreibtisch, mittlere Schublade" />
        </div>
        <div className="field">
          <label>NOTIZ (OPTIONAL)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. im blauen Umschlag" />
        </div>
        <div className="actions">
          <button className="btn" onClick={add} disabled={!name.trim() || !place.trim()} style={{ opacity: name.trim() && place.trim() ? 1 : 0.5 }}>
            Speichern
          </button>
        </div>
      </div>

      <div className="section eyebrow">Gespeichert ({items.length})</div>
      {items.length > 0 && (
        <div className="field">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen" />
        </div>
      )}
      <div className="list">
        {shown.length === 0 && <div className="card empty">{items.length ? "Nichts gefunden." : "Noch nichts hinterlegt."}</div>}
        {shown.map((i) => (
          <div className="card row" key={i.id}>
            <div>
              <div className="t">{i.name}</div>
              <div className="s">{i.place}{i.note ? " · " + i.note : ""}</div>
            </div>
            <button className="icon-btn" aria-label="Löschen" onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}>
              <Icon name="trash" />
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}
