import type { ReactElement } from "react";
import { useSkin, type IconSet } from "../core/skins";

/** Symbolsätze: Schlüssel ist die Modul-ID. Jeder Stil wählt einen Satz. */
const magie: Record<string, ReactElement> = {
  zyklus: (
    <>
      <path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7Z" />
      <path d="M17 3.5v3M15.5 5h3M20.5 9v2M19.5 10h2" />
    </>
  ),
  erinnerungen: (
    <>
      <path d="M6.5 3h11M6.5 21h11" />
      <path d="M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9" />
      <path d="M10.2 18.2h3.6" />
    </>
  ),
  gefuehle: (
    <>
      <path d="M10 3h4M10.5 3v5L6.2 16.2A3.6 3.6 0 0 0 9.4 21.5h5.2a3.6 3.6 0 0 0 3.2-5.3L13.5 8V3" />
      <path d="M8 15h8" />
      <path d="M10.8 18.2h.01M13.4 17.2h.01" />
    </>
  ),
  gewohnheiten: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4-3-6.5-7.5-6.5 0 4.2 2.8 6.5 7.5 6.5Z" />
      <path d="M12 14.5c0-3.4 2.5-5.5 6.5-5.5 0 3.6-2.4 5.5-6.5 5.5Z" />
    </>
  ),
  finanzen: (
    <>
      <path d="M9 3.5 10.6 6h2.8L15 3.5" />
      <path d="M10.6 6C6.2 8.6 4 11.8 4 15c0 3.5 3.4 6 8 6s8-2.5 8-6c0-3.2-2.2-6.4-6.6-9" />
      <circle cx="12" cy="15" r="2.6" />
    </>
  ),
  fundorte: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M18 12v3.2M21 12v2.4" />
    </>
  ),
  analytics: (
    <>
      <circle cx="12" cy="10" r="6.5" />
      <path d="M8.2 9.2A3.8 3.8 0 0 1 10.6 6.6" />
      <path d="M7.2 16.8 6 20.5h12l-1.2-3.7M9 20.5h6" />
      <path d="M13.5 8v3M12 9.5h3" />
    </>
  ),
  archiv: (
    <>
      <path d="M8 4h10a2 2 0 0 1 2 2v1.5h-3M8 4a2.5 2.5 0 0 0-2.5 2.5V17A3 3 0 0 0 8.5 20H17a2 2 0 0 0 2-2V7.5" />
      <path d="M9.5 10.5h6M9.5 14h4" />
    </>
  ),
  einstellungen: (
    <>
      <path d="M4.5 19.5 15 9" />
      <path d="M17.5 3v4M15.5 5h4" />
      <path d="M20.5 10v2.5M19.2 11.2h2.6M9.5 3.5v2M8.5 4.5h2" />
    </>
  ),
};

const ritter: Record<string, ReactElement> = {
  zyklus: (
    <>
      <path d="M7 4h10c0 4-1.5 6-5 6S7 8 7 4Z" />
      <path d="M12 10v7M8.5 20h7M10 17h4" />
    </>
  ),
  erinnerungen: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  gefuehle: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.5 7.5 9 4.3-1.5 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="M12 15.5c-2.3-1.4-3.2-2.6-3.2-3.8a1.8 1.8 0 0 1 3.2-1.1 1.8 1.8 0 0 1 3.2 1.1c0 1.2-.9 2.4-3.2 3.8Z" />
    </>
  ),
  gewohnheiten: (
    <>
      <path d="M20.5 3.5 10 14M17.5 3.5h3v3" />
      <path d="m8 12 4 4M10 14l-4.5 4.5" />
      <circle cx="5" cy="19" r="1" />
    </>
  ),
  finanzen: (
    <>
      <path d="M3.5 9 6 17h12l2.5-8-4.5 3.5L12 5 8 12.5 3.5 9Z" />
      <path d="M6.5 20h11" />
    </>
  ),
  fundorte: (
    <>
      <path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" />
      <path d="M4 11h16v8H4v-8ZM12 11v3M10.5 14h3" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 20V9l2-1V5h2v2h2V5h2v2h2V5h2v3l2 1v11" />
      <path d="M5 20h14M10 20v-4a2 2 0 0 1 4 0v4" />
    </>
  ),
  archiv: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5V4.5Z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6M9 10h4" />
    </>
  ),
  einstellungen: (
    <>
      <path d="M5 14a7 7 0 0 1 14 0v5H5v-5Z" />
      <path d="M9 14h6M12 7v7" />
    </>
  ),
};

const tech: Record<string, ReactElement> = {
  zyklus: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 0 0 16M12 4v16" />
    </>
  ),
  erinnerungen: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.8" />
    </>
  ),
  gefuehle: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  gewohnheiten: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8 12 2.7 2.7L16 9.5" />
    </>
  ),
  finanzen: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  fundorte: (
    <>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 12h.01" />
    </>
  ),
  analytics: <path d="M5 20V12M11 20V5M17 20v-9M3 20.5h18" />,
  archiv: <path d="m12 3 9 5-9 5-9-5 9-5ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5" />,
  einstellungen: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4" />,
};

const sets: Record<IconSet, Record<string, ReactElement>> = { magie, ritter, tech };

const shared: Record<string, ReactElement> = {
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7" />,
};

export function Icon({ name }: { name: string }) {
  const skin = useSkin();
  const body = shared[name] ?? sets[skin.icons][name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="var(--icon-sw, 1.5)"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {body}
    </svg>
  );
}
