import { Icon } from "./Icon";

/** Einklappbare Überschrift: Manicula rechts am Rand, zeigt geschlossen nach rechts, offen nach unten */
export function FoldHead({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="section eyebrow fold-head" onClick={onToggle} aria-expanded={open} aria-label={`${label} ${open ? "einklappen" : "ausklappen"}`}>
      <span>{label}</span>
      <span className={"fold-hand" + (open ? " open" : "")}><Icon name="manicule" /></span>
    </button>
  );
}
