import { useEffect, useRef } from "react";
import type { ParticleMode } from "../core/skins";

/** Hintergrundebenen. Aussehen und Silhouetten legt skins.css pro Stil fest. */
export function Backdrop({ inner = false, skinId }: { inner?: boolean; skinId: string }) {
  return (
    <div className={"backdrop" + (inner ? " inner" : "")} data-skin={skinId} aria-hidden="true">
      <div className="bd bd2" />
      <div className="bd bd1" />
      <div className="bd bd3">
        <div className="refl" />
        <div className="rip r1" />
        <div className="rip r2" />
      </div>
      <div className="bd bd4" />
      <div className="bd bd5" />
    </div>
  );
}

interface P {
  x: number; y: number; r: number; ph: number; sp: number;
  vx: number; vy: number; life: number; kind: "glitter" | "fly" | "burst" | "ember" | "streak" | "shoot";
  len?: number; hue?: number;
}

const rgb = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export function Particles({ mode, skinId }: { mode: ParticleMode; skinId: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, nextShoot = 3000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parts: P[] = [];
    const c1 = rgb("--glitter", "232,215,160");
    const c2 = rgb("--glitter2", c1);
    const cf = rgb("--fly", "190,255,170");

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const glit = (n: number, rMax = 1.6) => {
      for (let i = 0; i < n; i++)
        parts.push({ x: Math.random() * w, y: Math.random() * h, r: 0.5 + Math.random() * rMax, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6, vx: 0, vy: 0, life: 1, kind: "glitter" });
    };
    const fly = (n: number) => {
      for (let i = 0; i < n; i++)
        parts.push({ x: Math.random() * w, y: h * (0.4 + Math.random() * 0.5), r: 2 + Math.random() * 1.4, ph: Math.random() * 6.28, sp: 0.5 + Math.random(), vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.12, life: 1, kind: "fly" });
    };
    const embers = (n: number) => {
      for (let i = 0; i < n; i++)
        parts.push({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28, sp: 1, vx: 0, vy: -(0.25 + Math.random() * 0.9), life: 1, kind: "ember" });
    };
    const streaks = (n: number) => {
      for (let i = 0; i < n; i++)
        parts.push({ x: Math.random() * w, y: Math.random() * h, r: 1, ph: Math.random() * 6.28, sp: 1, vx: 0, vy: 1.6 + Math.random() * 3.4, life: 1, kind: "streak", len: 18 + Math.random() * 50, hue: Math.random() });
    };

    if (mode === "embers") { embers(38); fly(0); streaks(0); }
    if (mode === "sparks") glit(26, 1.1);

    const onBurst = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      const bx = d.x ?? w / 2, by = d.y ?? h / 3;
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * 6.28, s = 0.6 + Math.random() * 3.2;
        parts.push({ x: bx, y: by, r: 0.8 + Math.random() * 2, ph: 0, sp: 3, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6, life: 1, kind: "burst" });
      }
    };
    window.addEventListener("sparkle-burst", onBurst);

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);
      if (false && !reduced && t > nextShoot) {
        nextShoot = t + 6000 + Math.random() * 6000;
        parts.push({ x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, r: 1.4, ph: 0, sp: 1, vx: 5 + Math.random() * 3, vy: 2 + Math.random() * 2, life: 1, kind: "shoot" });
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.kind === "burst") {
          p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.985; p.life -= 0.012;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.fillStyle = `rgba(${c1},${p.life})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + 0.3, 0, 6.28); ctx.fill();
        } else if (p.kind === "shoot") {
          p.x += p.vx; p.y += p.vy; p.life -= 0.018;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          const g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 9, p.y - p.vy * 9);
          g.addColorStop(0, `rgba(255,255,255,${p.life})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 9, p.y - p.vy * 9); ctx.stroke();
        } else if (p.kind === "fly") {
          if (!reduced) {
            p.x += p.vx + Math.sin(t / 1600 + p.ph) * 0.18;
            p.y += p.vy + Math.cos(t / 1900 + p.ph) * 0.14;
            if (p.x < -10) p.x = w + 10;
            if (p.x > w + 10) p.x = -10;
            if (p.y < h * 0.3) p.vy = Math.abs(p.vy);
            if (p.y > h * 0.95) p.vy = -Math.abs(p.vy);
          }
          const a = 0.35 + 0.65 * Math.max(0, Math.sin((t / 700) * p.sp + p.ph));
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          g.addColorStop(0, `rgba(${cf},${0.85 * a})`);
          g.addColorStop(1, `rgba(${cf},0)`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, 6.28); ctx.fill();
        } else if (p.kind === "ember") {
          if (!reduced) {
            p.y += p.vy; p.x += Math.sin(t / 900 + p.ph) * 0.3;
            if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
          }
          const a = 0.3 + 0.6 * Math.max(0, Math.sin((t / 500) * p.sp + p.ph));
          ctx.fillStyle = `rgba(${c1},${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        } else if (p.kind === "streak") {
          if (!reduced) { p.y += p.vy; if (p.y - (p.len ?? 0) > h) { p.y = -10; p.x = Math.random() * w; } }
          const g = ctx.createLinearGradient(p.x, p.y, p.x, p.y - (p.len ?? 20));
          const c = (p.hue ?? 0) > 0.5 ? c2 : c1;
          g.addColorStop(0, `rgba(${c},.55)`);
          g.addColorStop(1, `rgba(${c},0)`);
          ctx.strokeStyle = g; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - (p.len ?? 20)); ctx.stroke();
        } else {
          const soft = false;
          const a = soft ? 0.08 + 0.22 * Math.max(0, Math.sin(t / 2600 * p.sp + p.ph)) : 0.12 + 0.88 * Math.pow(Math.max(0, Math.sin((t / 900) * p.sp + p.ph)), 3);
          if (soft && !reduced) { p.x += Math.sin(t / 3000 + p.ph) * 0.12; p.y += Math.cos(t / 3600 + p.ph) * 0.08; }
          ctx.fillStyle = `rgba(${c1},${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
          if (!soft && a > 0.7 && p.r > 1.1) {
            ctx.strokeStyle = `rgba(${c1},${a * 0.6})`; ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x - p.r * 3, p.y); ctx.lineTo(p.x + p.r * 3, p.y);
            ctx.moveTo(p.x, p.y - p.r * 3); ctx.lineTo(p.x, p.y + p.r * 3);
            ctx.stroke();
          }
        }
      }
    }

    const loop = (t: number) => { draw(t); raf = requestAnimationFrame(loop); };
    if (reduced) draw(1000); else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("sparkle-burst", onBurst);
    };
  }, [mode, skinId]);

  return <canvas ref={canvas} className="glitter" aria-hidden="true" />;
}
