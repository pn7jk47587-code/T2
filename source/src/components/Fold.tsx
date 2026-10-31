/** Einklappbare Überschrift: Pfeil rechts am Rand */
export function FoldHead({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="section eyebrow fold-head" onClick={onToggle} aria-expanded={open}>
      <span>{label}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={open ? "open" : ""}><path d="M9 5l7 7-7 7" /></svg>
    </button>
  );
}
