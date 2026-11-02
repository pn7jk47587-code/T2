import { useState } from "react";
import { Shell } from "../components/Shell";
import { FoldHead } from "../components/Fold";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { todayISO } from "../core/overview";
import { ATTRIBUTION, FEATURES, FOCUS, OPEN_HAND, PROFICIENCIES, TABLE } from "../data/moench";

const STATS = [["str", "Stärke"], ["ges", "Geschicklichkeit"], ["kon", "Konstitution"], ["int", "Intelligenz"], ["wei", "Weisheit"], ["cha", "Charisma"]] as const;
type StatKey = (typeof STATS)[number][0];

interface Hero {
  name: string; spezies: string; hintergrund: string; unterklasse: string; stufe: number;
  stats: Record<StatKey, number>;
  tpMax: number; tp: number; fokus: number;
  wesen: string; geschichte: string; ausruestung: string;
}
interface Goal { id: string; text: string; done: boolean }
interface Session { id: string; date: string; title: string; text: string }
interface Book { hero: Hero; goals: Goal[]; sessions: Session[] }

const EMPTY: Book = {
  hero: { name: "", spezies: "", hintergrund: "", unterklasse: "", stufe: 1, stats: { str: 10, ges: 10, kon: 10, int: 10, wei: 10, cha: 10 }, tpMax: 8, tp: 8, fokus: 0, wesen: "", geschichte: "", ausruestung: "" },
  goals: [], sessions: [],
};
const TABS = ["Held", "Ziele", "Sitzungen", "Nachschlagen"] as const;
const mod = (v: number) => Math.floor((v - 10) / 2);
const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const m = (x: number) => (x ? `+${String(x).replace(".", ",")} m` : "–");

