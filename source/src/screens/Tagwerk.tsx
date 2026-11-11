import { useEffect, useMemo, useRef, useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { FoldHead } from "../components/Fold";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { iso, todayISO } from "../core/overview";
import { DEFAULT, PALETTE, addDays, catOf, freeSlot, icsFor, materialize, sweep, toHHMM, toMin, type Cat, type Repeat, type Tagwerk as TW, type Task, type Tpl } from "../core/tagwerk";

const H0 = 6, H1 = 24, PX = 56; // Stunden der Zeitleiste, Pixel pro Stunde
const DURS = [15, 20, 30, 45, 60, 90, 120];
const REMINDS: (number | null)[] = [null, 0, 5, 10, 15, 30];
const REPEATS: { id: Repeat; name: string }[] = [{ id: "nie", name: "Nie" }, { id: "taeglich", name: "Täglich" }, { id: "werktags", name: "Werktags" }, { id: "woechentlich", name: "Wöchentlich" }, { id: "monatlich", name: "Monatlich" }];
const remindName = (r: number | null) => (r === null ? "Keine" : r === 0 ? "Pünktlich" : `${r} Min. vorher`);
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function Tagwerk({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [raw, setW, ready] = useStored<TW>("tagwerk", DEFAULT);
  const w: TW = { ...DEFAULT, ...raw };
  const today = todayISO();
  const [day, setDay] = useState(today);
  const [edit, setEdit] = useState<{ t: Task; isNew: boolean; repeat: Repeat } | null>(null);
  const [setup, setSetup] = useState(false);
  const [openFold, setOpenFold] = useState(true);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(nowMin());
  useEffect(() => { const i = setInterval(() => setNow(nowMin()), 30000); return () => clearInterval(i); }, []);

  // Beim Öffnen: Vergangenes nach „Offen“, Vorlagen für die nächsten Tage anlegen
  useEffect(() => {
    if (!ready) return;
    setW((p) => materialize(sweep({ ...DEFAULT, ...p }, today), [today, day, addDays(today, 1)].filter((d, i, a) => d >= today && a.indexOf(d) === i)));
  }, [ready, day, today, setW]);

  const upd = (f: (p: TW) => TW) => setW((p) => f({ ...DEFAULT, ...p }));
  const setTask = (id: string, patch: Partial<Task>) => upd((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const dayTasks = w.tasks.filter((t) => t.date === day);
  const timed = dayTasks.filter((t) => t.start).sort((a, b) => toMin(a.start!) - toMin(b.start!));
  const untimed = dayTasks.filter((t) => !t.start);
  const open = w.tasks.filter((t) => !t.date && !t.done).sort((a, b) => (a.was ?? "9") < (b.was ?? "9") ? -1 : a.createdAt - b.createdAt);

  // Ehre: heute und diese Woche (ab Montag)
  const planned = dayTasks.reduce((a, t) => a + t.points, 0);
  const earned = dayTasks.filter((t) => t.done).reduce((a, t) => a + t.points, 0);
  const monday = (() => { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); })();
  const week = w.tasks.filter((t) => t.done && t.doneAt && iso(new Date(t.doneAt)) >= monday && iso(new Date(t.doneAt)) <= addDays(monday, 6)).reduce((a, t) => a + t.points, 0);

  const toggle = (t: Task) => {
    setTask(t.id, { done: !t.done, doneAt: t.done ? undefined : Date.now() });
    if (!t.done) { setToast(`+${t.points} Ehre`); setTimeout(() => setToast(""), 1600); }
  };

  // Vorschläge aus „Offen“ für freie Lücken des gewählten Tages
  const suggestions = useMemo(() => {
    if (day < today) return [];
    let tmp = w; const out: { t: Task; at: string }[] = [];
    for (const t of open) {
      if (out.length >= 3) break;
      const at = freeSlot(tmp, day, t.dur, day === today ? Math.max(8 * 60, now + 15) : 8 * 60);
      if (!at) continue;
      out.push({ t, at });
      tmp = { ...tmp, tasks: [...tmp.tasks, { ...t, date: day, start: at }] };
    }
    return out;
  }, [w, open, day, today, now]);

  const newTask = (start?: string): Task => {
    const c = w.cats[0];
    return { id: crypto.randomUUID(), title: "", cat: c?.id ?? "", date: day, start, dur: 30, points: c?.points ?? 1, remind: c?.remind ?? null, done: false, createdAt: Date.now() };
  };

  const saveEdit = () => {
    if (!edit || !edit.t.title.trim()) return;
    const t = { ...edit.t, title: edit.t.title.trim() };
    upd((p) => {
      let tasks = edit.isNew ? [...p.tasks, t] : p.tasks.map((x) => (x.id === t.id ? t : x));
      let tpls = p.tpls;
      if (edit.repeat !== "nie" && t.date && t.start && !t.tpl) {
        const tpl: Tpl = { id: crypto.randomUUID(), title: t.title, cat: t.cat, start: t.start, dur: t.dur, repeat: edit.repeat as Tpl["repeat"], from: t.date, points: t.points, remind: t.remind };
        tpls = [...tpls, tpl];
        tasks = tasks.map((x) => (x.id === t.id ? { ...x, tpl: tpl.id, tplDate: t.date } : x));
      }
      return { ...p, tasks, tpls };
    });
    setEdit(null);
  };
  const removeTask = (t: Task) => upd((p) => ({ ...p, tasks: p.tasks.filter((x) => x.id !== t.id), skip: t.tpl && t.tplDate ? [...p.skip, t.tpl + "@" + t.tplDate] : p.skip }));

  /* ---------- Zeitleiste mit Ziehen ---------- */
  const line = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; y: number; start: number; timer: number; active: boolean; moved: boolean } | null>(null);
  const [dragOff, setDragOff] = useState<{ id: string; min: number } | null>(null);
  useEffect(() => {
    const el = line.current; if (!el) return;
    const stop = (e: TouchEvent) => { if (drag.current?.active) e.preventDefault(); };
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);
  const snap = (m: number) => Math.round(m / 15) * 15;

  const dayLabel = new Date(day + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const e = edit?.t;

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <div className="tw-head">
        <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label="Voriger Tag"><Icon name="links" /></button>
        <button className="tw-day" onClick={() => setDay(today)}>{day === today ? "Heute" : dayLabel}{day === today && <small>{dayLabel}</small>}</button>
        <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} aria-label="Nächster Tag"><Icon name="rechts" /></button>
      </div>

      <div className="card tw-honor">
        <div className="tw-honor-row"><span>Ehre heute</span><b>{earned}{planned ? ` / ${planned}` : ""}</b></div>
        <div className="au-bar"><i style={{ width: `${planned ? Math.min(100, (earned / planned) * 100) : 0}%` }} /></div>
        <div className="tw-honor-sub">Diese Woche {week}</div>
      </div>

      {suggestions.length > 0 && (
        <div className="card tw-sugg">
          <small>Aus „Offen“ vorgeschlagen</small>
          {suggestions.map(({ t, at }) => (
            <div key={t.id} className="tw-sugg-row">
              <i style={{ background: catOf(w, t.cat).color }} />
              <span>{t.title}</span>
              <button onClick={() => setTask(t.id, { date: day, start: at })}>{at} einplanen</button>
            </div>
          ))}
        </div>
      )}

      {untimed.length > 0 && (
        <div className="er-group tw-untimed">
          {untimed.map((t) => (
            <div key={t.id} className={"tw-row" + (t.done ? " done" : "")}>
              <button className="hb-check" style={{ borderColor: catOf(w, t.cat).color }} onClick={() => toggle(t)} aria-label="Abhaken">{t.done ? "✓" : ""}</button>
              <button className="tw-row-t" onClick={() => setEdit({ t: { ...t }, isNew: false, repeat: "nie" })}>{t.title}</button>
              <small>{t.points}</small>
            </div>
          ))}
        </div>
      )}

      <div className="tw-line" ref={line} style={{ height: (H1 - H0) * PX }}
        onClick={(ev) => {
          if ((ev.target as HTMLElement).closest(".tw-block")) return;
          const r = line.current!.getBoundingClientRect();
          const m = snap(H0 * 60 + ((ev.clientY - r.top) / PX) * 60);
          setEdit({ t: newTask(toHHMM(Math.max(H0 * 60, m))), isNew: true, repeat: "nie" });
        }}>
        {Array.from({ length: H1 - H0 }, (_, i) => (
          <div key={i} className="tw-hour" style={{ top: i * PX }}><span>{String(H0 + i).padStart(2, "0")}</span></div>
        ))}
        {day === today && now >= H0 * 60 && <div className="tw-now" style={{ top: ((now - H0 * 60) / 60) * PX }} />}
        {timed.map((t) => {
          const c = catOf(w, t.cat);
          const startMin = dragOff?.id === t.id ? dragOff.min : toMin(t.start!);
          return (
            <div key={t.id} className={"tw-block" + (t.done ? " done" : "") + (dragOff?.id === t.id ? " lifted" : "")}
              style={{ top: ((startMin - H0 * 60) / 60) * PX, height: Math.max(26, (t.dur / 60) * PX - 2), "--c": c.color } as React.CSSProperties}
              onPointerDown={(ev) => {
                const s = { id: t.id, y: ev.clientY, start: toMin(t.start!), timer: 0, active: false, moved: false };
                s.timer = window.setTimeout(() => { s.active = true; setDragOff({ id: t.id, min: s.start }); navigator.vibrate?.(10); }, 320);
                drag.current = s; (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
              }}
              onPointerMove={(ev) => {
                const s = drag.current; if (!s) return;
                const dy = ev.clientY - s.y;
                if (!s.active) { if (Math.abs(dy) > 8) { s.moved = true; clearTimeout(s.timer); } return; }
                setDragOff({ id: s.id, min: Math.max(H0 * 60, Math.min(H1 * 60 - t.dur, snap(s.start + (dy / PX) * 60))) });
              }}
              onPointerUp={() => {
                const s = drag.current; drag.current = null; if (!s) return; clearTimeout(s.timer);
                if (s.active) { if (dragOff) setTask(t.id, { start: toHHMM(dragOff.min) }); setDragOff(null); }
                else if (!s.moved) setEdit({ t: { ...t }, isNew: false, repeat: "nie" });
              }}
              onPointerCancel={() => { const s = drag.current; if (s) clearTimeout(s.timer); drag.current = null; setDragOff(null); }}
              onContextMenu={(ev) => ev.preventDefault()}>
              <button className="tw-tick" onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => { ev.stopPropagation(); toggle(t); }} aria-label="Abhaken">{t.done ? "✓" : ""}</button>
              <div className="tw-block-t">
                <b>{t.title}</b>
                <small>{toHHMM(startMin)}–{toHHMM(startMin + t.dur)} · {t.points} Ehre</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tw-actions">
        <button className="au-btn primary" onClick={() => setEdit({ t: newTask(freeSlot(w, day, 30, day === today ? now + 15 : 8 * 60) ?? undefined), isNew: true, repeat: "nie" })}>Neue Aufgabe</button>
        <button className="au-btn" onClick={() => download(`tagwerk-${day}.ics`, icsFor(w, dayTasks))}>Tag an das iPhone übergeben</button>
        <button className="au-btn" onClick={() => {
          const days = Array.from({ length: 7 }, (_, i) => addDays(day < today ? today : day, i));
          const full = materialize(w, days); setW(full);
          download(`tagwerk-woche-${days[0]}.ics`, icsFor(full, full.tasks.filter((t) => t.date && days.includes(t.date))));
        }}>Woche übergeben</button>
        <button className="er-addlist" onClick={() => setSetup(true)}>Einrichten</button>
      </div>

      <FoldHead label={`Offen (${open.length})`} open={openFold} onToggle={() => setOpenFold((v) => !v)} />
      {openFold && (
        <div className="er-group">
          {open.map((t) => (
            <div key={t.id} className="tw-row">
              <i className="tw-dot" style={{ background: catOf(w, t.cat).color }} />
              <button className="tw-row-t" onClick={() => setEdit({ t: { ...t }, isNew: false, repeat: "nie" })}>{t.title}{t.was && <small>ursprünglich {new Date(t.was + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</small>}</button>
              <button className="tw-plan" onClick={() => { const at = freeSlot(w, day, t.dur, day === today ? now + 15 : 8 * 60); setTask(t.id, { date: day, start: at ?? undefined }); }}>Einplanen</button>
            </div>
          ))}
          {!open.length && <div className="empty">Nichts offen</div>}
          <button className="er-addlist" onClick={() => setEdit({ t: { ...newTask(), date: undefined }, isNew: true, repeat: "nie" })}>+ Nach „Offen“</button>
        </div>
      )}

      {toast && <div className="tw-toast">{toast}</div>}

      {e && edit && (
        <div className="sheet-bg" onClick={() => setEdit(null)}>
          <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
            <div className="sheet-head">
              <button className="sheet-btn" onClick={() => setEdit(null)} aria-label="Abbrechen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
              <span>{edit.isNew ? "Neue Aufgabe" : "Aufgabe"}</span>
              <button className={"sheet-btn ok" + (e.title.trim() ? "" : " off")} onClick={saveEdit} aria-label="Besiegeln"><Icon name="haken" /></button>
            </div>
            <div className="sheet-card"><input className="sheet-in big" value={e.title} autoFocus={edit.isNew} placeholder="Titel" onChange={(ev) => setEdit({ ...edit, t: { ...e, title: ev.target.value } })} /></div>

            <div className="sheet-label">Kategorie</div>
            <div className="bf-chips tw-cats">
              {w.cats.map((c) => (
                <button key={c.id} className={"bf-chip" + (e.cat === c.id ? " on" : "")} style={{ "--c": c.color } as React.CSSProperties}
                  onClick={() => setEdit({ ...edit, t: { ...e, cat: c.id, points: edit.isNew ? c.points : e.points, remind: edit.isNew ? c.remind : e.remind } })}>
                  <i style={{ background: c.color }} />{c.name}
                </button>
              ))}
            </div>

            <div className="sheet-label">Wann</div>
            <div className="tw-when">
              <input type="date" className="sheet-in" value={e.date ?? ""} onChange={(ev) => setEdit({ ...edit, t: { ...e, date: ev.target.value || undefined } })} />
              <input type="time" className="sheet-in" step={900} value={e.start ?? ""} onChange={(ev) => setEdit({ ...edit, t: { ...e, start: ev.target.value || undefined } })} />
              <button className={"bf-chip" + (!e.date ? " on" : "")} onClick={() => setEdit({ ...edit, t: { ...e, date: undefined, start: undefined } })}>Offen</button>
            </div>
            <div className="sheet-label">Dauer</div>
            <div className="bf-chips">{DURS.map((d) => <button key={d} className={"bf-chip" + (e.dur === d ? " on" : "")} onClick={() => setEdit({ ...edit, t: { ...e, dur: d } })}>{d < 60 ? `${d} Min.` : `${d / 60} Std.`.replace(".5", ",5")}</button>)}</div>
            <div className="sheet-label">Ehre</div>
            <div className="hb-num tw-pts">
              <button onClick={() => setEdit({ ...edit, t: { ...e, points: Math.max(0, e.points - 1) } })} aria-label="Weniger">−</button><b>{e.points}</b>
              <button onClick={() => setEdit({ ...edit, t: { ...e, points: e.points + 1 } })} aria-label="Mehr">+</button>
            </div>
            <div className="sheet-label">Erinnerung</div>
            <div className="bf-chips">{REMINDS.map((r) => <button key={String(r)} className={"bf-chip" + (e.remind === r ? " on" : "")} onClick={() => setEdit({ ...edit, t: { ...e, remind: r } })}>{remindName(r)}</button>)}</div>
            {!e.tpl && e.date && e.start && (
              <>
                <div className="sheet-label">Wiederholen</div>
                <div className="bf-chips">{REPEATS.map((r) => <button key={r.id} className={"bf-chip" + (edit.repeat === r.id ? " on" : "")} onClick={() => setEdit({ ...edit, repeat: r.id })}>{r.name}</button>)}</div>
              </>
            )}
            {e.tpl && <p className="tw-note">Wiederkehrender Termin. Änderungen gelten nur für diesen Tag, die Vorlage änderst du unter „Einrichten“.</p>}

            {!edit.isNew && (
              <div className="tw-moves">
                <button className="bf-chip" onClick={() => { const at = freeSlot({ ...w, tasks: w.tasks.filter((x) => x.id !== e.id) }, e.date ?? day, e.dur, Math.max(nowMin() + 15, e.start ? toMin(e.start) + 15 : 0)); setTask(e.id, { date: e.date ?? day, start: at ?? undefined }); setEdit(null); }}>Später</button>
                <button className="bf-chip" onClick={() => { setTask(e.id, { date: addDays(e.date ?? today, 1) }); setEdit(null); }}>Morgen</button>
                <button className="bf-chip" onClick={() => { setTask(e.id, { date: undefined, start: undefined, was: e.date ?? e.was }); setEdit(null); }}>In „Offen“</button>
                <button className="bf-chip" onClick={() => { toggle(e); setEdit(null); }}>{e.done ? "Wieder offen" : "Vollbracht"}</button>
              </div>
            )}
            {!edit.isNew && <button className="sheet-del" onClick={() => { removeTask(e); setEdit(null); }}>Aufgabe verbannen</button>}
          </div>
        </div>
      )}

      {setup && <Setup w={w} upd={upd} close={() => setSetup(false)} />}
    </Shell>
  );
}

/** Kategorien und wiederkehrende Vorlagen einrichten */
function Setup({ w, upd, close }: { w: TW; upd: (f: (p: TW) => TW) => void; close: () => void }) {
  const setCat = (id: string, p: Partial<Cat>) => upd((x) => ({ ...x, cats: x.cats.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const setTpl = (id: string, p: Partial<Tpl>) => upd((x) => ({ ...x, tpls: x.tpls.map((t) => (t.id === id ? { ...t, ...p } : t)) }));
  return (
    <div className="sheet-bg" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span />
          <span>Einrichten</span>
          <button className="sheet-btn ok" onClick={close} aria-label="Fertig"><Icon name="haken" /></button>
        </div>
        <div className="sheet-label">Kategorien</div>
        {w.cats.map((c) => (
          <div key={c.id} className="card tw-setup">
            <input className="sheet-in" value={c.name} onChange={(e) => setCat(c.id, { name: e.target.value })} />
            <div className="am-sws">{PALETTE.map((p) => <button key={p} className={"am-sw" + (c.color === p ? " on" : "")} style={{ background: p }} onClick={() => setCat(c.id, { color: p })} aria-label="Farbe" />)}</div>
            <div className="tw-setup-row">
              <span>Ehre</span>
              <span className="hb-num"><button onClick={() => setCat(c.id, { points: Math.max(0, c.points - 1) })}>−</button><b>{c.points}</b><button onClick={() => setCat(c.id, { points: c.points + 1 })}>+</button></span>
            </div>
            <div className="bf-chips">{REMINDS.map((r) => <button key={String(r)} className={"bf-chip" + (c.remind === r ? " on" : "")} onClick={() => setCat(c.id, { remind: r })}>{remindName(r)}</button>)}</div>
            {w.cats.length > 1 && <button className="tw-del" onClick={() => upd((x) => ({ ...x, cats: x.cats.filter((k) => k.id !== c.id) }))}>Kategorie verbannen</button>}
          </div>
        ))}
        <button className="er-addlist" onClick={() => upd((x) => ({ ...x, cats: [...x.cats, { id: crypto.randomUUID(), name: "Neue Kategorie", color: PALETTE[x.cats.length % PALETTE.length], points: 1, remind: 10 }] }))}>+ Neue Kategorie</button>

        <div className="sheet-label">Wiederkehrend</div>
        {w.tpls.map((t) => (
          <div key={t.id} className="card tw-setup">
            <input className="sheet-in" value={t.title} onChange={(e) => setTpl(t.id, { title: e.target.value })} />
            <div className="tw-when">
              <input type="time" className="sheet-in" step={900} value={t.start} onChange={(e) => e.target.value && setTpl(t.id, { start: e.target.value })} />
              <select className="sheet-select" value={t.dur} onChange={(e) => setTpl(t.id, { dur: Number(e.target.value) })}>{DURS.map((d) => <option key={d} value={d}>{d} Min.</option>)}</select>
              <select className="sheet-select" value={t.cat} onChange={(e) => setTpl(t.id, { cat: e.target.value })}>{w.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
            <div className="bf-chips">{REPEATS.filter((r) => r.id !== "nie").map((r) => <button key={r.id} className={"bf-chip" + (t.repeat === r.id ? " on" : "")} onClick={() => setTpl(t.id, { repeat: r.id as Tpl["repeat"] })}>{r.name}</button>)}</div>
            <p className="tw-note">Gilt für Tage, die noch nicht angelegt sind. Kurzbefehl-Adresse: <code>#jetzt?vorlage={t.id}</code></p>
            <button className="tw-del" onClick={() => upd((x) => ({ ...x, tpls: x.tpls.filter((k) => k.id !== t.id), tasks: x.tasks.filter((k) => !(k.tpl === t.id && k.date && k.date > todayISO() && !k.done)) }))}>Vorlage beenden</button>
          </div>
        ))}
      </div>
    </div>
  );
}
