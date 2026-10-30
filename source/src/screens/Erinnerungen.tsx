import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import type { Arms, Reminder } from "../core/types";
import { todayISO } from "../core/overview";
import { CoatOfArms, DEFAULT_ARMS } from "../core/heraldry";
import { getShield } from "../core/shields";

const NEW = "__neu__";
type View = { kind: "smart"; id: "heute" | "geplant" | "alle" | "erledigt" } | { kind: "list"; name: string } | null;
const SMART = [
  { id: "heute", name: "Heute" },
  { id: "geplant", name: "Geplant" },
  { id: "alle", name: "Alle" },
  { id: "erledigt", name: "Erledigt" },
] as const;

function fmtDate(r: Reminder) {
  if (!r.date) return "";
  const d = new Date(r.date + "T12:00:00");
  const label = r.date === todayISO() ? "Heute" : d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  return r.time ? `${label}, ${r.time}` : label;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const two = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}T${two(d.getHours())}${two(d.getMinutes())}00`;

/** Kalendereintrag als .ics. iOS bietet beim Öffnen „Zum Kalender hinzufügen“ an. */
function exportIcs(r: Reminder) {
  if (!r.date) return;
  let when: string[];
  if (r.time) {
    const start = new Date(`${r.date}T${r.time}:00`);
    when = [`DTSTART:${local(start)}`, `DTEND:${local(new Date(start.getTime() + 30 * 60000))}`];
  } else {
    const next = new Date(r.date + "T12:00:00"); next.setDate(next.getDate() + 1);
    when = [`DTSTART;VALUE=DATE:${r.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${next.getFullYear()}${two(next.getMonth() + 1)}${two(next.getDate())}`];
  }
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//App//Erinnerungen//DE", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${r.id}@app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, ...when,
    `SUMMARY:${esc(r.title)}`,
    r.notes ? `DESCRIPTION:${esc(r.notes)}` : "",
    r.url ? `URL:${r.url}` : "",
    r.category ? `CATEGORIES:${esc(r.category)}` : "",
    r.urgent ? "PRIORITY:1" : "",
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(r.title)}`, "TRIGGER:-PT0M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${r.title.slice(0, 40).replace(/[^\wäöüÄÖÜß -]/g, "") || "erinnerung"}.ics`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={"tg" + (on ? " on" : "")} onClick={() => onChange(!on)} role="switch" aria-checked={on}><i /></button>;
}

/** Abhak-Schild: leer ein Umriss, abgehakt das eigene Wappen */
function ShieldCheck({ done, arms, onClick }: { done: boolean; arms: Arms; onClick: () => void }) {
  return (
    <button className={"sc" + (done ? " on" : "")} onClick={onClick} aria-label={done ? "Wieder öffnen" : "Abhaken"}>
      {done ? <CoatOfArms arms={arms} /> : (
        <svg viewBox="0 0 100 120" aria-hidden="true"><path d={getShield(arms.shape).d} fill="none" stroke="currentColor" strokeWidth="7" /></svg>
      )}
    </button>
  );
}

