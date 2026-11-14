import { useEffect, useMemo, useRef, useState } from "react";
import type { ModuleDef } from "../core/modules";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { useStored } from "../core/db";
import { GEBIETE, KLAUSUREN, type Klausur, type Uebung } from "../data/klausuren";
import { richtig, wink, zerlege, type Luecke, type Zeile } from "../core/formelbuch";

type Stand = Record<string, 0 | 1>;
type Fix = Record<string, string>;

const alle = (k: Klausur, us: Uebung[]) => us.flatMap((u) => zerlege(k, u).flatMap((z) => z.luecken));
const quote = (ls: Luecke[], st: Stand) => (ls.length ? ls.filter((l) => st[l.key] === 1).length / ls.length : 0);

function Siegel({ p, klein }: { p: number; klein?: boolean }) {
  const r = klein ? 15 : 44, c = 2 * Math.PI * r, s = klein ? 38 : 108;
  return (
    <svg className={"fb-siegel" + (klein ? " klein" : "")} width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <circle cx={s / 2} cy={s / 2} r={r} className="bahn" />
      <circle cx={s / 2} cy={s / 2} r={r} className="lauf" strokeDasharray={`${c * p} ${c}`} transform={`rotate(-90 ${s / 2} ${s / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{Math.round(p * 100)}</text>
    </svg>
  );
}

export function Formelbuch({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [stand, setStand] = useStored<Stand>("formelbuch", {});
  const [fix, setFix] = useStored<Fix>("formelbuch-fix", {});
  const [kid, setKid] = useState<string | null>(null);
  const [lauf, setLauf] = useState<{ us: Uebung[]; nur?: string[] } | null>(null);
  const k = KLAUSUREN.find((x) => x.id === kid) ?? null;

  const zurueck = () => (lauf ? setLauf(null) : k ? setKid(null) : back());

  if (k && lauf) return (
    <Shell mod={{ ...mod, title: k.titel }} back={zurueck} emblem={false}>
      <Abfrage key={lauf.us.map((u) => u.id).join() + (lauf.nur?.length ?? "")} k={k} us={lauf.us} nur={lauf.nur} fix={fix} setFix={setFix}
        merke={(key, v) => setStand((s) => ({ ...s, [key]: v }))} ende={() => setLauf(null)} nochmal={(nur) => setLauf({ us: lauf.us, nur })} />
    </Shell>
  );

  if (k) return (
    <Shell mod={{ ...mod, title: k.titel }} back={zurueck} emblem={false}>
      <p className="fb-unter">{k.unter}</p>
      <div className="fb-liste">
        {k.uebungen.map((u) => {
          const ls = alle(k, [u]);
          return (
            <button key={u.id} className="card fb-karte" onClick={() => setLauf({ us: [u] })}>
              <Siegel p={quote(ls, stand)} klein />
              <span><b>{u.titel}</b><small>{ls.length} Lücken</small></span>
              <Icon name="manicule" />
            </button>
          );
        })}
      </div>
      {k.uebungen.length > 1 && <button className="au-btn primary fb-ganz" onClick={() => setLauf({ us: k.uebungen })}>Von vorn bis hinten</button>}
      <p className="fb-quelle">{k.quelle ? `Nach: ${k.quelle}` : "Noch ohne Skript erstellt"}</p>
    </Shell>
  );

  return (
    <Shell mod={mod} back={zurueck}>
      {GEBIETE.map((g) => (
        <section key={g.id}>
          <div className="sheet-label">{g.titel}</div>
          <div className="fb-liste">
            {KLAUSUREN.filter((x) => x.gebiet === g.id).map((x) => (
              <button key={x.id} className="card fb-karte" onClick={() => setKid(x.id)}>
                <Siegel p={quote(alle(x, x.uebungen), stand)} klein />
                <span><b>{x.titel}</b><small>{x.unter}</small></span>
                <Icon name="manicule" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </Shell>
  );
}

function Abfrage({ k, us, nur, fix, setFix, merke, ende, nochmal }: {
  k: Klausur; us: Uebung[]; nur?: string[]; fix: Fix; setFix: (f: (x: Fix) => Fix) => void;
  merke: (key: string, v: 0 | 1) => void; ende: () => void; nochmal: (nur: string[]) => void;
}) {
  const blaetter = useMemo(() => us.map((u) => ({ u, zeilen: zerlege(k, u) })), [k, us]);
  const reihe = useMemo(() => blaetter.flatMap((b) => b.zeilen.flatMap((z) => z.luecken)).filter((l) => !nur || nur.includes(l.key)), [blaetter, nur]);
  const [i, setI] = useState(0);
  const [erg, setErg] = useState<Record<string, 0 | 1>>({});
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"frage" | "recht" | "fehl" | "gezeigt">("frage");
  const [tipp, setTipp] = useState(false);
  const [edit, setEdit] = useState<string | null>(null);
  const feld = useRef<HTMLInputElement>(null);
  const akt = reihe[i];
  const loesung = (l: Luecke) => (fix[l.key] ? [fix[l.key]] : l.antworten);

  useEffect(() => {
    document.querySelector(".fb-luecke.jetzt")?.scrollIntoView({ block: "center", behavior: "smooth" });
    if (phase === "frage") feld.current?.focus({ preventScroll: true });
  }, [i, phase]);

  const setze = (v: 0 | 1) => { setErg((e) => ({ ...e, [akt.key]: v })); merke(akt.key, v); };
  const pruefe = () => {
    if (!text.trim()) return;
    const ok = richtig(text, loesung(akt));
    setze(ok ? 1 : 0); setPhase(ok ? "recht" : "fehl");
  };
  const weiter = () => { setText(""); setTipp(false); setEdit(null); setPhase("frage"); setI((n) => n + 1); };

  if (!akt) {
    const n = reihe.length, r = reihe.filter((l) => erg[l.key] === 1).length, p = n ? r / n : 0;
    const fehler = reihe.filter((l) => erg[l.key] !== 1).map((l) => l.key);
    return (
      <div className="fb-ende">
        <Siegel p={p} />
        <h2>{p >= 0.9 ? "Meisterstück" : p >= 0.6 ? "Gesellenstück" : "Lehrstück"}</h2>
        <p>{r} von {n} Lücken saßen.</p>
        {fehler.length > 0 && <button className="au-btn primary" onClick={() => nochmal(fehler)}>Fehler wiederholen</button>}
        <button className="au-btn" onClick={ende}>Zurück zur Übersicht</button>
      </div>
    );
  }

  const zeile = (z: Zeile, n: number) => {
    const offen = z.luecken.some((l) => { const pos = reihe.indexOf(l); return pos > i || (pos === i && phase === "frage"); });
    return (
      <div key={n} className="fb-zeile" style={{ paddingLeft: z.ebene * 16 }}>
        <p>
          {z.teile.map((t, m) => {
            if ("t" in t) return <span key={m}>{t.t}</span>;
            const pos = reihe.indexOf(t.l);
            if (pos === -1) return <b key={m} className="fb-luecke fest">{loesung(t.l)[0]}</b>;
            if (pos < i || (pos === i && phase !== "frage")) return <b key={m} className={"fb-luecke " + (erg[t.l.key] === 1 ? "recht" : "fehl") + (pos === i ? " jetzt" : "")}>{loesung(t.l)[0]}</b>;
            if (pos === i) return <b key={m} className="fb-luecke jetzt offen">{tipp ? wink(loesung(t.l)[0]) : text || " ? "}</b>;
            return <i key={m} className="fb-luecke leer" />;
          })}
        </p>
        {z.tipp && !offen && <small>{z.tipp}</small>}
      </div>
    );
  };

  return (
    <div className="fb-lauf">
      <div className="fb-fortschritt"><i style={{ width: `${(i / reihe.length) * 100}%` }} /></div>
      {blaetter.map(({ u, zeilen }) => (
        <article key={u.id} className="fb-pergament">
          <h3>{u.titel}</h3>
          {u.fall && <p className="fb-fall">{u.fall}</p>}
          {zeilen.map(zeile)}
        </article>
      ))}

      <div className="fb-pult">
        <small className="fb-zahl">{i + 1} / {reihe.length}</small>
        {phase === "frage" ? (
          <>
            <input ref={feld} className="sheet-in fb-feld" value={text} placeholder="Antwort" autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pruefe()} />
            <div className="fb-knoepfe">
              <button className="bf-chip" onClick={() => setTipp(true)}>Wink</button>
              <button className="bf-chip" onClick={() => setPhase("gezeigt")}>Aufdecken</button>
              <button className="au-btn primary" disabled={!text.trim()} onClick={pruefe}>Prüfen</button>
            </div>
          </>
        ) : (
          <>
            <div className={"fb-urteil " + (phase === "recht" ? "recht" : phase === "fehl" ? "fehl" : "")}>
              <b>{phase === "recht" ? "Recht so" : phase === "fehl" ? "Gefehlt" : "Lösung"}</b>
              {edit === null ? <span>{loesung(akt).join(" oder ")}</span>
                : <input className="sheet-in fb-feld" value={edit} autoFocus onChange={(e) => setEdit(e.target.value)} />}
            </div>
            <div className="fb-knoepfe">
              {edit === null ? <button className="bf-chip" onClick={() => setEdit(loesung(akt)[0])}>Berichtigen</button>
                : <button className="bf-chip on" onClick={() => { const v = edit.trim(); setFix((f) => { const n = { ...f }; if (v) n[akt.key] = v; else delete n[akt.key]; return n; }); setEdit(null); }}>Sichern</button>}
              {phase === "fehl" && <button className="bf-chip" onClick={() => { setze(1); weiter(); }}>Zählt doch</button>}
              {phase === "gezeigt" ? (
                <>
                  <button className="au-btn" onClick={() => { setze(0); weiter(); }}>Nicht gewusst</button>
                  <button className="au-btn primary" onClick={() => { setze(1); weiter(); }}>Gewusst</button>
                </>
              ) : <button className="au-btn primary" autoFocus onClick={weiter}>Weiter</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
