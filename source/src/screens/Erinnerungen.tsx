import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { FoldHead } from "../components/Fold";
import { SortList } from "../components/SortList";
import { ArmsMini } from "../components/ArmsMini";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import type { Arms, Reminder } from "../core/types";
import { iso, todayISO } from "../core/overview";
import { CoatOfArms, DEFAULT_ARMS } from "../core/heraldry";
import { getShield } from "../core/shields";

const NEW = "__neu__";
type SmartId = "heute" | "geplant" | "fristen" | "alle" | "erledigt";
type View = { kind: "smart"; id: SmartId } | { kind: "list"; name: string } | { kind: "kalender" } | null;
const SMART = [
  { id: "heute", name: "Heute" },
  { id: "geplant", name: "Vorgemerkt" },
  { id: "fristen", name: "Fristen" },
  { id: "alle", name: "Alle" },
  { id: "erledigt", name: "Vollbracht" },
] as const;

function fmtDate(r: Reminder) {
  if (!r.date) return "";
  const d = new Date(r.date + "T12:00:00");
  const label = r.date === todayISO() ? "Heute" : d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
  return r.time ? `${label}, ${r.time}` : label;
}

const short = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" });
const addDays = (d: string, n: number) => { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return iso(x); };
const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
/** n-ter Wochentag eines Datums (5 = letzter) */
const nth = (d: string) => { const x = new Date(d + "T12:00:00"); const n = Math.ceil(x.getDate() / 7); return { n, wd: x.getDay() }; };
const repeatLabel = (kind: Reminder["repeat"], d: string) => {
  if (!kind) return "Nie";
  const x = new Date(d + "T12:00:00");
  if (kind === "monat-tag") return `Monatlich am ${x.getDate()}.`;
  const { n, wd } = nth(d);
  return `Monatlich am ${n >= 5 ? "letzten" : n + "."} ${WOCHENTAGE[wd]}`;
};
/** Nächster Termin einen Monat später */
function nextMonth(d: string, kind: NonNullable<Reminder["repeat"]>, anchorDay?: number) {
  const x = new Date(d + "T12:00:00");
  const y = x.getFullYear(), m = x.getMonth() + 1;
  const last = new Date(y, m + 1, 0).getDate();
  if (kind === "monat-tag") return iso(new Date(y, m, Math.min(anchorDay ?? x.getDate(), last), 12));
  const { n, wd } = nth(d);
  if (n >= 5) { const t = new Date(y, m, last, 12); while (t.getDay() !== wd) t.setDate(t.getDate() - 1); return iso(t); }
  const t = new Date(y, m, 1, 12); while (t.getDay() !== wd) t.setDate(t.getDate() + 1); t.setDate(t.getDate() + (n - 1) * 7); return iso(t);
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const two = (n: number) => String(n).padStart(2, "0");
const local = (d: Date) => `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}T${two(d.getHours())}${two(d.getMinutes())}00`;

/** Kalendereintrag als .ics. iOS bietet beim Öffnen „Zum Kalender hinzufügen“ an. */
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const allDay = (d: string) => { const n = new Date(d + "T12:00:00"); n.setDate(n.getDate() + 1); return [`DTSTART;VALUE=DATE:${d.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${n.getFullYear()}${two(n.getMonth() + 1)}${two(n.getDate())}`]; };
const fristEvent = (r: Reminder, kind: "Galgenfrist" | "Gnadenfrist", d: string) => [
  "BEGIN:VEVENT", `UID:${r.id}-${kind}@app`, `DTSTAMP:${stamp()}`, ...allDay(d), `SUMMARY:${esc(kind + ": " + r.title)}`,
  r.notes ? `DESCRIPTION:${esc(r.notes)}` : "", kind === "Galgenfrist" ? "PRIORITY:1" : "",
  "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(kind + ": " + r.title)}`, "TRIGGER:PT8H", "END:VALARM", "END:VEVENT",
];

function exportIcs(r: Reminder) {
  if (!r.date && !r.frist) return;
  let when: string[] = [];
  if (!r.date) { /* nur Frist */ }
  else
  if (r.time) {
    const start = new Date(`${r.date}T${r.time}:00`);
    when = [`DTSTART:${local(start)}`, `DTEND:${local(new Date(start.getTime() + 30 * 60000))}`];
  } else {
    const next = new Date(r.date + "T12:00:00"); next.setDate(next.getDate() + 1);
    when = [`DTSTART;VALUE=DATE:${r.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${next.getFullYear()}${two(next.getMonth() + 1)}${two(next.getDate())}`];
  }
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//App//Erinnerungen//DE", "CALSCALE:GREGORIAN",
    ...(r.frist ? fristEvent(r, "Galgenfrist", r.frist) : []),
    ...(r.vorfrist ? fristEvent(r, "Gnadenfrist", r.vorfrist) : []),
    ...(r.date ? ["BEGIN:VEVENT", `UID:${r.id}@app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, ...when,
    `SUMMARY:${esc(r.title)}`,
    r.repeat === "monat-tag" ? `RRULE:FREQ=MONTHLY;BYMONTHDAY=${r.repeatDay ?? Number(r.date.slice(8))}` : "",
    r.repeat === "monat-wochentag" ? `RRULE:FREQ=MONTHLY;BYDAY=${nth(r.date).n >= 5 ? -1 : nth(r.date).n}${["SU", "MO", "TU", "WE", "TH", "FR", "SA"][nth(r.date).wd]}` : "",
    r.notes ? `DESCRIPTION:${esc(r.notes)}` : "",
    r.url ? `URL:${r.url}` : "",
    r.category ? `CATEGORIES:${esc(r.category)}` : "",
    r.urgent ? "PRIORITY:1" : "",
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(r.title)}`, "TRIGGER:-PT0M", "END:VALARM",
    "END:VEVENT"] : []), "END:VCALENDAR",
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
  const [listsOpen, setListsOpen] = useStored<boolean>("erinnerungListenOffen", true);
  const [listArms, setListArms] = useStored<Record<string, Arms>>("erinnerungListenWappen", {});
  const baseArms: Arms = { ...DEFAULT_ARMS, ...arms, charge: "keins" };
  const armsOf = (l: string): Arms => listArms[l] ?? baseArms;
  const [newArms, setNewArms] = useState<Arms | null>(null);
  /** Listen-Sheet: neue Liste anlegen oder Wappen einer Liste ändern */
  const [listSheet, setListSheet] = useState<{ name: string; orig?: string; arms: Arms } | null>(null);
  function saveListSheet() {
    if (!listSheet) return;
    const name = listSheet.name.trim(); if (!name) return;
    if (listSheet.orig && listSheet.orig !== name) {
      setLists((p) => p.map((x) => (x === listSheet.orig ? name : x)));
      setItems((p) => p.map((r) => (r.category === listSheet.orig ? { ...r, category: name } : r)));
      setListArms((p) => { const o = { ...p }; delete o[listSheet.orig!]; o[name] = listSheet.arms; return o; });
      if (view?.kind === "list") setView({ kind: "list", name });
    } else {
      if (!lists.includes(name)) setLists((p) => [...p, name]);
      setListArms((p) => ({ ...p, [name]: listSheet.arms }));
    }
    setListSheet(null);
  }
  const today = todayISO();

  const allLists = useMemo(() => Array.from(new Set([...lists, ...items.map((i) => i.category).filter(Boolean)])), [lists, items]);

  const inSmart = (id: string, r: Reminder) =>
    id === "heute" ? !r.done && ((!!r.date && r.date <= today) || (!!r.vorfrist && r.vorfrist <= today) || (!!r.frist && r.frist <= today))
    : id === "geplant" ? !r.done && (!!r.date || !!r.frist)
    : id === "fristen" ? !r.done && !!r.frist
    : id === "alle" ? !r.done
    : r.done;

  const key = (r: Reminder) => [r.date, r.vorfrist, r.frist].filter(Boolean).sort()[0] ?? "9999";
  const sortOpen = (a: Reminder, b: Reminder) => (view?.kind === "smart" && view.id === "fristen"
    ? ((a.frist ?? "") < (b.frist ?? "") ? -1 : 1)
    : key(a) + (a.time ?? "") < key(b) + (b.time ?? "") ? -1 : 1);
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [calDay, setCalDay] = useState(today);

  function openNew() {
    const cat = view?.kind === "list" ? view.name : "";
    const fr = view?.kind === "smart" && view.id === "fristen";
    setDraft({ id: crypto.randomUUID(), title: "", category: cat, done: false, createdAt: Date.now(),
      date: view?.kind === "smart" && view.id === "heute" ? today : view?.kind === "kalender" ? calDay : undefined,
      frist: fr ? addDays(today, 14) : undefined, vorfrist: fr ? addDays(today, 7) : undefined });
    setIsNew(true); setNewList(""); setNewArms(null);
  }
  function save() {
    if (!draft || !draft.title.trim()) return;
    let cat = draft.category;
    if (cat === NEW) {
      cat = newList.trim();
      if (cat && !lists.includes(cat)) setLists((p) => [...p, cat]);
      if (cat && newArms) setListArms((p) => ({ ...p, [cat]: newArms }));
    }
    // Kommas trennen Unterpunkte; „Titel: a, b, c“ nimmt den Teil vor dem Doppelpunkt als Titel
    const input = draft.title.trim();
    let title = input, subs: Reminder["subs"];
    if (input.includes(",")) {
      const colon = input.indexOf(":");
      const head = colon > 0 ? input.slice(0, colon).trim() : "";
      const parts = (colon > 0 ? input.slice(colon + 1) : input).split(",").map((x) => x.trim()).filter(Boolean);
      if (parts.length > 1) {
        title = head || input;
        subs = parts.map((t) => draft.subs?.find((o) => o.title === t) ?? { id: crypto.randomUUID(), title: t, done: false });
      }
    }
    const clean: Reminder = { ...draft, title, subs, raw: subs ? input : undefined, category: cat, notes: draft.notes?.trim() || undefined, url: draft.url?.trim() || undefined, time: draft.date ? draft.time : undefined, repeat: draft.date ? draft.repeat : undefined, vorfrist: draft.frist ? draft.vorfrist : undefined };
    setItems((p) => (isNew ? [clean, ...p] : p.map((r) => (r.id === clean.id ? clean : r))));
    setDraft(null);
  }
  /** Wiederkehrende Erinnerung: beim Abhaken entsteht der Termin für den nächsten Monat */
  const successor = (r: Reminder): Reminder | null => {
    if (!r.repeat || !r.date) return null;
    const date = nextMonth(r.date, r.repeat, r.repeatDay);
    const shift = (v?: string) => (v ? iso(new Date(new Date(v + "T12:00:00").getTime() + (new Date(date + "T12:00:00").getTime() - new Date(r.date + "T12:00:00").getTime()))) : undefined);
    return { ...r, id: crypto.randomUUID(), date, frist: shift(r.frist), vorfrist: shift(r.vorfrist), done: false, doneAt: undefined, createdAt: Date.now(), subs: r.subs?.map((x) => ({ ...x, id: crypto.randomUUID(), done: false })) };
  };
  const finish = (list: Reminder[], r: Reminder, done: boolean): Reminder[] => {
    const upd = list.map((x) => (x.id === r.id ? { ...x, done, doneAt: done ? Date.now() : undefined, subs: x.subs?.map((s) => (done ? { ...s, done: true } : s)) } : x));
    if (done && !r.done) {
      const nx = successor(r);
      if (nx) return [nx, ...upd.map((x) => (x.id === r.id ? { ...x, repeat: undefined, nextId: nx.id } : x))];
    }
    if (!done && r.nextId) return upd.filter((x) => x.id !== r.nextId).map((x) => (x.id === r.id ? { ...x, repeat: list.find((y) => y.id === r.nextId)?.repeat ?? r.repeat, nextId: undefined } : x));
    return upd;
  };
  const toggle = (id: string) => setItems((p) => { const r = p.find((x) => x.id === id); return r ? finish(p, r, !r.done) : p; });
  /** Unterpunkt abhaken; sind alle erledigt, ist der Eintrag erledigt */
  const toggleSub = (id: string, sid: string) => setItems((p) => {
    const mapped = p.map((r) => (r.id === id && r.subs ? { ...r, subs: r.subs.map((x) => (x.id === sid ? { ...x, done: !x.done } : x)) } : r));
    const r = mapped.find((x) => x.id === id);
    if (!r?.subs) return mapped;
    const all = r.subs.every((x) => x.done);
    return all !== r.done ? finish(mapped, r, all) : mapped;
  });
  const remove = (id: string) => { setItems((p) => p.filter((r) => r.id !== id)); setDraft(null); };
  const d = draft;
  const upd = (p: Partial<Reminder>) => setDraft((x) => (x ? { ...x, ...p } : x));

  const Row = ({ r }: { r: Reminder }) => {
    const late = !r.done && r.date && r.date < today;
    return (
      <div className={"er-row" + (r.done ? " done" : "")}>
        <ShieldCheck done={r.done} arms={arms} onClick={() => toggle(r.id)} />
        <div className="er-main">
        <button className="er-text" onClick={() => { setDraft({ ...r, title: r.raw ?? r.title }); setIsNew(false); setNewList(""); }}>
          <div className="t">{r.urgent && <span className="er-urgent">!</span>}{r.title}</div>
          {r.notes && <div className="er-notes">{r.notes}</div>}
          {(r.date || r.frist || (view?.kind === "smart" && r.category)) && (
            <div className="s">
              {r.date && <span className={late ? "er-late" : ""}>{fmtDate(r)}</span>}
              {r.repeat && r.date && <span className="er-repeat">{repeatLabel(r.repeat, r.date).replace("Monatlich am", "monatl.")}</span>}
              {r.vorfrist && <span className={"er-vf" + (!r.done && r.vorfrist <= today ? " due" : "")}>Gnade {short(r.vorfrist)}</span>}
              {r.frist && <span className={"er-frist" + (!r.done && r.frist <= today ? " due" : "")}>Galgen {short(r.frist)}</span>}
              {view?.kind === "smart" && r.category && <span>{r.category}</span>}
              {r.subs && <span>{r.subs.filter((x) => x.done).length}/{r.subs.length}</span>}
            </div>
          )}
        </button>
        {r.subs && (
          <div className="er-subs">
            {r.subs.map((x) => (
              <div key={x.id} className={"er-sub" + (x.done ? " done" : "")}>
                <ShieldCheck done={x.done} arms={arms} onClick={() => toggleSub(r.id, x.id)} />
                <span>{x.title}</span>
              </div>
            ))}
          </div>
        )}
        </div>
        {(r.date || r.frist) && !r.done && <button className="icon-btn" onClick={() => exportIcs(r)} aria-label="In den Almanach eintragen"><Icon name="kalender" /></button>}
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
            <span className={"er-smart-icon" + (s.id === "fristen" ? " frist" : "")}><Icon name={s.id === "erledigt" ? "haken" : s.id === "alle" ? "archiv" : s.id === "fristen" ? "sanduhr" : "kalender"} /></span>
            <span className="er-smart-count">{items.filter((r) => inSmart(s.id, r)).length}</span>
            <span className="er-smart-name">{s.name}</span>
          </button>
        ))}
        <button className="card er-smart-card" onClick={() => setView({ kind: "kalender" })}>
          <span className="er-smart-icon"><Icon name="kalender" /></span>
          <span className="er-smart-count">{new Date().getDate()}</span>
          <span className="er-smart-name">Almanach</span>
        </button>
      </div>
      {allLists.length > 0 && (
        <>
          <FoldHead label="Meine Rollen" open={listsOpen} onToggle={() => setListsOpen(!listsOpen)} />
          {listsOpen && (
            <SortList className="er-group" items={allLists} keyOf={(l) => l} onReorder={setLists} onTap={(l) => setView({ kind: "list", name: l })}
              render={(l) => (
                <div className="er-list-row" role="button">
                  <span className="er-list-icon"><CoatOfArms arms={armsOf(l)} /></span>
                  <span className="er-list-name">{l}</span>
                  <span className="er-list-count">{items.filter((r) => r.category === l && !r.done).length}</span>
                  <Icon name="rechts" />
                </div>
              )} />
          )}
          {listsOpen && <button className="er-addlist" onClick={() => setListSheet({ name: "", arms: baseArms })}>+ Neue Rolle</button>}
        </>
      )}
    </>
  );

  /* ---------- Eine Liste ---------- */
  let listBody = null;
  if (view?.kind === "kalender") {
    const first = calMonth;
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(first.getFullYear(), first.getMonth(), i + 1)))];
    const shift = (n: number) => setCalMonth(new Date(first.getFullYear(), first.getMonth() + n, 1));
    const on = (c: string) => items.filter((r) => r.date === c || r.frist === c || r.vorfrist === c);
    const sel = on(calDay).sort((a, b) => (a.frist === calDay ? 0 : a.vorfrist === calDay ? 1 : 2) - (b.frist === calDay ? 0 : b.vorfrist === calDay ? 1 : 2));
    listBody = (
      <>
        <div className="topbar">
          <button className="back" onClick={() => setView(null)} aria-label="Zurück"><Icon name="back" /></button>
          <h1>Almanach</h1>
        </div>
        <div className="card zy-cal">
          <div className="zy-head">
            <button className="icon-btn" onClick={() => shift(-1)} aria-label="Voriger Monat"><Icon name="links" /></button>
            <span>{first.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</span>
            <button className="icon-btn" onClick={() => shift(1)} aria-label="Nächster Monat"><Icon name="rechts" /></button>
          </div>
          <div className="zy-grid">
            {WD.map((w) => <div key={w} className="zy-wd">{w}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={"e" + i} />;
              const list = on(c).filter((r) => !r.done);
              const fr = list.some((r) => r.frist === c);
              const vf = list.some((r) => r.vorfrist === c);
              const n = list.filter((r) => r.date === c).length;
              return (
                <button key={c} className={"zy-day er-cd" + (c === calDay ? " sel" : "") + (c === today ? " today" : "") + (fr ? " frist" : "") + (vf ? " vf" : "")} onClick={() => setCalDay(c)}>
                  <span>{Number(c.slice(8))}</span>
                  <span className="zy-marks">{n > 0 && <i className="er-dot" />}{n > 1 && <i className="er-dot" />}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="section eyebrow">{new Date(calDay + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</div>
        <div className="er-group">
          {sel.map((r) => (
            <div key={r.id} className={r.frist === calDay ? "er-cal-frist" : r.vorfrist === calDay ? "er-cal-vf" : ""}>
              {r.frist === calDay && <div className="er-cal-tag">Galgenfrist</div>}
              {r.vorfrist === calDay && r.frist !== calDay && <div className="er-cal-tag">Gnadenfrist</div>}
              <Row r={r} />
            </div>
          ))}
          {sel.length === 0 && <div className="empty">Keine Einträge</div>}
        </div>
      </>
    );
  } else if (view) {
    const title = view.kind === "smart" ? SMART.find((s) => s.id === view.id)!.name : view.name;
    const base = view.kind === "smart" ? items.filter((r) => inSmart(view.id, r)) : items.filter((r) => r.category === view.name);
    const open = base.filter((r) => !r.done).sort(sortOpen);
    const done = base.filter((r) => r.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
    const onlyDone = view.kind === "smart" && view.id === "erledigt";
    listBody = (
      <>
        <div className="topbar">
          <button className="back" onClick={() => setView(null)} aria-label="Zurück"><Icon name="back" /></button>
          {view.kind === "list" && (
            <button className="er-list-arms" onClick={() => setListSheet({ name: view.name, orig: view.name, arms: armsOf(view.name) })} aria-label="Liste bearbeiten">
              <CoatOfArms arms={armsOf(view.name)} />
            </button>
          )}
          <h1>{title}</h1>
        </div>
        <div className="er-group">
          {(onlyDone ? done : open).map((r) => <Row key={r.id} r={r} />)}
          {(onlyDone ? done : open).length === 0 && <div className="empty">Keine Erinnerungen</div>}
        </div>
        {onlyDone && done.length > 0 && (
          <button className="er-clear" onClick={() => setItems((p) => p.filter((r) => !base.includes(r)))}>Alle verbannen</button>
        )}
        {!onlyDone && done.length > 0 && (
          <>
            <FoldHead label={`Vollbracht (${done.length})`} open={showDone} onToggle={() => setShowDone((v) => !v)} />
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

      {listSheet && (
        <div className="sheet-bg" onClick={() => setListSheet(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <button className="sheet-btn" onClick={() => setListSheet(null)} aria-label="Abbrechen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
              <span>{listSheet.orig ? "Rolle" : "Neue Rolle"}</span>
              <button className={"sheet-btn ok" + (listSheet.name.trim() ? "" : " off")} onClick={saveListSheet} aria-label="Besiegeln"><Icon name="haken" /></button>
            </div>
            <div className="sheet-card">
              <input className="sheet-in big" value={listSheet.name} onChange={(e) => setListSheet({ ...listSheet, name: e.target.value })} placeholder="Name der Rolle" autoFocus={!listSheet.orig} />
              <hr />
              <ArmsMini arms={listSheet.arms} onChange={(a) => setListSheet({ ...listSheet, arms: a })} />
            </div>
          </div>
        </div>
      )}
      {d && (
        <div className="sheet-bg" onClick={() => setDraft(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <button className="sheet-btn" onClick={() => setDraft(null)} aria-label="Abbrechen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
              <span>{isNew ? "Neue Erinnerung" : "Details"}</span>
              <button className={"sheet-btn ok" + (d.title.trim() ? "" : " off")} onClick={save} aria-label="Besiegeln"><Icon name="haken" /></button>
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
              {d.date && <div className="sheet-sub"><input className="sheet-in" type="date" value={d.date} onChange={(e) => { const v = e.target.value || today; upd({ date: v, repeatDay: d.repeat === "monat-tag" ? Number(v.slice(8)) : undefined }); }} /></div>}
              {d.date && (
                <label className="sheet-row">
                  <span className="sheet-ic"><Icon name="zyklus" /></span>
                  <span className="sheet-name">Wiederholen</span>
                  <select className="sheet-select" value={d.repeat ?? ""} onChange={(e) => {
                    const v = (e.target.value || undefined) as Reminder["repeat"];
                    upd({ repeat: v, repeatDay: v === "monat-tag" ? Number(d.date!.slice(8)) : undefined });
                  }}>
                    <option value="">Nie</option>
                    <option value="monat-tag">{repeatLabel("monat-tag", d.date)}</option>
                    <option value="monat-wochentag">{repeatLabel("monat-wochentag", d.date)}</option>
                  </select>
                  <Icon name="rechts" />
                </label>
              )}
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

            <div className="sheet-label">Frist</div>
            <div className="sheet-card rows">
              <div className="sheet-row">
                <span className="sheet-ic frist"><Icon name="sanduhr" /></span>
                <span className="sheet-name">Galgenfrist{d.frist && <small>{short(d.frist)}</small>}</span>
                <Toggle on={!!d.frist} onChange={(v) => upd(v ? { frist: d.frist ?? addDays(today, 14), vorfrist: d.vorfrist ?? addDays(d.frist ?? addDays(today, 14), -7) } : { frist: undefined, vorfrist: undefined })} />
              </div>
              {d.frist && <div className="sheet-sub"><input className="sheet-in" type="date" value={d.frist} onChange={(e) => upd({ frist: e.target.value || d.frist })} /></div>}
              {d.frist && (
                <div className="sheet-row">
                  <span className="sheet-ic"><Icon name="kalender" /></span>
                  <span className="sheet-name">Gnadenfrist{d.vorfrist && <small>{short(d.vorfrist)}</small>}</span>
                  <Toggle on={!!d.vorfrist} onChange={(v) => upd({ vorfrist: v ? addDays(d.frist!, -7) : undefined })} />
                </div>
              )}
              {d.frist && d.vorfrist && <div className="sheet-sub"><input className="sheet-in" type="date" value={d.vorfrist} max={d.frist} onChange={(e) => upd({ vorfrist: e.target.value || d.vorfrist })} /></div>}
            </div>

            <div className="sheet-label">Weitere Optionen</div>
            <div className="sheet-card rows">
              <label className="sheet-row">
                <span className="sheet-ic"><Icon name="rolle" /></span>
                <span className="sheet-name">Rolle</span>
                <select className="sheet-select" value={d.category} onChange={(e) => upd({ category: e.target.value })}>
                  <option value="">Keine</option>
                  {allLists.map((l) => <option key={l} value={l}>{l}</option>)}
                  <option value={NEW}>Neue Rolle</option>
                </select>
                <Icon name="rechts" />
              </label>
              {d.category === NEW && (
                <div className="sheet-sub">
                  <input className="sheet-in" value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="Name der Rolle" />
                  <ArmsMini arms={newArms ?? baseArms} onChange={setNewArms} />
                </div>
              )}
            </div>

            {!isNew && <button className="sheet-del" onClick={() => remove(d.id)}>Erinnerung verbannen</button>}
          </div>
        </div>
      )}
    </>
  );
}
