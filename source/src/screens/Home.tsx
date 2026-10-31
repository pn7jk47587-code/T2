import { Icon } from "../components/Icon";
import { modules } from "../core/modules";
import { useStored } from "../core/db";
import { useOverviewValues } from "../core/overview";
import type { Profile } from "../core/types";
import { useSkin } from "../core/skins";
import { getShield } from "../core/shields";
import { useId } from "react";
import { CoatOfArms, DEFAULT_ARMS } from "../core/heraldry";
import { TileFrame } from "../components/TileFrame";
import type { Arms } from "../core/types";

export const defaultProfile: Profile = { name: "Dein Name", mottos: [] };

const overviewItems = [
  { id: "steps", label: "Schritte" },
  { id: "sleep", label: "Schlaf" },
  { id: "screen", label: "Bildschirmzeit" },
  { id: "route", label: "Wegstrecke" },
  ...modules.flatMap((m) => m.feeds),
];

function today() {
  return new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

export function Home({ go }: { go: (id: string) => void }) {
  const [profile] = useStored<Profile>("profile", defaultProfile);
  const [mottoIdx, setMottoIdx] = useStored<number>("mottoIdx", 0);
  const skin = useSkin();
  const ov = useOverviewValues();
  const [arms] = useStored<Arms>("wappen", DEFAULT_ARMS);
  const [tileStyle] = useStored<string>("tileStyle", "siegel");
  const gid = useId().replace(/:/g, "");
  const shield = skin.shield && tileStyle === "stil" ? getShield(skin.shield) : null;

  const mottos = profile.mottos.filter((m) => m.trim());
  const motto = mottos.length ? mottos[mottoIdx % mottos.length] : "";

  return (
    <>
      <header className="profile">
        <button className="arms-main" onClick={() => go("einstellungen")} aria-label="Erlasse">
          <CoatOfArms arms={arms} />
        </button>
        <h1>{profile.name}</h1>
        <button
          className={"motto" + (motto ? "" : " placeholder")}
          onClick={() => mottos.length > 1 && setMottoIdx((mottoIdx + 1) % mottos.length)}
        >
          {motto || "Hier steht bald dein Spruch"}
        </button>
        {mottos.length > 1 && (
          <div className="motto-dots" aria-hidden="true">
            {mottos.map((_, i) => (
              <i key={i} className={i === mottoIdx % mottos.length ? "on" : ""} />
            ))}
          </div>
        )}
      </header>

      <section className="card overview" aria-label="Tageslosung">
        <div className="overview-head">
          <h2>Tageslosung</h2>
          <span>{today()}</span>
        </div>
        <div className="metrics">
          {overviewItems.map((m) => (
            <div className="metric" key={m.id}>
              <b>{ov[m.id] ?? "–"}</b>
              <small>{m.label}</small>
            </div>
          ))}
        </div>
      </section>

      <nav className="grid" aria-label="Module" data-tiles={tileStyle}>
        {modules.filter((m) => m.id !== "einstellungen").map((m) => (
          <button
            key={m.id}
            className={"tile" + (shield ? " shielded" : "")}
            aria-label={m.title}
            title={m.title}
            style={{ "--a": m.a, "--b": m.b } as React.CSSProperties}
            onClick={() => go(m.id)}
          >
            {shield && (
              <svg className="tile-shield" viewBox="0 0 100 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                  <linearGradient id={gid + m.id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" style={{ stopColor: "var(--shield-a)" }} />
                    <stop offset=".45" style={{ stopColor: "var(--shield-b)" }} />
                    <stop offset=".6" style={{ stopColor: "var(--shield-c)" }} />
                    <stop offset="1" style={{ stopColor: "var(--shield-b)" }} />
                  </linearGradient>
                </defs>
                <path d={shield.d} fill={`url(#${gid + m.id})`} stroke="var(--shield-stroke)" strokeWidth="1.5" />
                <path d={shield.d} fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1" transform="translate(50 60) scale(.9) translate(-50 -60)" />
              </svg>
            )}
            <TileFrame style={tileStyle} />
            <Icon name={m.icon} />
          </button>
        ))}
      </nav>
    </>
  );
}
