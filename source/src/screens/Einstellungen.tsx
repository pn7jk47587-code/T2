import { Shell } from "../components/Shell";
import type { ModuleDef } from "../core/modules";
import { useStored } from "../core/db";
import type { Profile } from "../core/types";
import { defaultProfile } from "./Home";
import { getSkin, useNav, useSkin } from "../core/skins";

export function Einstellungen({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [profile, setProfile] = useStored<Profile>("profile", defaultProfile);
  const nav = useNav();
  const [homeMode, setHomeMode] = useStored<string>("homeMode", "kacheln");
  const skin = useSkin();

  return (
    <Shell mod={mod} back={back} emblem={false}>
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
        {profile.photo && (
          <button className="btn ghost small danger" onClick={() => setProfile((p) => ({ ...p, photo: undefined }))}>
            Profilbild entfernen
          </button>
        )}
      </div>

      <div className="section eyebrow">Stil</div>
      <button className="card row" style={{ width: "100%", textAlign: "left" }} onClick={() => nav("stile")}>
        <div>
          <div className="t">{getSkin(skin.id).name}</div>
        </div>
        <span className="chip">Ändern</span>
      </button>

      <button className="card row" style={{ width: "100%", textAlign: "left", marginTop: 8 }} onClick={() => nav("entwurf")}>
        <div className="t">Profilschild, Wappen, Symbole</div>
        <span className="chip">Entwurf</span>
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
