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
import { Icon } from "../components/Icon";
import { getModule, modules } from "../core/modules";
import { useStored } from "../core/db";
import { getSkin, SkinCtx } from "../core/skins";
import type { Profile } from "../core/types";

/**
 * Startseite als Rüstung: Harnisch Heinrichs II. von Frankreich, um 1555.
 * The Metropolitan Museum of Art, 39.121a–n, 3D-Scan unter CC0 (Open Access).
 * Das Modell (public/armor.glb) ist in neun Teile zerlegt, jedes Teil ist ein Modul.
 */
interface PartDef { id: string; name: string; module: string }

const PARTS: PartDef[] = [
  { id: "helm", name: "Geschlossener Helm", module: "gefuehle" },
  { id: "brust", name: "Brustplatte", module: "zyklus" },
  { id: "ruecken", name: "Rückenplatte", module: "einstellungen" },
  { id: "fauld", name: "Bauchreifen und Beintaschen", module: "finanzen" },
  { id: "schulter", name: "Schulterstücke", module: "analytics" },
  { id: "arm", name: "Armzeug", module: "erinnerungen" },
  { id: "hand", name: "Panzerhandschuhe", module: "gewohnheiten" },
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

interface Api { select: (id: string | null) => void; open: () => void }

export function Ruestkammer({ back, go }: { back?: () => void; go: (id: string) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<Api>({ select: () => {}, open: () => {} });
  const [sel, setSel] = useState<string | null>(null);
  const [diving, setDiving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profile] = useStored<Profile>("profile", { name: "Dein Name", mottos: [] });
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
    outline.visibleEdgeColor.set(0xffe2a0); outline.hiddenEdgeColor.set(0x6a5a38);
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
    let hint: { id: string; t: number } | null = null;
    let nextHint = 5000, hintIdx = 0;
    let busy = false;

    function centerOf(id: string) {
      const box = new THREE.Box3();
      for (const m of byPart.get(id) ?? []) box.expandByObject(m);
      return { c: box.getCenter(new THREE.Vector3()), s: box.getSize(new THREE.Vector3()) };
    }
    api.current.select = (id) => {
      if (busy) return;
      selected = id; setSel(id); selT = performance.now(); hint = null;
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
      if (id && id === selected) api.current.open(); else api.current.select(id);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const tmp = new THREE.Vector3(), dir = new THREE.Vector3();
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
        outline.edgeStrength = 3.2 + 7 * Math.exp(-dt / 280) + 0.5 * Math.sin(t / 420);
        outline.edgeGlow = 1.2 + 1.6 * Math.exp(-dt / 350);
      } else if (hint) {
        const p = (t - hint.t) / 1500;
        if (p >= 1) { hint = null; outline.selectedObjects = []; outline.edgeStrength = 0; }
        else outline.edgeStrength = 2.2 * Math.sin(Math.PI * p);
      } else if (!busy && pickables.length && t > nextHint) {
        const id = PARTS[hintIdx++ % PARTS.length].id;
        hint = { id, t }; outline.selectedObjects = byPart.get(id) ?? []; nextHint = t + 5200;
      }
      composer.render();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose(); composer.dispose(); renderer.dispose(); pm.dispose(); draco.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  const part = PARTS.find((p) => p.id === sel);
  const mod = part ? getModule(part.module) : undefined;
  const letter = (profile.name.trim()[0] || "?").toUpperCase();
  const motto = profile.mottos.find((m) => m.trim());

  return (
    <SkinCtx.Provider value={getSkin("ritter-2")}>
      <div className="rk" data-skin="metall-1">
        <div className={"rk-canvas" + (loaded ? " ready" : "")} ref={mount} />
        <div className={"rk-top" + (sel ? " hide" : "")}>
          <div className="rk-id">
            <div className="rk-avatar">{profile.photo ? <img src={profile.photo} alt="" /> : <span>{letter}</span>}</div>
            <div className="rk-name">{profile.name}</div>
            {motto && <div className="rk-motto">{motto}</div>}
          </div>
          <div className="metrics rk-metrics">
            {overviewItems.map((m) => (
              <div className="metric" key={m.id}><b>–</b><small>{m.label}</small></div>
            ))}
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
    </SkinCtx.Provider>
  );
}
