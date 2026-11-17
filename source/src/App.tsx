import { lazy, Suspense, useEffect, useState } from "react";
import { Home } from "./screens/Home";
import { screenFor } from "./screens";
import { getModule } from "./core/modules";
import { useStored } from "./core/db";
import { Backdrop, Particles } from "./components/Scenery";
import { Jetzt } from "./components/Jetzt";
import { applyFont } from "./core/fonts";
import { getSkin, NavCtx, SkinCtx } from "./core/skins";

const Stile = lazy(() => import("./screens/Stile").then((m) => ({ default: m.Stile })));
const Entwurf = lazy(() => import("./screens/Entwurf").then((m) => ({ default: m.Entwurf })));
const Wappen = lazy(() => import("./screens/Wappen").then((m) => ({ default: m.Wappen })));
const Kacheln = lazy(() => import("./screens/Kacheln").then((m) => ({ default: m.Kacheln })));
const Ruestkammer = lazy(() => import("./screens/Ruestkammer").then((m) => ({ default: m.Ruestkammer })));

/**
 * Einfache Navigation. Der Zustand liegt in React, der Hash (#fundorte) spiegelt ihn nur.
 * Fällt der Hash aus, läuft die App trotzdem.
 */
function useRoute() {
  const read = () => {
    try {
      return location.hash.replace(/^#\/?/, "").split("?")[0];
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
  const [skinId, setSkinId, skinReady] = useStored<string>("skin", "glanz");
  const [homeMode, , homeReady] = useStored<string>("homeMode", "ruestung");
  const skin = getSkin(skinId);

  useEffect(() => {
    document.documentElement.setAttribute("data-skin", skin.id);
  }, [skin.id]);
  useEffect(() => applyFont(), []);

  const mod = id ? getModule(id) : undefined;
  const Screen = mod ? screenFor(mod.id) : null;

  return (
    <SkinCtx.Provider value={skin}>
      <NavCtx.Provider value={go}>
        <Jetzt />
        {!skinReady || (id === "" && !homeReady) ? null : id === "ruestkammer" || (id === "" && homeMode === "ruestung") ? (
          <Suspense fallback={null}>
            <Ruestkammer back={id === "ruestkammer" ? () => go("einstellungen") : undefined} go={go} />
          </Suspense>
        ) : (
          <>
        <Backdrop skinId={skin.id} />
        <Particles mode={skin.particles} skinId={skin.id} />
        <div className="app">
          <Suspense fallback={null}>
          {id === "kacheln" ? (
            <Kacheln back={() => go("einstellungen")} />
          ) : id === "wappen" ? (
            <Wappen back={() => go("einstellungen")} />
          ) : id === "entwurf" ? (
            <Entwurf back={() => go("einstellungen")} />
          ) : id === "stile" ? (
            <Stile back={() => go("einstellungen")} current={skin.id} choose={setSkinId} />
          ) : mod && Screen ? (
            <Screen mod={mod} back={() => go("")} />
          ) : (
            <Home go={go} />
          )}
          </Suspense>
        </div>
          </>
        )}
      </NavCtx.Provider>
    </SkinCtx.Provider>
  );
}
