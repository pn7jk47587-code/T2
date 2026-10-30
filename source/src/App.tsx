import { lazy, Suspense, useEffect, useState } from "react";
import { Home } from "./screens/Home";
import { Stile } from "./screens/Stile";
import { screenFor } from "./screens";
import { getModule } from "./core/modules";
import { useStored } from "./core/db";
import { Backdrop, Particles } from "./components/Scenery";
import { applyFont } from "./core/fonts";
import { Entwurf } from "./screens/Entwurf";
import { getSkin, NavCtx, SkinCtx } from "./core/skins";

const Ruestkammer = lazy(() => import("./screens/Ruestkammer").then((m) => ({ default: m.Ruestkammer })));

/**
 * Einfache Navigation. Der Zustand liegt in React, der Hash (#fundorte) spiegelt ihn nur.
 * Fällt der Hash aus, läuft die App trotzdem.
 */
function useRoute() {
  const read = () => {
    try {
      return location.hash.replace(/^#\/?/, "");
    } catch {
      return "";
    }
  };
  const [id, setId] = useState(read());
  useEffect(() => {
    const on = () => setId(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = (next: string) => {
    setId(next);
    try {
      location.hash = next;
    } catch {
      /* Hash nicht verfügbar */
    }
    document.getElementById("root")?.scrollTo(0, 0);
  };
  return [id, go] as const;
}

export default function App() {
  const [id, go] = useRoute();
  const [skinId, setSkinId] = useStored<string>("skin", "glanz");
  const [fontId, setFontId] = useStored<string>("font", "pirata");
  const [homeMode] = useStored<string>("homeMode", "kacheln");
  const skin = getSkin(skinId);

  useEffect(() => {
    document.documentElement.setAttribute("data-skin", skin.id);
  }, [skin.id]);
  useEffect(() => applyFont(fontId), [fontId]);

  const mod = id ? getModule(id) : undefined;
  const Screen = mod ? screenFor(mod.id) : null;

  return (
    <SkinCtx.Provider value={skin}>
      <NavCtx.Provider value={go}>
        {id === "ruestkammer" || (id === "" && homeMode === "ruestung") ? (
          <Suspense fallback={null}>
            <Ruestkammer back={id === "ruestkammer" ? () => go("einstellungen") : undefined} go={go} />
          </Suspense>
        ) : (
          <>
        <Backdrop skinId={skin.id} />
        <Particles mode={skin.particles} skinId={skin.id} />
        <div className="app">
          {id === "entwurf" ? (
            <Entwurf back={() => go("einstellungen")} font={fontId} chooseFont={setFontId} />
          ) : id === "stile" ? (
            <Stile back={() => go("einstellungen")} current={skin.id} choose={setSkinId} />
          ) : mod && Screen ? (
            <Screen mod={mod} back={() => go("")} />
          ) : (
            <Home go={go} />
          )}
        </div>
          </>
        )}
      </NavCtx.Provider>
    </SkinCtx.Provider>
  );
}
