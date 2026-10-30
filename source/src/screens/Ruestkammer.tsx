import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { ICONS } from "../core/icons";
import { Icon } from "../components/Icon";
import { getModule, modules } from "../core/modules";
import { useStored } from "../core/db";
import { cycleDay, useOverviewValues } from "../core/overview";
import type { CycleLog, Reminder } from "../core/types";
import { CoatOfArms, DEFAULT_ARMS } from "../core/heraldry";
import type { Arms } from "../core/types";
import { useSkin } from "../core/skins";
import type { Profile } from "../core/types";

/**
 * Startseite als Rüstung: Harnisch Heinrichs II. von Frankreich, um 1555.
 * The Metropolitan Museum of Art, 39.121a–n, 3D-Scan unter CC0 (Open Access).
 * Das Modell (public/armor.glb) ist in neun Teile zerlegt, jedes Teil ist ein Modul.
 */
interface PartDef { id: string; name: string; module: string }

/** Ankerpunkte der Runen (Meter, Boden y=0). Bei Paaren wird die Seite gewählt, die zur Kamera zeigt. */
const ANCHORS: Record<string, [number, number, number, boolean]> = {
  helm: [0, 1.7, 0.05, false], brust: [0.09, 1.33, 0, false], ruecken: [0.08, 1.3, 0, false], fauld: [-0.12, 0.8, 0, false],
  schulter: [0.25, 1.42, 0, true], arm: [0.27, 1.12, 0, true], hand: [0.27, 0.9, 0, true], bein: [0.11, 0.42, 0, true], schuh: [0.12, 0.07, 0.08, true],
};

const PARTS: PartDef[] = [
  { id: "helm", name: "Geschlossener Helm", module: "erinnerungen" },
  { id: "brust", name: "Brustplatte", module: "gefuehle" },
  { id: "fauld", name: "Bauchreifen und Beintaschen", module: "zyklus" },
  { id: "schulter", name: "Schulterstücke", module: "analytics" },
  { id: "arm", name: "Armzeug", module: "gewohnheiten" },
  { id: "hand", name: "Panzerhandschuhe", module: "finanzen" },
  { id: "bein", name: "Beinzeug", module: "archiv" },
  { id: "schuh", name: "Eisenschuhe", module: "fundorte" },
];

const overviewItems = [
  { id: "steps", label: "Schritte" }, { id: "sleep", label: "Schlaf" }, { id: "screen", label: "Bildschirmzeit" }, { id: "route", label: "Wegstrecke" },
  ...modules.flatMap((m) => m.feeds),
];

function radialTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, "rgba(5,6,8,.4)"); gr.addColorStop(0.5, "rgba(5,6,8,.78)"); gr.addColorStop(1, "rgba(5,6,8,1)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Symbol als rot leuchtende Rune auf transparentem Grund. */
function runeTexture(id: string) {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.lineCap = "round"; g.lineJoin = "round";
  const draw = (w: number, col: string, blur: number) => {
    g.save(); g.translate(64, 64); g.scale(384 / 24, 384 / 24);
    g.shadowColor = "#ff1030"; g.shadowBlur = blur; g.strokeStyle = col; g.lineWidth = w;
    for (const d of ICONS[id] ?? []) g.stroke(new Path2D(d));
    g.restore();
  };
  draw(2.6, "rgba(200,10,40,.55)", 40);
  draw(1.5, "#ff3048", 18);
  draw(0.7, "#ffd0d6", 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface Api { select: (id: string | null, at?: THREE.Intersection) => void; open: () => void; wall: (lines: string[]) => void }

/** Zeilen als halbtransparente Code-Textur */
function codeTexture(lines: string[]) {
  const lh = 34, w = 1024;
  const c = document.createElement("canvas"); c.width = w; c.height = Math.max(lh, lines.length * lh + 16);
  const g = c.getContext("2d")!;
  g.font = "600 26px ui-monospace, Menlo, Consolas, monospace";
  g.textBaseline = "top";
  lines.forEach((l, i) => {
    const y = 8 + i * lh;
    const m = l.match(/^(\s*)([^=:{}]+?)(\s*[=:]\s*)(.*)$/);
    if (l.trim().startsWith("//")) { g.fillStyle = "rgba(150,156,163,.8)"; g.fillText(l, 12, y); return; }
    if (!m) { g.fillStyle = "rgba(205,210,215,.9)"; g.fillText(l, 12, y); return; }
    let x = 12;
    g.fillStyle = "rgba(205,210,215,.92)"; g.fillText(m[1] + m[2], x, y); x += g.measureText(m[1] + m[2]).width;
    g.fillStyle = "rgba(150,156,163,.8)"; g.fillText(m[3], x, y); x += g.measureText(m[3]).width;
    g.fillStyle = m[4].startsWith("—") ? "rgba(120,126,133,.8)" : "rgba(214,58,82,.95)"; g.fillText(m[4], x, y);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { t, aspect: c.width / c.height };
}

export function Ruestkammer({ back, go }: { back?: () => void; go: (id: string) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<Api>({ select: () => {}, open: () => {}, wall: () => {} });
  const [sel, setSel] = useState<string | null>(null);
  const [diving, setDiving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profile] = useStored<Profile>("profile", { name: "Dein Name", mottos: [] });
  const skin = useSkin();
  const ov = useOverviewValues();
  const [arms] = useStored<Arms>("wappen", DEFAULT_ARMS);
  const [rem] = useStored<Reminder[]>("erinnerungen", []);
  const [cyc] = useStored<CycleLog>("zyklus", {});
  const lines = (() => {
    const today = new Date();
    const out = [`// ${today.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, "tagesueberblick {"];
    for (const m of overviewItems) out.push(`  ${m.label.toLowerCase().replace(/ /g, "_")}: ${ov[m.id] ?? "—"}`);
    out.push("}");
    const open = rem.filter((r) => !r.done);
    out.push(`erinnerungen.offen = ${open.length}`, `erinnerungen.erledigt = ${rem.length - open.length}`);
    for (const l of Array.from(new Set(rem.map((r) => r.category).filter(Boolean)))) out.push(`liste["${l}"] = ${open.filter((r) => r.category === l).length}`);
    const cd = cycleDay(cyc);
    out.push(`zyklus.tag = ${cd ?? "—"}`);
    Object.keys(cyc).sort().slice(-7).forEach((d) => {
      const e = cyc[d];
      out.push(`zyklus["${d}"] = { ${[e.flow ? `blutung: ${e.flow}` : "", e.spotting ? `schmier: ${e.spotting}` : "", e.pain ? `schmerz: ${e.pain}` : ""].filter(Boolean).join(", ")} }`);
    });
    out.push(`wappen = { form: ${arms.shape}, teilung: ${arms.division}, symbol: ${arms.charge} }`);
    return out;
  })();
  const linesKey = lines.join("\n");
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    const el = mount.current!;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
    const home = new THREE.Vector3(0, 0.98, 0);
    camera.position.set(1.4, 1.35, 5.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(home);
    controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 0.6; controls.maxDistance = 8;
    controls.minPolarAngle = 0.7; controls.maxPolarAngle = 1.62;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.6;

    /* Leere Fläche mit Spiegelung */
    const refl = new Reflector(new THREE.CircleGeometry(5, 64), { color: 0x70757b, textureWidth: Math.floor(window.innerWidth * dpr * 0.6), textureHeight: Math.floor(window.innerHeight * dpr * 0.6), clipBias: 0.003 });
    refl.rotation.x = -Math.PI / 2; scene.add(refl);
    const veil = new THREE.Mesh(new THREE.CircleGeometry(5, 64), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false }));
    veil.rotation.x = -Math.PI / 2; veil.position.y = 0.003; scene.add(veil);

    const spot = new THREE.SpotLight(0xffffff, 38, 12, 0.45, 0.7, 1.3);
    spot.position.set(1.6, 4.4, 2.8); spot.target.position.set(0, 1, 0); scene.add(spot, spot.target);
    const rimA = new THREE.DirectionalLight(0xc6d8ff, 2.4); rimA.position.set(-3, 2.5, -3); scene.add(rimA);
    const rimB = new THREE.DirectionalLight(0xffe6c8, 1.6); rimB.position.set(3, 1.8, -2.4); scene.add(rimB);

    /* Harnisch laden und stahlgrau einfärben */
    const pickables: THREE.Mesh[] = [];
    const byPart = new Map<string, THREE.Mesh[]>();
    const draco = new DRACOLoader(); draco.setDecoderPath("./draco/"); draco.setDecoderConfig({ type: "js" });
    const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
    const onLoad = (gltf: { scene: THREE.Group }) => {
      if (disposed) return;
      gltf.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        let p: THREE.Object3D | null = m; let part = "";
        while (p) { if (PARTS.some((x) => x.id === p!.name)) { part = p.name; break; } p = p.parent; }
        const old = m.material as THREE.MeshStandardMaterial;
        m.material = new THREE.MeshStandardMaterial({
          color: 0x7d838a, metalness: 1, roughness: 0.4, normalScale: new THREE.Vector2(0.7, 0.7),
          normalMap: old.normalMap ?? null, aoMap: old.aoMap ?? null, aoMapIntensity: 0.9, side: THREE.DoubleSide,
        });
        if (part) { m.userData.part = part; pickables.push(m); const a = byPart.get(part) ?? []; a.push(m); byPart.set(part, a); }
      });
      scene.add(gltf.scene);
      setLoaded(true);
    };
    // armor.glb auf GitHub Pages. Wo .glb nicht ausgeliefert wird (Vorschau im Chat), liegt das Modell als armor.js vor.
    const fromScript = () => {
      const sc = document.createElement("script");
      sc.src = "./armor.js";
      sc.onload = () => {
        const b64 = (window as unknown as { __ARMOR_B64?: string }).__ARMOR_B64;
        if (!b64) return;
        const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        loader.parse(bin.buffer, "./", onLoad);
      };
      document.head.appendChild(sc);
    };
    loader.load("./armor.glb", onLoad, undefined, fromScript);

    /* Leuchtende Umrandung */
    const w0 = el.clientWidth || window.innerWidth, h0 = el.clientHeight || window.innerHeight;
    const target = new THREE.WebGLRenderTarget(w0 * dpr, h0 * dpr, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    const outline = new OutlinePass(new THREE.Vector2(w0, h0), scene, camera);
    outline.visibleEdgeColor.set(0xe9edf0); outline.hiddenEdgeColor.set(0x4a4e53);
    outline.edgeGlow = 1.4; outline.edgeThickness = 2.2; outline.edgeStrength = 0; outline.pulsePeriod = 0;
    composer.addPass(outline);
    composer.addPass(new OutputPass());

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.setViewOffset(w, h, 0, -Math.round(h * 0.07), w, h);
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(el);

    /* Interaktion */
    let focus: { c: THREE.Vector3; d: number; speed: number } | null = null;
    let selected: string | null = null;
    let selT = 0;
    let busy = false;

    function centerOf(id: string) {
      const box = new THREE.Box3();
      for (const m of byPart.get(id) ?? []) box.expandByObject(m);
      return { c: box.getCenter(new THREE.Vector3()), s: box.getSize(new THREE.Vector3()) };
    }
    /* Rune: das Symbol des Moduls wird auf die Oberfläche des Teils projiziert */
    let rune: THREE.Group | null = null;
    const runeMat = () => (rune?.children[0] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined;
    const helper = new THREE.Object3D();
    function clearRune() {
      if (!rune) return;
      scene.remove(rune);
      const mm = runeMat(); mm?.map?.dispose(); mm?.dispose();
      for (const c of rune.children) (c as THREE.Mesh).geometry.dispose();
      rune = null;
    }
    function placeRune(id: string, at?: THREE.Intersection) {
      clearRune();
      const meshes = byPart.get(id) ?? [];
      const { s } = centerOf(id);
      const [ax, ay, az, pair] = ANCHORS[id] ?? [0, 1, 0, false];
      const x = pair ? Math.sign(camera.position.x || 1) * Math.abs(ax) : ax;
      const anchor = new THREE.Vector3(x, ay, az);
      const r2 = new THREE.Raycaster(camera.position.clone(), anchor.clone().sub(camera.position).normalize());
      const hit = r2.intersectObjects(meshes, false)[0] ?? at;
      if (!hit || !hit.face) return;
      const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      if (n.dot(camera.position.clone().sub(hit.point)) < 0) n.negate();
      // Projektion leicht zur Kamera geneigt, damit die Rune auf gewölbten Platten lesbar bleibt
      const view = camera.position.clone().sub(hit.point).normalize();
      n.lerp(view, 0.35).normalize();
      helper.position.copy(hit.point); helper.lookAt(hit.point.clone().add(n));
      const size = Math.min(0.16, Math.max(0.07, Math.max(s.x, s.y) * 0.26));
      const mod = PARTS.find((p) => p.id === id)!.module;
      const mat = new THREE.MeshBasicMaterial({ map: runeTexture(mod), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, blending: THREE.AdditiveBlending, toneMapped: false });
      const group = new THREE.Group();
      for (const m of meshes) {
        const geo = new DecalGeometry(m, hit.point, helper.rotation, new THREE.Vector3(size, size, size * 1.6));
        if (geo.attributes.position.count) { const dm = new THREE.Mesh(geo, mat); dm.renderOrder = 5; group.add(dm); } else geo.dispose();
      }
      rune = group; scene.add(group);
    }

    api.current.select = (id, at) => {
      if (busy) return;
      selected = id; setSel(id); selT = performance.now();
      clearRune(); if (id) placeRune(id, at);
      controls.autoRotate = false;
      if (!id) { outline.selectedObjects = []; focus = { c: home.clone(), d: 5.6, speed: 0.07 }; return; }
      outline.selectedObjects = byPart.get(id) ?? [];
      const { c, s } = centerOf(id);
      focus = { c, d: Math.min(5, Math.max(1.1, Math.max(s.x, s.y) * 2.6 + 0.4)), speed: 0.08 };
    };
    api.current.open = () => {
      if (!selected || busy) return;
      busy = true; setDiving(true);
      const { c, s } = centerOf(selected);
      focus = { c, d: Math.max(0.35, Math.max(s.x, s.y) * 0.8), speed: 0.12 };
      const mod = PARTS.find((p) => p.id === selected)!.module;
      window.setTimeout(() => goRef.current(mod), 650);
    };
    controls.addEventListener("start", () => { if (!busy) focus = null; controls.autoRotate = false; });

    let down: { x: number; y: number; t: number } | null = null;
    const ray = new THREE.Raycaster();
    const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 450;
      down = null;
      if (moved > 6 || !quick) return;
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      const id = hit ? (hit.object.userData.part as string) : null;
      if (id && id === selected) api.current.open(); else api.current.select(id, hit);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const tmp = new THREE.Vector3(), dir = new THREE.Vector3();
    /* Analytics-Wand: schwebende Code-Zeilen vor der Rüstung, nur von hinten lesbar */
    const wall = new THREE.Group(); scene.add(wall);
    const strips: { m: THREE.Mesh; base: number; ph: number; y: number }[] = [];
    const wallDir = new THREE.Vector3(0, 0, -1);
    api.current.wall = (lines) => {
      for (const st of strips) { wall.remove(st.m); st.m.geometry.dispose(); const mm = st.m.material as THREE.MeshBasicMaterial; mm.map?.dispose(); mm.dispose(); }
      strips.length = 0;
      const layout: [number, number, number, number, number][] = [
        // x, y, z, Breite, Deckkraft
        [-0.6, 1.5, 1.5, 1.7, 0.8], [0.95, 1.2, 1.8, 1.6, 0.65], [-1.55, 0.75, 2.3, 1.8, 0.5], [0.35, 0.55, 2.1, 1.7, 0.55],
        [1.75, 0.6, 2.6, 1.6, 0.45], [-0.2, 2.2, 2.7, 2.1, 0.45], [1.6, 2.0, 3.0, 1.7, 0.4], [-1.9, 1.9, 3.1, 1.8, 0.4],
        [-0.9, 0.25, 3.3, 2.0, 0.35], [1.0, 2.6, 3.5, 2.0, 0.3],
      ];
      layout.forEach(([x, y, z, wdt, op], k) => {
        const part = [...lines.slice((k * 4) % lines.length), ...lines.slice(0, (k * 4) % lines.length)].slice(0, 9 + (k % 4) * 3);
        const { t, aspect } = codeTexture(k === 0 ? lines : part);
        const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.FrontSide });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(wdt, wdt / aspect), mat);
        m.rotation.y = Math.PI; m.position.set(x, y, z); m.renderOrder = 2;
        wall.add(m); strips.push({ m, base: op, ph: k * 1.7, y });
      });
    };

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (focus) {
        controls.target.lerp(focus.c, focus.speed);
        dir.copy(camera.position).sub(controls.target).normalize();
        camera.position.lerp(tmp.copy(focus.c).addScaledVector(dir, focus.d), focus.speed);
      }
      controls.update();
      if (selected) {
        const dt = t - selT;
        outline.edgeStrength = 2.2 * Math.min(1, dt / 350);
        outline.edgeGlow = 0.9;
        const rm = runeMat(); if (rm) rm.opacity = Math.min(1, dt / 400);
      } else {
        outline.edgeStrength = 0;
      }
      // Wand blendet sich nur ein, wenn die Kamera hinter der Rüstung steht
      for (const st of strips) {
        const toCam = tmp.copy(camera.position).sub(st.m.position).normalize();
        const facing = wallDir.dot(toCam);
        (st.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, Math.min(1, (facing - 0.25) * 2)) * st.base;
        st.m.position.y = st.y + Math.sin(t / 2600 + st.ph) * 0.03;
      }
      composer.render();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true; clearRune(); api.current.wall([]);
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose(); composer.dispose(); renderer.dispose(); pm.dispose(); draco.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => { api.current.wall(linesKey.split("\n")); }, [linesKey]);

  const part = PARTS.find((p) => p.id === sel);
  const mod = part ? getModule(part.module) : undefined;
  const motto = profile.mottos.find((m) => m.trim());

  return (
    <>
      <div className="rk" data-skin={skin.id}>
        <div className={"rk-canvas" + (loaded ? " ready" : "")} ref={mount} />
        <div className={"rk-top" + (sel ? " hide" : "")}>
          <div className="rk-id">
            <button className="arms-main small" style={{ pointerEvents: "auto" }} onClick={() => go("einstellungen")} aria-label="Einstellungen"><CoatOfArms arms={arms} /></button>
            <div className="rk-name">{profile.name}</div>
            {motto && <div className="rk-motto">{motto}</div>}
          </div>
        </div>
        {back && (
          <button className="back rk-back" onClick={back} aria-label="Zurück">
            <Icon name="back" />
          </button>
        )}
        {part && mod && (
          <div className="rk-sheet">
            <div className="rk-sheet-icon"><Icon name={mod.icon} /></div>
            <div className="rk-sheet-text">
              <div className="rk-sheet-title">{mod.title}</div>
              <div className="rk-sheet-sub">{part.name}</div>
            </div>
            <button className="btn small" onClick={() => api.current.open()}>Öffnen</button>
            <button className="btn small ghost" onClick={() => api.current.select(null)}>Ganze Rüstung</button>
          </div>
        )}
        <div className={"rk-fade" + (diving ? " on" : "")} />
      </div>
    </>
  );
}
