import { Shell } from "../components/Shell";
import { getModule, type ModuleDef } from "../core/modules";
import { Icon } from "../components/Icon";
import { useStored } from "../core/db";
import type { Profile } from "../core/types";
import { defaultProfile } from "./Home";
import { getSkin, useNav, useSkin } from "../core/skins";

/** Schnellwahl: Reihenfolge Planung und Körper, dann Haushalt, dann Rückblick */
const QUICK = ["erinnerungen", "gefuehle", "zyklus", "befinden", "gewohnheiten", "finanzen", "fundorte", "flickwerk", "analytics", "archiv"];

export function Einstellungen({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [profile, setProfile] = useStored<Profile>("profile", defaultProfile);
  const nav = useNav();
  const [homeMode, setHomeMode] = useStored<string>("homeMode", "ruestung");
  const skin = useSkin();

  return (
    <Shell mod={mod} back={back} emblem={false}>
      <nav className="quick" aria-label="Schnellwahl">
        {QUICK.map((id) => {
          const m = getModule(id); if (!m) return null;
          return (
            <button key={id} className="quick-item" onClick={() => nav(id)}>
              <span className="quick-ic"><Icon name={m.icon} /></span>
              <small>{m.title}</small>
            </button>
          );
        })}
        <button className="quick-item" onClick={() => nav("ruestkammer")}>
          <span className="quick-ic"><Icon name="helm" /></span>
          <small>Rüstkammer</small>
        </button>
      </nav>

      <div className="section eyebrow">Profil</div>
      <div className="card" style={{ padding: 16 }}>
        <div className="field">
          <label>NAME</label>
          <input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div className="field">
          <label>SPRÜCHE (EINER PRO ZEILE)</label>
          <textarea
            className="input"
            rows={4}
            value={profile.mottos.join("\n")}
            onChange={(e) => setProfile((p) => ({ ...p, mottos: e.target.value.split("\n") }))}
            placeholder={"Erster Spruch\nZweiter Spruch"}
          />
        </div>
      </div>

      <div className="section eyebrow">Anwendungsgewandung</div>
      <button className="card row" style={{ width: "100%", textAlign: "left" }} onClick={() => nav("stile")}>
        <div>
          <div className="t">{getSkin(skin.id).name}</div>
        </div>
        <span className="chip">Ändern</span>
      </button>

      <button className="card row" style={{ width: "100%", textAlign: "left", marginTop: 8 }} onClick={() => nav("entwurf")}>
        <div className="t">Wappenformen, Symbole</div>
        <span className="chip">Entwurf</span>
      </button>

      <button className="card row" style={{ width: "100%", textAlign: "left", marginTop: 8 }} onClick={() => nav("kacheln")}>
        <div className="t">Kacheln</div>
        <span className="chip">Ändern</span>
      </button>
      <button className="card row" style={{ width: "100%", textAlign: "left", marginTop: 8 }} onClick={() => nav("wappen")}>
        <div className="t">Wappen</div>
        <span className="chip">Gestalten</span>
      </button>

      <div className="section eyebrow">Startseite</div>
      <div className="chips">
        {[["kacheln", "Kacheln"], ["ruestung", "Rüstung"]].map(([id, label]) => (
          <button key={id} className={"chip" + (homeMode === id ? " ok" : "")} onClick={() => setHomeMode(id)}>{label}</button>
        ))}
      </div>

    </Shell>
  );
}
