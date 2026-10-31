import { useRef, useState } from "react";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { FoldHead } from "../components/Fold";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import { todayISO } from "../core/overview";

type Prio = "niedrig" | "mittel" | "hoch";
interface Piece { id: string; photo?: string; desc: string; prio: Prio; done: boolean; createdAt: number; doneAt?: number }
const PRIOS: { id: Prio; name: string }[] = [{ id: "niedrig", name: "Niedrig" }, { id: "mittel", name: "Mittel" }, { id: "hoch", name: "Hoch" }];
const RANK: Record<Prio, number> = { hoch: 0, mittel: 1, niedrig: 2 };

/** Foto verkleinern (max. 1000 px) und als JPEG speichern */
function shrink(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1000 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}

function icsDownload(date: string, n: number) {
  const d = date.replace(/-/g, ""), next = new Date(date + "T12:00:00"); next.setDate(next.getDate() + 1);
  const e = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, "0")}${String(next.getDate()).padStart(2, "0")}`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//App//Flickwerk//DE", "BEGIN:VEVENT", `UID:flicktag-${d}@app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${e}`,
    `SUMMARY:Flicktag (${n} Kleidungsstück${n === 1 ? "" : "e"})`, "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Flicktag", "TRIGGER:PT9H", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = "flicktag.ics"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function Flickwerk({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [pieces, setPieces] = useStored<Piece[]>("flickwerk", []);
  const [day, setDay] = useStored<string>("flicktag", "");
  const [edit, setEdit] = useState<Piece | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const open = pieces.filter((p) => !p.done).sort((a, b) => RANK[a.prio] - RANK[b.prio] || a.createdAt - b.createdAt);
  const done = pieces.filter((p) => p.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));

  const save = () => {
    if (!edit) return;
    setPieces((p) => (isNew ? [...p, edit] : p.map((x) => (x.id === edit.id ? edit : x))));
    setEdit(null);
  };
  const Card = ({ p }: { p: Piece }) => (
    <button className={"fw-card" + (p.done ? " done" : "")} onClick={() => { setEdit({ ...p }); setIsNew(false); }}>
      {p.photo ? <img src={p.photo} alt="" /> : <span className="fw-nophoto"><Icon name="flickwerk" /></span>}
      <span className={"fw-prio " + p.prio}>{PRIOS.find((x) => x.id === p.prio)!.name}</span>
      {p.desc && <span className="fw-desc">{p.desc}</span>}
    </button>
  );

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <div className="card fw-day">
        <span className="fw-day-ic"><Icon name="kalender" /></span>
        <label className="fw-day-main">
          <small>Flicktag</small>
          <input type="date" className="sheet-in" value={day} min={todayISO()} onChange={(e) => setDay(e.target.value)} />
        </label>
        {day && open.length > 0 && <button className="icon-btn" onClick={() => icsDownload(day, open.length)} aria-label="Zum Kalender hinzufügen"><Icon name="kalender" /></button>}
      </div>

      <div className="fw-grid">
        <button className="fw-card fw-add" onClick={() => { setEdit({ id: crypto.randomUUID(), desc: "", prio: "mittel", done: false, createdAt: Date.now() }); setIsNew(true); }} aria-label="Kleidungsstück anlegen">
          <span>+</span>
        </button>
        {open.map((p) => <Card key={p.id} p={p} />)}
      </div>

      {done.length > 0 && (
        <>
          <FoldHead label={`Geflickt (${done.length})`} open={showDone} onToggle={() => setShowDone((v) => !v)} />
          {showDone && <div className="fw-grid">{done.map((p) => <Card key={p.id} p={p} />)}</div>}
        </>
      )}

      {edit && (
        <div className="sheet-bg" onClick={() => setEdit(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <button className="sheet-btn" onClick={() => setEdit(null)} aria-label="Abbrechen"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
              <span>{isNew ? "Neues Kleidungsstück" : "Kleidungsstück"}</span>
              <button className="sheet-btn ok" onClick={save} aria-label="Sichern"><Icon name="haken" /></button>
            </div>
            <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const photo = await shrink(f); setEdit((x) => (x ? { ...x, photo } : x)); e.target.value = "";
            }} />
            <button className="fw-card fw-photo" onClick={() => file.current?.click()} aria-label="Foto wählen">
              {edit.photo ? <img src={edit.photo} alt="" /> : <span className="fw-nophoto"><span>+</span><small>Foto</small></span>}
            </button>
            <div className="sheet-card">
              <textarea className="sheet-in" rows={3} value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} placeholder="Was muss geflickt werden?" />
            </div>
            <div className="sheet-label">Priorität</div>
            <div className="fw-prios">
              {PRIOS.map((p) => (
                <button key={p.id} className={"fw-prio-btn " + p.id + (edit.prio === p.id ? " on" : "")} onClick={() => setEdit({ ...edit, prio: p.id })}>{p.name}</button>
              ))}
            </div>
            {!isNew && (
              <>
                <button className="fw-done-btn" onClick={() => { setPieces((p) => p.map((x) => (x.id === edit.id ? { ...edit, done: !edit.done, doneAt: edit.done ? undefined : Date.now() } : x))); setEdit(null); }}>
                  {edit.done ? "Wieder offen" : "Geflickt"}
                </button>
                <button className="sheet-del" onClick={() => { setPieces((p) => p.filter((x) => x.id !== edit.id)); setEdit(null); }}>Kleidungsstück löschen</button>
              </>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
