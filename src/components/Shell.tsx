import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { ModuleDef } from "../core/modules";

/** Gemeinsamer Rahmen aller Unterseiten: Zurück-Knopf, Titel, Emblem. */
export function Shell({ mod, back, children, emblem = true }: { mod: ModuleDef; back: () => void; children?: ReactNode; emblem?: boolean }) {
  return (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück">
          <Icon name="back" />
        </button>
        <h1>{mod.title}</h1>
      </div>
      {emblem && (
        <div className="emblem" style={{ "--a": mod.a, "--b": mod.b } as React.CSSProperties}>
          <Icon name={mod.icon} />
        </div>
      )}
      {children}
    </>
  );
}
