import { useEffect, useRef, useState, type ReactNode } from "react";

/** Liste, deren Reihenfolge per langem Drücken und Ziehen geändert wird. */
export function SortList<T>({ items, keyOf, render, onReorder, onTap, className }: {
  items: T[]; keyOf: (t: T) => string; render: (t: T) => ReactNode; onReorder: (next: T[]) => void; onTap: (t: T) => void; className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ i: number; dy: number; h: number } | null>(null);
  const st = useRef<{ i: number; y: number; timer: number; active: boolean; moved: boolean; h: number } | null>(null);

  // Während des Ziehens das Scrollen der Seite unterbinden (iOS)
  useEffect(() => {
    const el = box.current; if (!el) return;
    const stop = (e: TouchEvent) => { if (st.current?.active) e.preventDefault(); };
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);

  const target = drag ? Math.max(0, Math.min(items.length - 1, drag.i + Math.round(drag.dy / drag.h))) : -1;

  return (
    <div ref={box} className={className}>
      {items.map((t, i) => {
        let shift = 0;
        if (drag) {
          if (i === drag.i) shift = drag.dy;
          else if (drag.i < target && i > drag.i && i <= target) shift = -drag.h;
          else if (drag.i > target && i < drag.i && i >= target) shift = drag.h;
        }
        return (
          <div key={keyOf(t)} className={"sort-item" + (drag?.i === i ? " lifted" : "")}
            style={{ transform: shift ? `translateY(${shift}px)` : undefined, transition: drag?.i === i ? "none" : undefined }}
            onPointerDown={(e) => {
              const h = (e.currentTarget as HTMLElement).offsetHeight;
              const s = { i, y: e.clientY, active: false, moved: false, h, timer: 0 };
              s.timer = window.setTimeout(() => { s.active = true; setDrag({ i, dy: 0, h }); navigator.vibrate?.(10); }, 350);
              st.current = s;
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              const s = st.current; if (!s) return;
              const dy = e.clientY - s.y;
              if (!s.active) { if (Math.abs(dy) > 8) { s.moved = true; clearTimeout(s.timer); } return; }
              setDrag({ i: s.i, dy, h: s.h });
            }}
            onPointerUp={() => {
              const s = st.current; st.current = null; if (!s) return;
              clearTimeout(s.timer);
              if (s.active) {
                if (target !== s.i && target >= 0) { const next = items.slice(); const [m] = next.splice(s.i, 1); next.splice(target, 0, m); onReorder(next); }
                setDrag(null);
              } else if (!s.moved) onTap(t);
            }}
            onPointerCancel={() => { const s = st.current; if (s) clearTimeout(s.timer); st.current = null; setDrag(null); }}
            onContextMenu={(e) => e.preventDefault()}>
            {render(t)}
          </div>
        );
      })}
    </div>
  );
}
