import type { ReactElement } from "react";

/** Kachelrahmen: feine, mittelalterlich anmutende Fassungen statt massiver Platten (Raster 100 x 100). */
export const TILE_STYLES: { id: string; name: string }[] = [
  { id: "siegel", name: "Siegel" },
  { id: "gravur", name: "Gravur" },
  { id: "buchmalerei", name: "Buchmalerei" },
  { id: "spitzbogen", name: "Spitzbogen" },
  { id: "schild", name: "Schild" },
  { id: "raute", name: "Raute" },
  { id: "beschlag", name: "Beschlag" },
  { id: "frei", name: "Nur Symbol" },
];

const corner = (t: string) => (
  <g transform={t}>
    <path d="M7 27V7H27" />
    <path d="M12 22V12H22" strokeOpacity=".55" />
    <path d="M7 7l5 5" />
    <path d="M27 7c3 0 4 2 4 4M7 27c0 3 2 4 4 4" strokeOpacity=".7" />
  </g>
);

const FRAMES: Record<string, () => ReactElement> = {
  siegel: () => (
    <>
      <circle cx="50" cy="50" r="44" />
      <circle cx="50" cy="50" r="36" strokeOpacity=".6" />
      <g className="tf-acc" stroke="none">
        {Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return <circle key={i} cx={50 + 40 * Math.cos(a)} cy={50 + 40 * Math.sin(a)} r="1.1" />; })}
      </g>
    </>
  ),
  gravur: () => (
    <>
      {corner("")}
      {corner("translate(100 0) scale(-1 1)")}
      {corner("translate(0 100) scale(1 -1)")}
      {corner("translate(100 100) scale(-1 -1)")}
    </>
  ),
  buchmalerei: () => (
    <>
      <rect x="6" y="6" width="88" height="88" />
      <rect x="11" y="11" width="78" height="78" strokeOpacity=".55" />
      <g className="tf-acc" stroke="none">
        {[[8.5, 8.5], [91.5, 8.5], [8.5, 91.5], [91.5, 91.5]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 4.5}L${x + 4.5} ${y}L${x} ${y + 4.5}L${x - 4.5} ${y}Z`} />
        ))}
      </g>
      <path d="M50 6v-0M44 6h12M44 94h12M6 44v12M94 44v12" strokeWidth="2.4" />
    </>
  ),
  spitzbogen: () => (
    <>
      <path d="M16 95V46C16 26 31 11 50 5C69 11 84 26 84 46V95Z" />
      <path d="M22 95V48C22 31 35 18 50 13C65 18 78 31 78 48V95" strokeOpacity=".55" />
      <path d="M10 95H90" />
      <circle className="tf-acc" cx="50" cy="5" r="2.2" stroke="none" />
    </>
  ),
  schild: () => (
    <>
      <path d="M50 5L84 15V48C84 75 68 90 50 97C32 90 16 75 16 48V15Z" />
      <path d="M50 11L78 19V48C78 71 65 84 50 90C35 84 22 71 22 48V19Z" strokeOpacity=".5" />
    </>
  ),
  raute: () => (
    <>
      <path d="M50 4L96 50L50 96L4 50Z" />
      <path d="M50 12L88 50L50 88L12 50Z" strokeOpacity=".5" />
      <g className="tf-acc" stroke="none">{[[50, 4], [96, 50], [50, 96], [4, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" />)}</g>
    </>
  ),
  beschlag: () => (
    <>
      <path d="M8 14H92M8 86H92" strokeWidth="3.2" strokeOpacity=".75" />
      <path d="M8 19H92M8 81H92" strokeOpacity=".35" />
      <g stroke="none" className="tf-rivet">{[[14, 14], [50, 14], [86, 14], [14, 86], [50, 86], [86, 86]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.6" />)}</g>
    </>
  ),
  frei: () => <></>,
};

export function TileFrame({ style }: { style: string }) {
  const f = FRAMES[style];
  if (!f) return null;
  return (
    <svg className="tile-frame" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {f()}
    </svg>
  );
}
