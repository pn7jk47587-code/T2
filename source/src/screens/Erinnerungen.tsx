import { useMemo, useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import type { Reminder } from "../core/types";
import { todayISO } from "../core/overview";

const NEW = "__neu__";

function fmtDate(r: Reminder) {
  if (!r.date) return "";
  const d = new Date(r.date + "T12:00:00");
  const t = todayISO();
  const label = r.date === t ? "heute" : d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  return r.time ? `${label}, ${r.time}` : label;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Kalendereintrag als .ics. iOS öffnet die Datei mit „Zum Kalender hinzufügen“. */
function exportIcs(r: Reminder) {
  if (!r.date) return;
  const day = r.date.replace(/-/g, "");
  let when: string[];
  if (r.time) {
    const start = new Date(`${r.date}T${r.time}:00`);
    const end = new Date(start.getTime() + 30 * 60000);
    const local = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
    when = [`DTSTART:${local(start)}`, `DTEND:${local(end)}`];
  } else {
    const next = new Date(r.date + "T12:00:00"); next.setDate(next.getDate() + 1);
    const nd = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
    when = [`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${nd}`];
  }
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//App//Erinnerungen//DE", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${r.id}@app`, `DTSTAMP:${stamp(new Date())}`, ...when,
    `SUMMARY:${esc(r.title)}`, r.category ? `CATEGORIES:${esc(r.category)}` : "",
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(r.title)}`, "TRIGGER:-PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${r.title.slice(0, 40).replace(/[^\wäöüÄÖÜß -]/g, "") || "erinnerung"}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function Erinnerungen({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [items, setItems] = useStored<Reminder[]>("erinnerungen", []);
  const [cats, setCats] = useStored<string[]>("erinnerungKategorien", []);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [newCat, setNewCat] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [filter, setFilter] = useState<string>("");
  const [showDone, setShowDone] = useState(false);

  const allCats = useMemo(() => Array.from(new Set([...cats, ...items.map((i) => i.category).filter(Boolean)])), [cats, items]);
  const today = todayISO();

  function add() {
    const t = title.trim();
    if (!t) return;
    let c = cat === NEW ? newCat.trim() : cat;
    if (cat === NEW && c && !cats.includes(c)) setCats((p) => [...p, c]);
    if (cat === NEW && !c) c = "";
    setItems((p) => [{ id: crypto.randomUUID(), title: t, category: c, date: date || undefined, time: date && time ? time : undefined, done: false, createdAt: Date.now() }, ...p]);
    setTitle(""); setTime(""); setDate(""); setNewCat(""); if (cat === NEW) setCat(c);
  }
  const toggle = (id: string) => setItems((p) => p.map((r) => (r.id === id ? { ...r, done: !r.done, doneAt: r.done ? undefined : Date.now() } : r)));
  const remove = (id: string) => setItems((p) => p.filter((r) => r.id !== id));

  const visible = items.filter((r) => !filter || r.category === filter);
  const open = visible.filter((r) => !r.done).sort((a, b) => (a.date ?? "9999") + (a.time ?? "") < (b.date ?? "9999") + (b.time ?? "") ? -1 : 1);
  const done = visible.filter((r) => r.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));

  const Row = ({ r }: { r: Reminder }) => {
    const late = !r.done && r.date && r.date < today;
    return (
      <div className={"card er-row" + (r.done ? " done" : "")}>
        <button className={"er-check" + (r.done ? " on" : "")} onClick={() => toggle(r.id)} aria-label={r.done ? "Wieder öffnen" : "Abhaken"}>
          {r.done && <Icon name="haken" />}
        </button>
        <div className="er-text">
          <div className="t">{r.title}</div>
          <div className="s">
            {r.category && <span className="er-cat">{r.category}</span>}
            {r.date && <span className={late ? "er-late" : ""}>{fmtDate(r)}</span>}
          </div>
        </div>
        {r.date && !r.done && (
          <button className="icon-btn" onClick={() => exportIcs(r)} aria-label="Zum Kalender hinzufügen"><Icon name="kalender" /></button>
        )}
        {r.done && (
          <button className="icon-btn" onClick={() => remove(r.id)} aria-label="Löschen"><Icon name="trash" /></button>
        )}
      </div>
    );
  };

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <div className="card" style={{ padding: 14 }}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Erinnerung" />
        <div className="er-form">
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Ohne Kategorie</option>
            {allCats.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={NEW}>Neue Kategorie</option>
          </select>
          {cat === NEW && <input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Name der Kategorie" />}
          <div className="er-when">
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date} />
          </div>
        </div>
        <div className="actions" style={{ marginTop: 10 }}>
          <button className="btn small" onClick={add} disabled={!title.trim()} style={{ opacity: title.trim() ? 1 : 0.5 }}>Eintragen</button>
        </div>
      </div>

      {allCats.length > 0 && (
        <div className="chips" style={{ margin: "14px 0 2px" }}>
          <button className={"chip" + (!filter ? " ok" : "")} onClick={() => setFilter("")}>Alle</button>
          {allCats.map((c) => (
            <button key={c} className={"chip" + (filter === c ? " ok" : "")} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      )}

      <div className="list" style={{ marginTop: 12 }}>
        {open.map((r) => <Row key={r.id} r={r} />)}
        {open.length === 0 && <div className="empty">Keine offenen Erinnerungen</div>}
      </div>

      {done.length > 0 && (
        <>
          <button className="section eyebrow er-done-toggle" onClick={() => setShowDone((v) => !v)}>
            Erledigt ({done.length}) {showDone ? "▾" : "▸"}
          </button>
          {showDone && <div className="list">{done.map((r) => <Row key={r.id} r={r} />)}</div>}
        </>
      )}
    </Shell>
  );
}
