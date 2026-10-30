import { useEffect, useState } from "react";
import { Home } from "./screens/Home";
import { screenFor } from "./screens";
import { getModule } from "./core/modules";
import { useStored } from "./core/db";
import { Scenery } from "./components/Scenery";
import type { ThemePref } from "./screens/Einstellungen";

/**
 * Einfache Navigation. Der Zustand liegt in React, der Hash (#fundorte) spiegelt ihn nur,
 * damit Zurück-Taste und Lesezeichen funktionieren. Fällt der Hash aus, läuft die App trotzdem.
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
    window.scrollTo(0, 0);
  };
  return [id, go] as const;
}

export default function App() {
  const [id, go] = useRoute();
  const [theme] = useStored<ThemePref>("theme", "auto");

  useEffect(() => {
    if (theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const mod = id ? getModule(id) : undefined;
  const Screen = mod ? screenFor(mod.id) : null;

  return (
    <>
      <Scenery />
      <div className="app">
        {mod && Screen ? <Screen mod={mod} back={() => go("")} /> : <Home go={go} />}
      </div>
    </>
  );
}
