import { ICONS, UI_ICONS } from "../core/icons";

export function Icon({ name }: { name: string }) {
  const d = UI_ICONS[name] ?? ICONS[name] ?? [];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-sw, 1.5)" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
