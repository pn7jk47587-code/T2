import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { iso, todayISO } from "../core/overview";
import { FEELINGS, FEELING_COLORS, colorById, dominantColor, feelingById, type Feeling, type FeelingColor, type FeelingLog } from "../core/feelings";
import { getShield } from "../core/shields";

type Step = "start" | "farbe" | "feld" | "suche";
const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const CELL = 92; // Abstand der Blasen im Feld

function dayPart() {
  const h = new Date().getHours();
  return h < 11 ? "heute Morgen" : h < 14 ? "heute Mittag" : h < 18 ? "heute Nachmittag" : "heute Abend";
}

/** Feld aller Gefühle: Rot oben links, Gelb oben rechts, Blau unten links, Grün unten rechts; die Blöcke treffen sich in der Mitte. */
function buildField() {
  const by = (c: FeelingColor) => FEELINGS.filter((f) => f.color === c);
  const dims = (n: number) => { const cols = Math.ceil(Math.sqrt(n)); return { cols, rows: Math.ceil(n / cols) }; };
  const R = dims(by("rot").length), Y = dims(by("gelb").length), B = dims(by("blau").length), G = dims(by("gruen").length);
  const left = Math.max(R.cols, B.cols), top = Math.max(R.rows, Y.rows);
  const cols = left + Math.max(Y.cols, G.cols), rows = top + Math.max(B.rows, G.rows);
  const cells: { f: Feeling; x: number; y: number }[] = [];
  const place = (list: Feeling[], d: { cols: number; rows: number }, right: boolean, bottom: boolean) => list.forEach((f, i) => {
    const cx = i % d.cols, cy = Math.floor(i / d.cols);
    const x = right ? left + cx : left - d.cols + cx;
    const y = bottom ? top + cy : top - d.rows + cy;
    cells.push({ f, x, y });
  });
  place(by("rot"), R, false, false); place(by("gelb"), Y, true, false); place(by("blau"), B, false, true); place(by("gruen"), G, true, true);
  return { cells, cols, rows, left, top };
}

const hex2 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[]) => `rgb(${c.join(",")})`;

