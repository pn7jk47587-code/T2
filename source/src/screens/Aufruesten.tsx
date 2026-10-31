import { useEffect, useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { FoldHead } from "../components/Fold";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { iso, todayISO } from "../core/overview";

interface Session { start: number; end: number; min: number }
interface Training {
  sessions: Session[];
  active?: { start: number; plan: number };
  exam?: string;
  slips: number[];
}
const EMPTY: Training = { sessions: [], slips: [] };

/** Ränge nach gesammelten Lernstunden */
const RANKS: [number, string][] = [[0, "Page"], [10, "Knappe"], [30, "Schildknappe"], [75, "Waffenknecht"], [150, "Ritter"], [300, "Bannerritter"], [500, "Burgvogt"], [800, "Großmeister"]];
/** Waffen: bewusst schwer zu erreichen */
const WEAPONS: [number, string][] = [[5, "Dolch"], [20, "Streitkolben"], [50, "Kurzschwert"], [100, "Langschwert"], [160, "Säbel"], [250, "Streitaxt"], [400, "Zweihänder"], [650, "Turnierlanze"]];
const PLANS = [25, 50, 90, 120];
const DAILY_MIN = 25; // so viel zählt als Trainingstag

const fmtH = (min: number) => (min < 60 ? `${Math.round(min)} Min.` : `${(min / 60).toFixed(min < 600 ? 1 : 0).replace(".", ",")} Std.`);

export function Aufruesten({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [t, setT] = useStored<Training>("aufruesten", EMPTY);
  const [now, setNow] = useState(Date.now());
  const [showArms, setShowArms] = useState(true);
  const [halt, setHalt] = useState(() => location.hash.includes("halt"));
  useEffect(() => { const on = () => setHalt(location.hash.includes("halt")); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  const data: Training = { ...EMPTY, ...t };

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);

  const totalMin = data.sessions.reduce((a, s) => a + s.min, 0);
  const hours = totalMin / 60;
  const rankIdx = RANKS.reduce((acc, [h], i) => (hours >= h ? i : acc), 0);
  const next = RANKS[rankIdx + 1];
  const progress = next ? (hours - RANKS[rankIdx][0]) / (next[0] - RANKS[rankIdx][0]) : 1;

  // Tagesminuten und Serie (ein Tag zählt ab 25 Minuten)
  const perDay: Record<string, number> = {};
  for (const s of data.sessions) { const k = iso(new Date(s.start)); perDay[k] = (perDay[k] ?? 0) + s.min; }
  let streak = 0; { const d = new Date(); if ((perDay[iso(d)] ?? 0) < DAILY_MIN) d.setDate(d.getDate() - 1); while ((perDay[iso(d)] ?? 0) >= DAILY_MIN) { streak++; d.setDate(d.getDate() - 1); } }
  const today = perDay[todayISO()] ?? 0;

  const examDays = data.exam ? Math.ceil((new Date(data.exam + "T09:00:00").getTime() - now) / 864e5) : null;

  const start = (plan: number) => setT({ ...data, active: { start: Date.now(), plan } });
  const stop = () => {
    if (!data.active) return;
    const min = Math.floor((Date.now() - data.active.start) / 60000);
    setT({ ...data, active: undefined, sessions: min >= 1 ? [...data.sessions, { start: data.active.start, end: Date.now(), min }] : data.sessions });
    if (halt) location.hash = "aufruesten";
  };
  const slip = () => { setT({ ...data, slips: [...data.slips, Date.now()] }); location.hash = "aufruesten"; };

  /* ---------- Lernmodus: Bibliothek ---------- */
  if (data.active) {
    const el = (now - data.active.start) / 1000, plan = data.active.plan * 60;
    const left = Math.max(0, plan - el), done = left === 0;
    const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(Math.floor(left % 60)).padStart(2, "0");
    return (
      <div className="au-lib">
        {halt && (
          <div className="au-halt">
            <h2>Halt, {RANKS[rankIdx][1]}!</h2>
            <p>Du wolltest in der Bibliothek bleiben. Noch {mm}:{ss} bis zur Pause.</p>
            <button className="au-btn primary" onClick={() => (location.hash = "aufruesten")}>Zurück zu den Büchern</button>
            <button className="au-btn" onClick={slip}>Ich weiche ab (Fehltritt)</button>
          </div>
        )}
        <div className="au-lib-title">In der Bibliothek</div>
        <div className="au-clock" aria-live="polite">{done ? "Vollbracht" : `${mm}:${ss}`}</div>
        <div className="au-candle" aria-hidden="true"><Icon name="gewohnheiten" /></div>
        <div className="au-bar"><i style={{ width: `${Math.min(100, (el / plan) * 100)}%` }} /></div>
        <button className="au-btn primary" onClick={stop}>{done ? "Lernzeit besiegeln" : "Lernen beenden"}</button>
      </div>
    );
  }

  return (
    <Shell mod={mod} back={back} emblem={false}>
      {halt && <div className="card au-note">Kein Lernmodus aktiv. Du darfst passieren.</div>}

      <div className="card au-rank">
        <small>Rang</small>
        <div className="au-rank-name">{RANKS[rankIdx][1]}</div>
        <div className="au-bar"><i style={{ width: `${progress * 100}%` }} /></div>
        <div className="au-rank-sub">{fmtH(totalMin)} gelernt{next ? ` · ${next[1]} ab ${next[0]} Std.` : ""}</div>
      </div>

      <div className="au-stats">
        <div className="card"><b>{streak}</b><small>{streak === 1 ? "Tag" : "Tage"} in Folge</small></div>
        <div className="card"><b>{fmtH(today)}</b><small>heute</small></div>
        <div className="card"><b>{data.slips.length}</b><small>Fehltritte</small></div>
      </div>

      <div className="section eyebrow">In die Bibliothek</div>
      <div className="au-plans">
        {PLANS.map((p) => <button key={p} className="au-plan" onClick={() => start(p)}><b>{p}</b><small>Min.</small></button>)}
      </div>

      <div className="card au-boss">
        <div>
          <small>Endkampf</small>
          <div className="au-boss-name">Zweites Staatsexamen</div>
          {examDays !== null && <div className="au-boss-days">{examDays > 0 ? `noch ${examDays} Tage` : "Der Kampf ist da"}</div>}
        </div>
        <input type="date" className="sheet-in" value={data.exam ?? ""} onChange={(e) => setT({ ...data, exam: e.target.value || undefined })} aria-label="Datum des Endkampfs" />
      </div>

      <FoldHead label="Waffenkammer" open={showArms} onToggle={() => setShowArms((v) => !v)} />
      {showArms && (
        <div className="au-arms">
          {WEAPONS.map(([h, name]) => {
            const got = hours >= h;
            return (
              <div key={name} className={"au-weapon" + (got ? " got" : "")}>
                <span className="au-weapon-ic"><Icon name="schwert" /></span>
                <b>{name}</b>
                <small>{got ? "errungen" : `ab ${h} Std.`}</small>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
