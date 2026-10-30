import { useId } from "react";
import { Icon } from "../components/Icon";
import { FONTS } from "../core/fonts";
import { SHIELDS } from "../core/shields";
import { ICONS } from "../core/icons";
import { modules } from "../core/modules";
import { useStored } from "../core/db";
import type { Profile } from "../core/types";

/** Designentwurf: Frakturschriften, Wappenformen, Symbole, Bedienelemente. */
export function Entwurf({ back, font, chooseFont }: { back: () => void; font: string; chooseFont: (id: string) => void }) {
  const [profile] = useStored<Profile>("profile", { name: "Dein Name", mottos: [] });
  const gid = useId().replace(/:/g, "");
  const ids = Object.keys(ICONS);

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Entwurf</h1>
      </div>

      <div className="section eyebrow">Schrift</div>
      <div className="list">
        {FONTS.map((f) => (
          <button key={f.id} className={"card ew-font" + (font === f.id ? " on" : "")} onClick={() => chooseFont(f.id)}>
            <span className="ew-font-name">{f.name}</span>
            <span className="ew-font-big" style={{ fontFamily: f.family, fontWeight: f.weight }}>{profile.name}</span>
            <span className="ew-font-small" style={{ fontFamily: f.family, fontWeight: f.weight }}>Tagesüberblick · Gefühle · Rüstkammer</span>
            <span className="ew-font-small" style={{ fontFamily: f.family, fontWeight: f.weight }}>ÄÖÜ äöü ß 1555</span>
          </button>
        ))}
      </div>

      <div className="section eyebrow">Wappenformen</div>
      <div className="ew-shields">
        {SHIELDS.map((sh, i) => (
          <div key={sh.id} className="ew-shield">
            <svg viewBox="0 0 100 120" aria-hidden="true">
              <defs>
                <linearGradient id={gid + sh.id} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f6f7f9" /><stop offset=".45" stopColor="#9aa1a8" /><stop offset=".6" stopColor="#e3e6e9" /><stop offset="1" stopColor="#8a9097" />
                </linearGradient>
                <clipPath id={gid + sh.id + "c"}><path d={sh.d} /></clipPath>
              </defs>
              <path d={sh.d} fill={`url(#${gid + sh.id})`} />
              <g clipPath={`url(#${gid + sh.id}c)`}>
                {i % 4 === 0 && <rect x="0" y="0" width="100" height="40" fill="#8e1a2e" />}
                {i % 4 === 1 && <rect x="50" y="0" width="50" height="120" fill="#8e1a2e" />}
                {i % 4 === 2 && <path d="M0 0H100L0 120Z" fill="#8e1a2e" />}
                {i % 4 === 3 && <rect x="38" y="0" width="24" height="120" fill="#8e1a2e" />}
              </g>
              <path d={sh.d} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.5" />
              <g transform="translate(32 40) scale(1.5)" fill="none" stroke="#141517" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[ids[i % ids.length]].map((d, k) => <path key={k} d={d} />)}
              </g>
            </svg>
            <span>{sh.name}</span>
          </div>
        ))}
      </div>

      <div className="section eyebrow">Symbole</div>
      <div className="grid">
        {modules.map((m) => (
          <div key={m.id} className="tile" style={{ "--a": "#fff" } as React.CSSProperties}>
            <Icon name={m.icon} />
          </div>
        ))}
      </div>

      <div className="section eyebrow">Als Rune</div>
      <div className="ew-runes">
        {modules.map((m) => (
          <svg key={m.id} viewBox="0 0 24 24" className="ew-rune" aria-hidden="true">
            {ICONS[m.icon].map((d, k) => <path key={k} d={d} />)}
          </svg>
        ))}
      </div>

      <div className="section eyebrow">Bedienelemente</div>
      <div className="card" style={{ padding: 16 }}>
        <div className="actions">
          <button className="btn ew-silber">Öffnen</button>
          <button className="btn ew-burgund">Öffnen</button>
          <button className="btn ew-schlicht">Öffnen</button>
        </div>
        <div className="chips" style={{ marginTop: 14 }}>
          <span className="chip ew-chip-silber">Silber</span>
          <span className="chip ew-chip-burgund">Burgund</span>
          <span className="chip">Schlicht</span>
        </div>
      </div>
    </>
  );
}