export function Erinnerungen({ back }: { mod: ModuleDef; back: () => void }) {
  const [items, setItems] = useStored<Reminder[]>("erinnerungen", []);
  const [lists, setLists] = useStored<string[]>("erinnerungKategorien", []);
  const [arms] = useStored<Arms>("wappen", DEFAULT_ARMS);
  const [view, setView] = useState<View>(null);
  const [draft, setDraft] = useState<Reminder | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [newList, setNewList] = useState("");
  const [showDone, setShowDone] = useState(false);
  const today = todayISO();

  const allLists = useMemo(() => Array.from(new Set([...lists, ...items.map((i) => i.category).filter(Boolean)])), [lists, items]);

  const inSmart = (id: string, r: Reminder) =>
    id === "heute" ? !r.done && !!r.date && r.date <= today
    : id === "geplant" ? !r.done && !!r.date
    : id === "alle" ? !r.done
    : r.done;

  const sortOpen = (a: Reminder, b: Reminder) => ((a.date ?? "9999") + (a.time ?? "") < (b.date ?? "9999") + (b.time ?? "") ? -1 : 1);

  function openNew() {
    const cat = view?.kind === "list" ? view.name : "";
    setDraft({ id: crypto.randomUUID(), title: "", category: cat, done: false, createdAt: Date.now(), date: view?.kind === "smart" && view.id === "heute" ? today : undefined });
    setIsNew(true); setNewList("");
  }
  function save() {
    if (!draft || !draft.title.trim()) return;
    let cat = draft.category;
    if (cat === NEW) { cat = newList.trim(); if (cat && !lists.includes(cat)) setLists((p) => [...p, cat]); }
    const clean: Reminder = { ...draft, title: draft.title.trim(), category: cat, notes: draft.notes?.trim() || undefined, url: draft.url?.trim() || undefined, time: draft.date ? draft.time : undefined };
    setItems((p) => (isNew ? [clean, ...p] : p.map((r) => (r.id === clean.id ? clean : r))));
    setDraft(null);
  }
  const toggle = (id: string) => setItems((p) => p.map((r) => (r.id === id ? { ...r, done: !r.done, doneAt: r.done ? undefined : Date.now() } : r)));
  const remove = (id: string) => { setItems((p) => p.filter((r) => r.id !== id)); setDraft(null); };
  const d = draft;
  const upd = (p: Partial<Reminder>) => setDraft((x) => (x ? { ...x, ...p } : x));

  const Row = ({ r }: { r: Reminder }) => {
    const late = !r.done && r.date && r.date < today;
    return (
      <div className={"er-row" + (r.done ? " done" : "")}>
        <ShieldCheck done={r.done} arms={arms} onClick={() => toggle(r.id)} />
        <button className="er-text" onClick={() => { setDraft({ ...r }); setIsNew(false); setNewList(""); }}>
          <div className="t">{r.urgent && <span className="er-urgent">!</span>}{r.title}</div>
          {r.notes && <div className="er-notes">{r.notes}</div>}
          {(r.date || (view?.kind === "smart" && r.category)) && (
            <div className="s">
              {r.date && <span className={late ? "er-late" : ""}>{fmtDate(r)}</span>}
              {view?.kind === "smart" && r.category && <span>{r.category}</span>}
            </div>
          )}
        </button>
        {r.date && !r.done && <button className="icon-btn" onClick={() => exportIcs(r)} aria-label="Zum Kalender hinzufügen"><Icon name="kalender" /></button>}
      </div>
    );
  };

  /* ---------- Übersicht der Listen ---------- */
  const overview = (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Erinnerungen</h1>
      </div>
      <div className="er-smart">
        {SMART.map((s) => (
          <button key={s.id} className="card er-smart-card" onClick={() => setView({ kind: "smart", id: s.id })}>
            <span className="er-smart-icon"><Icon name={s.id === "erledigt" ? "haken" : s.id === "alle" ? "archiv" : "kalender"} /></span>
            <span className="er-smart-count">{items.filter((r) => inSmart(s.id, r)).length}</span>
            <span className="er-smart-name">{s.name}</span>
          </button>
        ))}
      </div>
      {allLists.length > 0 && (
        <>
          <div className="section eyebrow">Meine Listen</div>
          <div className="er-group">
            {allLists.map((l) => (
              <button key={l} className="er-list-row" onClick={() => setView({ kind: "list", name: l })}>
                <span className="er-list-icon"><CoatOfArms arms={{ ...arms, charge: "keins" }} /></span>
                <span className="er-list-name">{l}</span>
                <span className="er-list-count">{items.filter((r) => r.category === l && !r.done).length}</span>
                <Icon name="rechts" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );

  /* ---------- Eine Liste ---------- */
  let listBody = null;
  if (view) {
    const title = view.kind === "smart" ? SMART.find((s) => s.id === view.id)!.name : view.name;
    const base = view.kind === "smart" ? items.filter((r) => inSmart(view.id, r)) : items.filter((r) => r.category === view.name);
    const open = base.filter((r) => !r.done).sort(sortOpen);
    const done = base.filter((r) => r.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
    const onlyDone = view.kind === "smart" && view.id === "erledigt";
    listBody = (
      <>
        <div className="topbar">
          <button className="back" onClick={() => setView(null)} aria-label="Zurück"><Icon name="back" /></button>
          <h1>{title}</h1>
        </div>
        <div className="er-group">
          {(onlyDone ? done : open).map((r) => <Row key={r.id} r={r} />)}
          {(onlyDone ? done : open).length === 0 && <div className="empty">Keine Erinnerungen</div>}
        </div>
        {onlyDone && done.length > 0 && (
          <button className="er-clear" onClick={() => setItems((p) => p.filter((r) => !base.includes(r)))}>Alle löschen</button>
        )}
        {!onlyDone && done.length > 0 && (
          <>
            <button className="section eyebrow er-done-toggle" onClick={() => setShowDone((v) => !v)}>Erledigt ({done.length}) {showDone ? "▾" : "▸"}</button>
            {showDone && <div className="er-group">{done.map((r) => <Row key={r.id} r={r} />)}</div>}
          </>
        )}
      </>
    );
  }

  return (
    <>
      {view ? listBody : overview}
      {!(view?.kind === "smart" && view.id === "erledigt") && (
        <button className="er-new" onClick={openNew}><span>+</span> Neue Erinnerung</button>
      )}

      {d && (
        <div className="sheet-bg" onClick={() => setDraft(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <button className="sheet-btn" onClick={() => setDraft(null)} aria-label="Abbrechen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
              <span>{isNew ? "Neue Erinnerung" : "Details"}</span>
              <button className={"sheet-btn ok" + (d.title.trim() ? "" : " off")} onClick={save} aria-label="Sichern"><Icon name="haken" /></button>
            </div>

            <div className="sheet-card">
              <input className="sheet-in big" value={d.title} onChange={(e) => upd({ title: e.target.value })} placeholder="Titel" autoFocus={isNew} />
              <textarea className="sheet-in" rows={2} value={d.notes ?? ""} onChange={(e) => upd({ notes: e.target.value })} placeholder="Notizen" />
              <hr />
              <input className="sheet-in" value={d.url ?? ""} onChange={(e) => upd({ url: e.target.value })} placeholder="URL" inputMode="url" />
            </div>

            <div className="sheet-label">Datum &amp; Uhrzeit</div>
            <div className="sheet-card rows">
              <div className="sheet-row">
                <span className="sheet-ic"><Icon name="kalender" /></span>
                <span className="sheet-name">Datum{d.date && <small>{fmtDate({ ...d, time: undefined })}</small>}</span>
                <Toggle on={!!d.date} onChange={(v) => upd({ date: v ? today : undefined, time: v ? d.time : undefined })} />
              </div>
              {d.date && <div className="sheet-sub"><input className="sheet-in" type="date" value={d.date} onChange={(e) => upd({ date: e.target.value || today })} /></div>}
              <div className="sheet-row">
                <span className="sheet-ic"><Icon name="erinnerungen" /></span>
                <span className="sheet-name">Uhrzeit{d.time && <small>{d.time}</small>}</span>
                <Toggle on={!!d.time} onChange={(v) => upd({ time: v ? (d.time ?? "09:00") : undefined, date: v ? (d.date ?? today) : d.date })} />
              </div>
              {d.time && <div className="sheet-sub"><input className="sheet-in" type="time" value={d.time} onChange={(e) => upd({ time: e.target.value })} /></div>}
              <div className="sheet-row">
                <span className="sheet-ic"><Icon name="schwert" /></span>
                <span className="sheet-name">Dringend</span>
                <Toggle on={!!d.urgent} onChange={(v) => upd({ urgent: v || undefined })} />
              </div>
            </div>

            <div className="sheet-label">Weitere Optionen</div>
            <div className="sheet-card rows">
              <label className="sheet-row">
                <span className="sheet-ic arms"><CoatOfArms arms={{ ...arms, charge: "keins" }} /></span>
                <span className="sheet-name">Liste</span>
                <select className="sheet-select" value={d.category} onChange={(e) => upd({ category: e.target.value })}>
                  <option value="">Keine</option>
                  {allLists.map((l) => <option key={l} value={l}>{l}</option>)}
                  <option value={NEW}>Neue Liste</option>
                </select>
                <Icon name="rechts" />
              </label>
              {d.category === NEW && <div className="sheet-sub"><input className="sheet-in" value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="Name der Liste" /></div>}
            </div>

            {!isNew && <button className="sheet-del" onClick={() => remove(d.id)}>Erinnerung löschen</button>}
          </div>
        </div>
      )}
    </>
  );
}
