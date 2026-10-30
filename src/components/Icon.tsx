import type { ReactElement } from "react";

const paths: Record<string, ReactElement> = {
  moon: (
    <>
      <path d="M19.5 14.2A8 8 0 0 1 9.8 4.5a8 8 0 1 0 9.7 9.7Z" />
      <path d="M17 3.5v3M15.5 5h3M20.5 9v2M19.5 10h2" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6.5 3h11M6.5 21h11" />
      <path d="M7.5 3c0 5 4.5 6 4.5 9s-4.5 4-4.5 9M16.5 3c0 5-4.5 6-4.5 9s4.5 4 4.5 9" />
      <path d="M10.2 18.2h3.6" />
    </>
  ),
  potion: (
    <>
      <path d="M10 3h4M10.5 3v5L6.2 16.2A3.6 3.6 0 0 0 9.4 21.5h5.2a3.6 3.6 0 0 0 3.2-5.3L13.5 8V3" />
      <path d="M8 15h8" />
      <path d="M10.8 18.2h.01M13.4 17.2h.01" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4-3-6.5-7.5-6.5 0 4.2 2.8 6.5 7.5 6.5Z" />
      <path d="M12 14.5c0-3.4 2.5-5.5 6.5-5.5 0 3.6-2.4 5.5-6.5 5.5Z" />
    </>
  ),
  pouch: (
    <>
      <path d="M9 3.5 10.6 6h2.8L15 3.5" />
      <path d="M10.6 6C6.2 8.6 4 11.8 4 15c0 3.5 3.4 6 8 6s8-2.5 8-6c0-3.2-2.2-6.4-6.6-9" />
      <circle cx="12" cy="15" r="2.6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M18 12v3.2M21 12v2.4" />
      <path d="M8 12h.01" />
    </>
  ),
  orb: (
    <>
      <circle cx="12" cy="10" r="6.5" />
      <path d="M8.2 9.2A3.8 3.8 0 0 1 10.6 6.6" />
      <path d="M7.2 16.8 6 20.5h12l-1.2-3.7M9 20.5h6" />
      <path d="M13.5 8v3M12 9.5h3" />
    </>
  ),
  scroll: (
    <>
      <path d="M8 4h10a2 2 0 0 1 2 2v1.5h-3M8 4a2.5 2.5 0 0 0-2.5 2.5V17A3 3 0 0 0 8.5 20H17a2 2 0 0 0 2-2V7.5" />
      <path d="M9.5 10.5h6M9.5 14h4" />
    </>
  ),
  wand: (
    <>
      <path d="M4.5 19.5 15 9" />
      <path d="M15 9l1.5-1.5" />
      <path d="M17.5 3v4M15.5 5h4" />
      <path d="M20.5 10v2.5M19.2 11.2h2.6M9.5 3.5v2M8.5 4.5h2" />
    </>
  ),
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7" />,
};

export function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
