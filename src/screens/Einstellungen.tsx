import { useRef } from "react";
import { Shell } from "../components/Shell";
import type { ModuleDef } from "../core/modules";
import { kvAll, kvSet, useStored } from "../core/db";
import { sources, statusLabel } from "../core/sources";
import type { Profile } from "../core/types";
import { defaultProfile } from "./Home";

export type ThemePref = "auto" | "light" | "dark";

export function Einstellungen({ mod, back }: { mod: ModuleDef; back: () => void }) {
  const [profile, setProfile] = useStored<Profile>("profile", defaultProfile);
  const [theme, setTheme] = useStored<ThemePref>("theme", "auto");
  const importRef = useRef<HTMLInputElement>(null);

  async function exportData() {
    const data = await kvAll();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `app-royal-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Record<string, unknown>;
      await Promise.all(Object.entries(data).map(([k, v]) => kvSet(k, v)));
      location.reload();
    } catch {
      alert("Die Datei konnte nicht gelesen werden.");
    }
  }

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

      <div className="section eyebrow">Darstellung</div>
      <div className="chips">
        {(["auto", "light", "dark"] as ThemePref[]).map((t) => (
          <button key={t} className={"chip" + (theme === t ? " ok" : "")} onClick={() => setTheme(t)}>
            {t === "auto" ? "Automatisch" : t === "light" ? "Hell" : "Dunkel"}
          </button>
        ))}
      </div>

      <div className="section eyebrow">Datenquellen</div>
      <div className="list">
        {sources.map((s) => (
          <div className="card row" key={s.id} style={{ alignItems: "flex-start" }}>
            <div>
              <div className="t">{s.label}</div>
              <div className="s">{s.provides}</div>
            </div>
            <span className={"chip" + (s.status === "bereit" ? " ok" : "")} style={{ whiteSpace: "nowrap" }}>
              {statusLabel[s.status]}
            </span>
          </div>
        ))}
      </div>

      <div className="section eyebrow">Sicherung</div>
      <div className="card" style={{ padding: 16 }}>
        <div className="actions">
          <button className="btn small" onClick={exportData}>Sicherung speichern</button>
          <button className="btn ghost small" onClick={() => importRef.current?.click()}>Sicherung laden</button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </div>
      </div>
    </Shell>
  );
}