export function Gefuehle({ back }: { mod: ModuleDef; back: () => void }) {
  const [log, setLog] = useStored<FeelingLog>("gefuehle", {});
  const [step, setStep] = useState<Step>("start");
  const [start, setStart] = useState<FeelingColor>("gelb");
  const [pick, setPick] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [color, setColor] = useState<FeelingColor>("gelb");
  const field = useMemo(buildField, []);
  const scroller = useRef<HTMLDivElement>(null);
  const today = todayISO();
  const todays = log[today] ?? [];

  // Woche Mo–So
  const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const week = WD.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return iso(d); });
  let streak = 0; { const d = new Date(); if (!log[iso(d)]?.length) d.setDate(d.getDate() - 1); while (log[iso(d)]?.length) { streak++; d.setDate(d.getDate() - 1); } }

  // Feld beim Öffnen auf den gewählten Farbbereich ausrichten
  useLayoutEffect(() => {
    if (step !== "feld" || !scroller.current) return;
    const el = scroller.current;
    const qx = start === "rot" || start === "blau" ? field.left - 2.5 : field.left + 2.5;
    const qy = start === "rot" || start === "gelb" ? field.top - 2.5 : field.top + 2.5;
    el.scrollLeft = qx * CELL + CELL / 2 + 40 - el.clientWidth / 2;
    el.scrollTop = qy * CELL * 0.88 + CELL / 2 + 120 - el.clientHeight / 2;
  }, [step, start, field]);
  useEffect(() => { if (step === "start") setPick(null); }, [step]);

  const save = () => {
    if (!pick) return;
    setLog((p) => ({ ...p, [today]: [...(p[today] ?? []), pick] }));
    setStep("start"); setQ("");
  };
  const removeToday = (i: number) => setLog((p) => {
    const next = (p[today] ?? []).filter((_, k) => k !== i); const out = { ...p, [today]: next }; if (!next.length) delete out[today]; return out;
  });
  const sel = pick ? feelingById(pick) : null;

  const bar = (
    <div className="gf-bar">
      <div className="gf-bar-text">
        {sel ? <><b style={{ color: colorById(sel.color).bubble }}>{sel.name}</b><span>{sel.desc}</span></> : <span>Tippe auf das Gefühl, das am besten beschreibt, wie du dich gerade fühlst</span>}
      </div>
      <button className={"gf-go" + (sel ? "" : " off")} onClick={save} disabled={!sel} aria-label="Speichern"><Icon name="rechts" /></button>
    </div>
  );

  /* ---------- Start ---------- */
  if (step === "start") {
    const total = todays.length;
    const R = 92, C = 2 * Math.PI * R;
    return (
      <div className="gf-start">
        <div className="topbar">
          <button className="back" onClick={back} aria-label="Zurück"><Icon name="back" /></button>
        </div>
        <div className="gf-week">
          {week.map((d, i) => {
            const dom = dominantColor(log[d]);
            return (
              <div key={d} className={"gf-wd" + (d === today ? " today" : "") + (d > today ? " future" : "")}>
                <small>{WD[i]}</small>
                <span className="gf-dot" style={dom ? { background: colorById(dom).bubble, boxShadow: `0 0 10px ${colorById(dom).glow}66` } : undefined}>{!dom && d <= today ? "+" : ""}</span>
              </div>
            );
          })}
        </div>
        <h2 className="gf-q">Wie fühlst du dich {dayPart()}?</h2>
        <div className="gf-ring">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle cx="110" cy="110" r={R} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="16" />
            {todays.map((id, i) => {
              const c = colorById(feelingById(id)?.color ?? "gelb");
              const seg = C / total;
              return <circle key={i} cx="110" cy="110" r={R} fill="none" stroke={c.bubble} strokeWidth="16" strokeLinecap="round"
                strokeDasharray={`${Math.max(seg - 10, 2)} ${C}`} strokeDashoffset={-i * seg} transform="rotate(-90 110 110)" style={{ filter: `drop-shadow(0 0 6px ${c.glow}88)` }} />;
            })}
          </svg>
          <button className="gf-checkin" onClick={() => setStep("farbe")}>
            <span className="gf-plus">+</span>
            <span>Einchecken</span>
          </button>
        </div>
        {todays.length > 0 && (
          <div className="gf-today">
            {todays.map((id, i) => {
              const f = feelingById(id); if (!f) return null;
              return <button key={i} className="gf-chip" style={{ "--fc": colorById(f.color).hex } as React.CSSProperties} onClick={() => removeToday(i)} aria-label={`${f.name} entfernen`}>{f.name}<span aria-hidden="true">×</span></button>;
            })}
          </div>
        )}
        <div className="gf-streak">{streak} {streak === 1 ? "Tag" : "Tage"} in Folge</div>
      </div>
    );
  }

  /* ---------- Farbe wählen ---------- */
  if (step === "farbe") {
    return (
      <div className="gf-step">
        <div className="gf-head">
          <button className="back" onClick={() => setStep("start")} aria-label="Schließen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          <button className="back" onClick={() => setStep("suche")} aria-label="Suchen"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></button>
        </div>
        <h2 className="gf-q">Tippe auf die Farbe, die am besten beschreibt, wie du dich gerade fühlst</h2>
        <div className="gf-quad">
          {FEELING_COLORS.map((c, i) => (
            <button key={c.id} className="gf-orb" style={{ "--c": c.bubble, "--g": c.glow, animationDelay: `${i * -1.3}s` } as React.CSSProperties}
              onClick={() => { setStart(c.id); setStep("feld"); }}>
              <span>{c.label.split(", ").map((t) => <span key={t}>{t}</span>)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Suche ---------- */
  if (step === "suche") {
    const s = q.trim().toLowerCase();
    const list = s ? FEELINGS.filter((f) => f.name.toLowerCase().includes(s) || f.desc.toLowerCase().includes(s)) : FEELINGS.filter((f) => f.color === color);
    return (
      <div className="gf-step">
        <div className="gf-search">
          <button className="gf-x" onClick={() => setStep(pick ? "feld" : "farbe")} aria-label="Schließen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          <input className="sheet-in" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gefühle suchen" autoFocus />
          {q && <button className="gf-clear" onClick={() => setQ("")}>Leeren</button>}
        </div>
        {!s && (
          <div className="gf-colors" role="tablist">
            {FEELING_COLORS.map((c) => (
              <button key={c.id} role="tab" aria-selected={color === c.id} className={"gf-color" + (color === c.id ? " on" : "")}
                style={{ "--fc": c.hex, "--fg": c.glow } as React.CSSProperties} onClick={() => setColor(c.id)}>{c.name}</button>
            ))}
          </div>
        )}
        <div className="gf-list">
          {list.map((f) => {
            const c = colorById(f.color);
            return (
              <button key={f.id} className={"gf-row" + (pick === f.id ? " on" : "")} style={{ "--fc": c.hex, "--fg": c.glow } as React.CSSProperties}
                onClick={() => setPick(f.id)}>
                <svg viewBox="0 0 100 120" className="gf-mark" aria-hidden="true"><path d={getShield("giebel").d} fill={c.bubble} /></svg>
                <span className="gf-name">{f.name}</span>
                <span className="gf-desc">{f.desc}</span>
              </button>
            );
          })}
          {list.length === 0 && <div className="empty">Nichts gefunden</div>}
        </div>
        {bar}
      </div>
    );
  }

  /* ---------- Feld ---------- */
  const corners = { rot: hex2(colorById("rot").bubble), gelb: hex2(colorById("gelb").bubble), blau: hex2(colorById("blau").bubble), gruen: hex2(colorById("gruen").bubble) };
  const W = field.cols * CELL + CELL / 2 + 80, H = field.rows * CELL * 0.88 + CELL + 240;
  return (
    <div className="gf-fieldwrap">
      <div ref={scroller} className="gf-field">
        <div style={{ width: W, height: H, position: "relative" }}>
          {field.cells.map(({ f, x, y }) => {
            const tx = x / Math.max(1, field.cols - 1), ty = y / Math.max(1, field.rows - 1);
            const blend = mix(mix(corners.rot, corners.gelb, tx), mix(corners.blau, corners.gruen, tx), ty);
            const col = rgb(mix(hex2(colorById(f.color).bubble), blend, 0.35));
            const on = pick === f.id;
            return (
              <button key={f.id} className={"gf-bub" + (on ? " on" : "")}
                style={{ left: 40 + x * CELL + (y % 2 ? CELL / 2 : 0), top: 120 + y * CELL * 0.88, background: col, "--gl": colorById(f.color).glow } as React.CSSProperties}
                onClick={() => setPick(on ? null : f.id)}>
                <span lang="de">{f.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="gf-head floating">
        <button className="back" onClick={() => setStep("farbe")} aria-label="Zurück"><Icon name="back" /></button>
        <button className="back" onClick={() => setStep("suche")} aria-label="Suchen"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></button>
      </div>
      {bar}
    </div>
  );
}
