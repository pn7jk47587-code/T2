import { lazy, Suspense, useRef } from "react";
import { Icon } from "../components/Icon";
import { modules } from "../core/modules";
import { useStored } from "../core/db";
import type { Profile } from "../core/types";
import { resizeImage } from "../core/image";

const Schatzkammer = lazy(() => import("../components/Schatzkammer").then((m) => ({ default: m.Schatzkammer })));

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
  const [profile, setProfile] = useStored<Profile>("profile", defaultProfile);
  const [mottoIdx, setMottoIdx] = useStored<number>("mottoIdx", 0);
  const fileRef = useRef<HTMLInputElement>(null);

  const mottos = profile.mottos.filter((m) => m.trim());
  const motto = mottos.length ? mottos[mottoIdx % mottos.length] : "";

  async function pickPhoto(file?: File) {
    if (!file) return;
    const photo = await resizeImage(file, 512);
    setProfile((p) => ({ ...p, photo }));
  }

  return (
    <>
      <header className="profile">
        <button className="avatar-ring" onClick={() => fileRef.current?.click()} aria-label="Profilbild ändern">
          <div className="avatar">
            {profile.photo ? <img src={profile.photo} alt="" /> : <span>{(profile.name.trim()[0] || "?").toUpperCase()}</span>}
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
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

      <section className="card overview" aria-label="Tagesüberblick">
        <div className="overview-head">
          <h2>Tagesüberblick</h2>
          <span>{today()}</span>
        </div>
        <div className="metrics">
          {overviewItems.map((m) => (
            <div className="metric" key={m.id}>
              <b>–</b>
              <small>{m.label}</small>
            </div>
          ))}
        </div>
      </section>

      <Suspense fallback={null}>
        <Schatzkammer />
      </Suspense>

      <nav className="grid" aria-label="Module">
        {modules.map((m) => (
          <button
            key={m.id}
            className="tile"
            aria-label={m.title}
            title={m.title}
            style={{ "--a": m.a, "--b": m.b } as React.CSSProperties}
            onClick={() => go(m.id)}
          >
            <Icon name={m.icon} />
          </button>
        ))}
      </nav>
    </>
  );
}