export function Heldenbuch({ mod: def, back }: { mod: ModuleDef; back: () => void }) {
  const [book, setBook] = useStored<Book>("heldenbuch", EMPTY);
  const [tab, setTab] = useState(0);
  const [goal, setGoal] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const b: Book = { ...EMPTY, ...book, hero: { ...EMPTY.hero, ...book.hero, stats: { ...EMPTY.hero.stats, ...book.hero?.stats } } };
  const h = b.hero;
  const setHero = (p: Partial<Hero>) => setBook({ ...b, hero: { ...h, ...p } });
  const lvl = Math.min(20, Math.max(1, h.stufe));
  const [pb, die, fp, mv] = TABLE[lvl];
  const ges = mod(h.stats.ges), wei = mod(h.stats.wei);

  const field = (k: "spezies" | "hintergrund" | "unterklasse", label: string) => (
    <label key={k} className="hb-field"><small>{label}</small><input className="sheet-in" value={h[k]} onChange={(e) => setHero({ [k]: e.target.value } as Partial<Hero>)} /></label>
  );
  const Num = ({ v, set, min = 0, max = 999 }: { v: number; set: (n: number) => void; min?: number; max?: number }) => (
    <span className="hb-num">
      <button onClick={() => set(Math.max(min, v - 1))} aria-label="Weniger">−</button>
      <b>{v}</b>
      <button onClick={() => set(Math.min(max, v + 1))} aria-label="Mehr">+</button>
    </span>
  );

  return (
    <Shell mod={def} back={back} emblem={false}>
      <div className="hb-tabs">
        {TABS.map((t, i) => <button key={t} className={"am-tab" + (i === tab ? " on" : "")} onClick={() => setTab(i)}>{t}</button>)}
      </div>

      {tab === 0 && (
        <>
          <div className="card hb-card">
            <input className="sheet-in hb-name" value={h.name} onChange={(e) => setHero({ name: e.target.value })} placeholder="Name der Heldin" />
            <div className="hb-sub">Mönch · Stufe <Num v={lvl} set={(n) => setHero({ stufe: n })} min={1} max={20} /></div>
            <div className="hb-fields">
              {field("spezies", "Spezies")}{field("hintergrund", "Hintergrund")}{field("unterklasse", "Unterklasse")}
            </div>
          </div>

          <div className="hb-stats">
            {STATS.map(([k, n]) => (
              <div key={k} className="card hb-stat">
                <small>{n}</small>
                <b>{sign(mod(h.stats[k]))}</b>
                <Num v={h.stats[k]} set={(v) => setHero({ stats: { ...h.stats, [k]: v } })} min={1} max={30} />
              </div>
            ))}
          </div>

          <div className="hb-derived">
            <div className="card"><small>Rüstungsklasse</small><b>{10 + ges + wei}</b></div>
            <div className="card"><small>Übungsbonus</small><b>{sign(pb)}</b></div>
            <div className="card"><small>Kampfkunst</small><b>{die}</b></div>
            <div className="card"><small>Fokus-SG</small><b>{8 + wei + pb}</b></div>
            <div className="card"><small>Bewegung</small><b>{m(mv)}</b></div>
            <div className="card"><small>Initiative</small><b>{sign(ges)}</b></div>
          </div>

          <div className="card hb-pools">
            <div><small>Trefferpunkte</small><Num v={h.tp} set={(v) => setHero({ tp: v })} max={h.tpMax} /><span className="hb-of">von <Num v={h.tpMax} set={(v) => setHero({ tpMax: v, tp: Math.min(h.tp, v) })} min={1} /></span></div>
            {fp > 0 && <div><small>Fokuspunkte</small><Num v={Math.min(h.fokus, fp)} set={(v) => setHero({ fokus: v })} max={fp} /><span className="hb-of">von {fp}</span>
              <button className="hb-rest" onClick={() => setHero({ fokus: fp })}>Rast</button></div>}
          </div>

          {(["wesen", "geschichte", "ausruestung"] as const).map((k) => (
            <label key={k} className="card hb-text">
              <small>{k === "wesen" ? "Wesen und Eigenheiten" : k === "geschichte" ? "Vorgeschichte" : "Ausrüstung"}</small>
              <textarea className="sheet-in" rows={3} value={h[k]} onChange={(e) => setHero({ [k]: e.target.value } as Partial<Hero>)} />
            </label>
          ))}
        </>
      )}

      {tab === 1 && (
        <>
          <form className="bf-add" onSubmit={(e) => { e.preventDefault(); const t = goal.trim(); if (!t) return; setBook({ ...b, goals: [...b.goals, { id: crypto.randomUUID(), text: t, done: false }] }); setGoal(""); }}>
            <input className="sheet-in" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Neues Ziel" />
            {goal.trim() && <button className="bf-add-btn" type="submit">Hinzufügen</button>}
          </form>
          <div className="er-group" style={{ marginTop: 12 }}>
            {b.goals.map((g) => (
              <div key={g.id} className={"hb-goal" + (g.done ? " done" : "")}>
                <button className="hb-check" onClick={() => setBook({ ...b, goals: b.goals.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)) })} aria-label={g.done ? "Wieder offen" : "Erreicht"}>{g.done ? "✓" : ""}</button>
                <span>{g.text}</span>
                <button className="hb-del" onClick={() => setBook({ ...b, goals: b.goals.filter((x) => x.id !== g.id) })} aria-label="Verbannen">×</button>
              </div>
            ))}
            {!b.goals.length && <div className="empty">Noch keine Ziele</div>}
          </div>
        </>
      )}

      {tab === 2 && (
        <>
          <button className="er-addlist" style={{ marginBottom: 10 }} onClick={() => { const s: Session = { id: crypto.randomUUID(), date: todayISO(), title: `Sitzung ${b.sessions.length + 1}`, text: "" }; setBook({ ...b, sessions: [s, ...b.sessions] }); setOpen(s.id); }}>+ Neue Sitzung</button>
          {b.sessions.map((s) => (
            <div key={s.id} className="card hb-session">
              <button className="hb-session-head" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <b>{s.title || "Sitzung"}</b>
                <small>{new Date(s.date + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}</small>
              </button>
              {open === s.id ? (
                <div className="hb-session-body">
                  <input className="sheet-in" value={s.title} onChange={(e) => setBook({ ...b, sessions: b.sessions.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) })} />
                  <input className="sheet-in" type="date" value={s.date} onChange={(e) => setBook({ ...b, sessions: b.sessions.map((x) => (x.id === s.id ? { ...x, date: e.target.value || x.date } : x)) })} />
                  <textarea className="sheet-in" rows={8} value={s.text} placeholder="Was ist passiert?" onChange={(e) => setBook({ ...b, sessions: b.sessions.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)) })} />
                  <button className="sheet-del" onClick={() => setBook({ ...b, sessions: b.sessions.filter((x) => x.id !== s.id) })}>Sitzung verbannen</button>
                </div>
              ) : s.text && <p className="hb-preview">{s.text}</p>}
            </div>
          ))}
        </>
      )}

      {tab === 3 && (
        <>
          <div className="card hb-ref">
            <div className="hb-ref-row"><b>Stufe {lvl}</b><span>Übung {sign(pb)} · Kampfkunst {die} · Fokus {fp || "–"} · Bewegung {m(mv)}</span></div>
          </div>
          <FoldHead label="Fokus des Mönchs" open={open === "fokus"} onToggle={() => setOpen(open === "fokus" ? null : "fokus")} />
          {open === "fokus" && FOCUS.map((f) => <div key={f.name} className="card hb-feat"><b>{f.name}</b><small>{f.cost}</small><p>{f.text}</p></div>)}

          <FoldHead label="Klassenmerkmale" open={showAll} onToggle={() => setShowAll((v) => !v)} />
          {(showAll ? FEATURES : FEATURES.filter((f) => f.level <= lvl)).map((f) => (
            <div key={f.name} className={"card hb-feat" + (f.level > lvl ? " later" : "")}><b>{f.name}</b><small>Stufe {f.level}</small><p>{f.text}</p></div>
          ))}

          <FoldHead label="Krieger der offenen Hand" open={open === "hand"} onToggle={() => setOpen(open === "hand" ? null : "hand")} />
          {open === "hand" && OPEN_HAND.map((f) => (
            <div key={f.name} className={"card hb-feat" + (f.level > lvl ? " later" : "")}><b>{f.name}</b><small>Stufe {f.level}</small><p>{f.text}</p></div>
          ))}

          <FoldHead label="Übung und Trefferwürfel" open={open === "prof"} onToggle={() => setOpen(open === "prof" ? null : "prof")} />
          {open === "prof" && <div className="card hb-feat">{PROFICIENCIES.map((p) => <p key={p}>{p}</p>)}</div>}

          <p className="hb-attr">{ATTRIBUTION}</p>
        </>
      )}
    </Shell>
  );
}
