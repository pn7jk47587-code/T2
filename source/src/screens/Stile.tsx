import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Backdrop } from "../components/Scenery";
import { Home } from "./Home";
import { skins, SkinCtx, type Skin } from "../core/skins";

const W = 390;
const H = 900;

/** Maßstabsgetreue Miniatur der Startseite im jeweiligen Stil. */
function Preview({ skin }: { skin: Skin }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / W));
    ro.observe(el);
    setScale(el.clientWidth / W);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="pv" data-skin={skin.id} style={{ height: H * scale }}>
      <div className="pv-inner" data-skin={skin.id} style={{ width: W, height: H, transform: `scale(${scale})` }}>
        <SkinCtx.Provider value={skin}>
          <Backdrop inner skinId={skin.id} />
          <div className="app pv-app">
            <Home go={() => {}} />
          </div>
        </SkinCtx.Provider>
      </div>
    </div>
  );
}

export function Stile({ back, current, choose }: { back: () => void; current: string; choose: (id: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={back} aria-label="Zurück">
          <Icon name="back" />
        </button>
        <h1>Stile</h1>
      </div>
      <div className="carousel" ref={scroller}>
        {skins.map((s) => (
          <div className="slide" key={s.id}>
            <div className="slide-head">
              <div>
                <div className="slide-name">{s.name}</div>
              </div>
              <button className={"btn small" + (current === s.id ? " ghost" : "")} onClick={() => choose(s.id)}>
                {current === s.id ? "Aktiv" : "Wählen"}
              </button>
            </div>
            <Preview skin={s} />
          </div>
        ))}
      </div>
    </>
  );
}
