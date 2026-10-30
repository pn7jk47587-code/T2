import { Icon } from "../components/Icon";
import { useStored } from "../core/db";
import { CHARGES, CHARGE_NAMES, CoatOfArms, DEFAULT_ARMS, DIVISIONS, TINCTURES } from "../core/heraldry";
import { SHIELDS } from "../core/shields";
import type { Arms } from "../core/types";

/** Wappen gestalten: Form, Teilung, Farben, Wappenbild. */
export function Wappen({ back }: { back: () => void }) {
  const [arms, setArms] = useStored<Arms>("wappen", DEFAULT_ARMS);
  const set = (p: Partial<Arms>) => setArms((a) => ({ ...a, ...p }));

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <>
      <div className="section eyebrow">{label}</div>
      <div className="wp-row">{children}</div>
    </>
  );
  const Swatches = ({ value, onPick }: { value: string; onPick: (id: string) => void }) => (
    <>
      {TINCTURES.map((t) => (
        <button key={t.id} className={"wp-sw" + (value === t.id ? " on" : "")} style={{ background: t.hex }} onClick={() => onPick(t.id)} aria-label={t.name} title={t.name} />
      ))}
    </>
  );

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Wappen</h1>
      </div>
      <div className="wp-preview"><CoatOfArms arms={arms} /></div>

      <Row label="Form">
        {SHIELDS.map((s) => (
          <button key={s.id} className={"wp-opt" + (arms.shape === s.id ? " on" : "")} onClick={() => set({ shape: s.id })} aria-label={s.name}>
            <CoatOfArms arms={{ ...arms, shape: s.id }} />
          </button>
        ))}
      </Row>
      <Row label="Teilung">
        {DIVISIONS.map((d) => (
          <button key={d.id} className={"wp-opt" + (arms.division === d.id ? " on" : "")} onClick={() => set({ division: d.id })} aria-label={d.name}>
            <CoatOfArms arms={{ ...arms, division: d.id, charge: "keins" }} />
          </button>
        ))}
      </Row>
      <Row label="Feld"><Swatches value={arms.c1} onPick={(c1) => set({ c1 })} /></Row>
      <Row label="Teilungsfarbe"><Swatches value={arms.c2} onPick={(c2) => set({ c2 })} /></Row>
      <Row label="Wappenbild">
        {Object.keys(CHARGES).map((c) => (
          <button key={c} className={"wp-opt" + (arms.charge === c ? " on" : "")} onClick={() => set({ charge: c })} aria-label={CHARGE_NAMES[c] ?? c}>
            <CoatOfArms arms={{ ...arms, charge: c }} />
          </button>
        ))}
      </Row>
      <Row label="Farbe des Wappenbilds"><Swatches value={arms.cc} onPick={(cc) => set({ cc })} /></Row>
    </>
  );
}
