import { useEffect, useMemo, useRef } from "react";
import { triggerEgg } from "../core/eggs";

/** Feste Hintergrundebene: Mond, Tannen, Teich mit Spiegelung, Glitzer und Glühwürmchen. */

function pines(): string {
  // Tannensilhouetten als Polygone, deterministisch erzeugt
  let x = -10;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const out: string[] = [];
  while (x < 410) {
    const w = 18 + rnd() * 26;
    const h = 40 + rnd() * 70;
    const base = 120;
    const cx = x + w / 2;
    const tiers = 4;
    const pts: string[] = [`${x},${base}`];
    for (let t = 0; t < tiers; t++) {
      const y = base - (h * (t + 1)) / tiers;
      const half = (w / 2) * (1 - t / (tiers + 0.6));
      pts.push(`${cx - half},${y + h / tiers / 2}`, `${cx - half * 0.45},${y + h / tiers / 2}`);
    }
    pts.push(`${cx},${base - h - 6}`);
    for (let t = tiers - 1; t >= 0; t--) {
      const y = base - (h * (t + 1)) / tiers;
      const half = (w / 2) * (1 - t / (tiers + 0.6));
      pts.push(`${cx + half * 0.45},${y + h / tiers / 2}`, `${cx + half},${y + h / tiers / 2}`);
    }
    pts.push(`${x + w},${base}`);
    out.push(`<polygon points="${pts.join(" ")}"/>`);
    x += w * (0.55 + rnd() * 0.35);
  }
  return out.join("");
}

interface P {
  x: number; y: number; r: number; ph: number; sp: number;
  vx: number; vy: number; life: number; kind: "glitter" | "fly" | "burst";
}

export function Scenery() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const treeSvg = useMemo(pines, []);
  const tapCount = useRef(0);
  const tapTimer = useRef<number>();

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parts: P[] = [];

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 46; i++)
      parts.push({ x: Math.random() * w, y: Math.random() * h, r: 0.5 + Math.random() * 1.6, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.6, vx: 0, vy: 0, life: 1, kind: "glitter" });
    for (let i = 0; i < 7; i++)
      parts.push({ x: Math.random() * w, y: h * (0.45 + Math.random() * 0.45), r: 2 + Math.random() * 1.4, ph: Math.random() * 6.28, sp: 0.5 + Math.random(), vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.12, life: 1, kind: "fly" });

    const onBurst = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      const bx = d.x ?? w / 2, by = d.y ?? h / 3;
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * 6.28, s = 0.6 + Math.random() * 3.2;
        parts.push({ x: bx, y: by, r: 0.8 + Math.random() * 2, ph: Math.random() * 6.28, sp: 3, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6, life: 1, kind: "burst" });
      }
      if (reduced) draw(0);
    };
    window.addEventListener("sparkle-burst", onBurst);

    const gl = getComputedStyle(document.documentElement).getPropertyValue("--glitter").trim() || "232,215,160";

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.kind === "burst") {
          p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.985; p.life -= 0.012;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.fillStyle = `rgba(${gl},${p.life})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life + 0.3, 0, 6.28); ctx.fill();
          continue;
        }
        if (p.kind === "fly") {
          if (!reduced) {
            p.x += p.vx + Math.sin(t / 1600 + p.ph) * 0.18;
            p.y += p.vy + Math.cos(t / 1900 + p.ph) * 0.14;
            if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
            if (p.y < h * 0.3) p.vy = Math.abs(p.vy); if (p.y > h * 0.95) p.vy = -Math.abs(p.vy);
          }
          const a = 0.35 + 0.65 * Math.max(0, Math.sin(t / 700 * p.sp + p.ph));
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          g.addColorStop(0, `rgba(190,255,170,${0.85 * a})`);
          g.addColorStop(1, "rgba(190,255,170,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, 6.28); ctx.fill();
          continue;
        }
        const a = 0.12 + 0.88 * Math.pow(Math.max(0, Math.sin(t / 900 * p.sp + p.ph)), 3);
        ctx.fillStyle = `rgba(${gl},${a})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        if (a > 0.7 && p.r > 1.1) {
          ctx.strokeStyle = `rgba(${gl},${a * 0.6})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x - p.r * 3, p.y); ctx.lineTo(p.x + p.r * 3, p.y);
          ctx.moveTo(p.x, p.y - p.r * 3); ctx.lineTo(p.x, p.y + p.r * 3);
          ctx.stroke();
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
  }, []);

  function tapMoon() {
    tapCount.current += 1;
    window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => (tapCount.current = 0), 1800);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      void triggerEgg("mond");
    }
  }

  return (
    <>
      <div className="scenery" aria-hidden="true">
        <div className="moonglow" />
        <svg className="pines" viewBox="0 0 400 120" preserveAspectRatio="none" dangerouslySetInnerHTML={{ __html: treeSvg }} />
        <div className="pond">
          <div className="reflection" />
          <div className="ripple r1" />
          <div className="ripple r2" />
        </div>
      </div>
      <canvas ref={canvas} className="glitter" aria-hidden="true" />
      <button className="moon" onClick={tapMoon} aria-label="Mond" />
    </>
  );
}
