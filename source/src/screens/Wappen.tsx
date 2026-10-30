import { useState } from "react";
import { Icon } from "../components/Icon";
import { useStored } from "../core/db";
import { CHARGES, CoatOfArms, DEFAULT_ARMS, DIVISIONS, TINCTURES } from "../core/heraldry";
import { SHIELDS } from "../core/shields";
import type { Arms } from "../core/types";

const STEPS = ["Form", "Teilung", "Symbol", "Farben"] as const;

function Swatches({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  return (
    <div className="wp-sws">
      {TINCTURES.map((t) => (
        <button key={t.id} type="button" className={"wp-sw" + (value === t.id ? " on" : "")} style={{ background: t.hex }} onClick={() => onPick(t.id)} aria-label={t.name} title={t.name} />
      ))}
    </div>
  );
}

/** Wappen in vier Schritten: Form, Teilung, Symbol, Farben. */
export function Wappen({ back }: { back: () => void }) {
  const [arms, setArms] = useStored<Arms>("wappen", DEFAULT_ARMS);
  const [step, setStep] = useState(0);
  const set = (p: Partial<Arms>) => setArms((a) => ({ ...a, ...p }));
  const a: Arms = { ...DEFAULT_ARMS, ...arms };

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Wappen</h1>
      </div>

      <div className="wp-steps">
        {STEPS.map((s, i) => (
          <button key={s} type="button" className={"wp-step" + (i === step ? " on" : "") + (i < step ? " past" : "")} onClick={() => setStep(i)}>
            <span>{i + 1}</span>{s}
          </button>
        ))}
      </div>

      <div className="wp-preview"><CoatOfArms arms={a} /></div>

      {step === 0 && (
        <div className="wp-grid">
          {SHIELDS.map((s) => (
            <button key={s.id} type="button" className={"wp-opt" + (a.shape === s.id ? " on" : "")} onClick={() => set({ shape: s.id })}>
              <CoatOfArms arms={{ ...a, shape: s.id, division: "einfarbig", charge: "keins" }} />
              <small>{s.name}</small>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="wp-grid">
          {DIVISIONS.map((d) => (
            <button key={d.id} type="button" className={"wp-opt" + (a.division === d.id ? " on" : "")} onClick={() => set({ division: d.id })}>
              <CoatOfArms arms={{ ...a, division: d.id, charge: "keins" }} />
              <small>{d.name}</small>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="wp-grid">
          {CHARGES.map((c) => (
            <button key={c.id} type="button" className={"wp-opt" + (a.charge === c.id ? " on" : "")} onClick={() => set({ charge: c.id })}>
              <CoatOfArms arms={{ ...a, charge: c.id }} />
              <small>{c.name}</small>
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ padding: "6px 14px 14px" }}>
          <div className="section eyebrow">Feld</div>
          <Swatches value={a.c1} onPick={(c1) => set({ c1 })} />
          {a.division !== "einfarbig" && (
            <>
              <div className="section eyebrow">Teilung</div>
              <Swatches value={a.c2} onPick={(c2) => set({ c2 })} />
            </>
          )}
          {a.charge !== "keins" && (
            <>
              <div className="section eyebrow">Symbol</div>
              <Swatches value={a.cc} onPick={(cc) => set({ cc })} />
            </>
          )}
          <div className="section eyebrow">Rand</div>
          <Swatches value={a.bc ?? "silber"} onPick={(bc) => set({ bc })} />
        </div>
      )}

      <div className="wp-nav">
        {step > 0 ? <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>Zurück</button> : <span />}
        {step < STEPS.length - 1
          ? <button type="button" className="btn" onClick={() => setStep(step + 1)}>Weiter</button>
          : <button type="button" className="btn" onClick={back}>Fertig</button>}
      </div>
    </>
  );
}
