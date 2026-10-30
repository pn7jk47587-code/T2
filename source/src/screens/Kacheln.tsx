import { Icon } from "../components/Icon";
import { TILE_STYLES, TileFrame } from "../components/TileFrame";
import { modules } from "../core/modules";
import { useStored } from "../core/db";

/** Auswahl der Kachelgestaltung */
export function Kacheln({ back }: { back: () => void }) {
  const [tileStyle, setTileStyle] = useStored<string>("tileStyle", "siegel");
  const mods = modules.filter((m) => m.id !== "einstellungen").slice(0, 6);
  return (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Kacheln</h1>
      </div>
      <div className="list">
        {TILE_STYLES.map((t) => (
          <button key={t.id} className={"card kc-card" + (tileStyle === t.id ? " on" : "")} onClick={() => setTileStyle(t.id)}>
            <div className="kc-name">{t.name}</div>
            <div className="grid" data-tiles={t.id}>
              {mods.map((m) => (
                <div key={m.id} className="tile" style={{ "--a": "#fff" } as React.CSSProperties}>
                  <TileFrame style={t.id} />
                  <Icon name={m.icon} />
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
