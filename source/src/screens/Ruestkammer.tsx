import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Icon } from "../components/Icon";
import { getModule, modules } from "../core/modules";
import { useStored } from "../core/db";
import { getSkin, SkinCtx } from "../core/skins";
import type { Profile } from "../core/types";

/**
 * Startseite als Rüstung. Jedes Rüstungsteil ist ein Modul.
 * Die Rüstung ist hier prozedural aus Formen gebaut (Platzhalter für ein gescanntes, zerlegtes glTF-Modell).
 * Antippen lässt die Umrandung des Teils aufleuchten, "Öffnen" fährt in das Teil hinein.
 */
interface PartDef { id: string; name: string; module: string }

const PARTS: PartDef[] = [
  { id: "helm", name: "Schaller mit Kinnreff", module: "gefuehle" },
  { id: "brust", name: "Kürass", module: "zyklus" },
  { id: "fauld", name: "Bauchreifen", module: "finanzen" },
  { id: "arm", name: "Armzeug", module: "erinnerungen" },
  { id: "hand", name: "Panzerhandschuh", module: "gewohnheiten" },
  { id: "schulter", name: "Schulterstück", module: "analytics" },
  { id: "bein", name: "Beinzeug", module: "archiv" },
  { id: "schuh", name: "Eisenschuh", module: "fundorte" },
  { id: "schwert", name: "Schwert", module: "einstellungen" },
];

const overviewItems = [
  { id: "steps", label: "Schritte" }, { id: "sleep", label: "Schlaf" }, { id: "screen", label: "Bildschirmzeit" }, { id: "route", label: "Wegstrecke" },
  ...modules.flatMap((m) => m.feeds),
];

/** Gotisches Brustteil: Kiel in der Mitte, Riffelung, verjüngte Taille. */
function cuirassGeometry() {
  const g = new THREE.SphereGeometry(1, 96, 72, 0, Math.PI * 2, Math.PI * 0.07, Math.PI * 0.64);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i); const y = pos.getY(i); let z = pos.getZ(i);
    const t = Math.max(0, -y);
    x *= 1 - 0.34 * Math.pow(t, 1.1);
    z *= 1 - 0.2 * t;
    if (z > 0) {
      const ridge = Math.exp(-(x * x) / 0.012);
      z += 0.2 * ridge * (0.35 + 0.65 * Math.min(1, (y + 0.7) / 1.5));
      const a = Math.atan2(x, y + 1.0);
      const w = Math.min(1, z * 2.2) * Math.max(0, 1 - Math.abs(a) / 0.9);
      z += 0.028 * Math.sin(a * 17) * w;
    } else {
      z -= 0.05 * Math.exp(-(x * x) / 0.02);
    }
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

function radialTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, "rgba(5,6,8,.45)"); gr.addColorStop(0.55, "rgba(5,6,8,.8)"); gr.addColorStop(1, "rgba(5,6,8,1)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

interface Api { select: (id: string | null) => void; open: () => void }

export function Ruestkammer({ back, go }: { back?: () => void; go: (id: string) => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<Api>({ select: () => {}, open: () => {} });
  const [sel, setSel] = useState<string | null>(null);
  const [diving, setDiving] = useState(false);
  const [profile] = useStored<Profile>("profile", { name: "Dein Name", mottos: [] });
  const goRef = useRef(go);
  goRef.current = go;

  useEffect(() => {
    const el = mount.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    const dpr = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environmentIntensity = 0.7;

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(2.2, 2.4, 9.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.62, 0);
    controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.08;
    controls.minDistance = 1.2; controls.maxDistance = 12;
    controls.minPolarAngle = 0.75; controls.maxPolarAngle = 1.62;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.7;

    /* ----- Stahl ----- */
    const steel = new THREE.MeshStandardMaterial({ color: 0x9ba2aa, metalness: 1, roughness: 0.27, side: THREE.DoubleSide });
    const steelPolish = new THREE.MeshStandardMaterial({ color: 0xaeb5bc, metalness: 1, roughness: 0.17, side: THREE.DoubleSide });
    const blued = new THREE.MeshStandardMaterial({ color: 0x5b6168, metalness: 1, roughness: 0.4, side: THREE.DoubleSide });
    const core = new THREE.MeshStandardMaterial({ color: 0x1a1c20, metalness: 0.3, roughness: 0.8 });

    const pickables: THREE.Mesh[] = [];
    const byPart = new Map<string, THREE.Mesh[]>();
    const rivetBuckets = new Map<string, THREE.BufferGeometry[]>();
    function add(part: string | null, geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], o: { rot?: [number, number, number]; scale?: [number, number, number]; parent?: THREE.Object3D } = {}) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      if (o.rot) m.rotation.set(...o.rot);
      if (o.scale) m.scale.set(...o.scale);
      (o.parent ?? scene).add(m);
      if (part) { m.userData.part = part; pickables.push(m); const a = byPart.get(part) ?? []; a.push(m); byPart.set(part, a); }
      return m;
    }
    /** Nieten werden pro Teil gesammelt und am Ende zu einem Netz verschmolzen. */
    function rivet(part: string, parent: THREE.Object3D, x: number, y: number, z: number, r = 0.011) {
      const g = new THREE.SphereGeometry(r, 8, 6);
      const m = new THREE.Matrix4().makeTranslation(x, y, z);
      parent.updateMatrixWorld(true);
      g.applyMatrix4(parent === scene ? m : new THREE.Matrix4().copy(parent.matrix).multiply(m));
      const a = rivetBuckets.get(part) ?? []; a.push(g); rivetBuckets.set(part, a);
    }
    const sph = (r = 1, ws = 32, hs = 20, ps = 0, pl = Math.PI * 2, ts = 0, tl = Math.PI) => new THREE.SphereGeometry(r, ws, hs, ps, pl, ts, tl);
    const cyl = (rt: number, rb: number, h: number, open = false, seg = 36) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);

    /* ----- Leere Fläche mit Spiegelung ----- */
    const refl = new Reflector(new THREE.CircleGeometry(7, 64), { color: 0x6c7076, textureWidth: Math.floor(window.innerWidth * dpr * 0.6), textureHeight: Math.floor(window.innerHeight * dpr * 0.6), clipBias: 0.003 });
    refl.rotation.x = -Math.PI / 2; scene.add(refl);
    const veil = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false }));
    veil.rotation.x = -Math.PI / 2; veil.position.y = 0.004; scene.add(veil);

    const spot = new THREE.SpotLight(0xffffff, 140, 18, 0.5, 0.7, 1.2);
    spot.position.set(2.6, 7, 4.5); spot.target.position.set(0, 1.6, 0); scene.add(spot, spot.target);
    const rimA = new THREE.DirectionalLight(0xbfd4ff, 2.2); rimA.position.set(-4, 3.5, -4); scene.add(rimA);
    const rimB = new THREE.DirectionalLight(0xffe2c0, 1.6); rimB.position.set(4, 2.5, -3); scene.add(rimB);

    /* ----- Rüstung ----- */
    // Polsterung: dunkle Kerne füllen die Lücken zwischen den Platten
    add(null, sph(1, 24, 16), core, [0, 2.3, 0], { scale: [0.3, 0.42, 0.22] });
    add(null, cyl(0.28, 0.3, 0.5), core, [0, 1.8, 0], { scale: [1, 1, 0.74] });
    add(null, cyl(0.06, 0.08, 0.3), core, [0, 2.85, 0]);
    for (const s of [-1, 1]) {
      add(null, cyl(0.1, 0.07, 0.72), core, [s * 0.2, 0.55, 0]);
      add(null, cyl(0.12, 0.1, 0.7), core, [s * 0.2, 1.35, 0]);
    }

    for (const s of [-1, 1]) {
      /* Eisenschuh: überlappende Schalen, lange Spitze */
      for (let i = 0; i < 5; i++) {
        add("schuh", sph(0.085 - i * 0.006, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), steel, [s * 0.2, 0.075, -0.04 + i * 0.075], { rot: [Math.PI / 2 - 0.05, 0, 0], scale: [1, 1.0, 0.7] });
      }
      add("schuh", new THREE.ConeGeometry(0.058, 0.3, 20), steel, [s * 0.2, 0.06, 0.46], { rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.65] });
      add("schuh", sph(0.075, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), steel, [s * 0.2, 0.1, -0.07], { rot: [-0.9, 0, 0] });
      add("schuh", cyl(0.088, 0.092, 0.07, true), steelPolish, [s * 0.2, 0.2, 0]);

      /* Beinzeug: Beinröhre, Knieschale mit Flügel, Oberschenkel, Lamellen */
      add("bein", cyl(0.116, 0.088, 0.66), steel, [s * 0.2, 0.55, 0], { scale: [1, 1, 0.9] });
      add("bein", new THREE.BoxGeometry(0.02, 0.6, 0.02), steelPolish, [s * 0.2, 0.55, 0.095]);
      add("bein", cyl(0.122, 0.118, 0.06, true), steelPolish, [s * 0.2, 0.88, 0]);
      add("bein", sph(0.125, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), steelPolish, [s * 0.2, 0.97, 0.07], { rot: [Math.PI / 2 - 0.1, 0, 0], scale: [1, 1, 0.9] });
      add("bein", sph(0.07, 16, 12), steel, [s * 0.335, 0.97, 0.02], { scale: [0.45, 1.5, 1.3] });
      for (let i = 0; i < 3; i++) add("bein", cyl(0.125 + i * 0.006, 0.122 + i * 0.006, 0.05, true), steel, [s * 0.2, 1.06 + i * 0.045, 0]);
      add("bein", cyl(0.168, 0.128, 0.58), steel, [s * 0.2, 1.4, 0], { scale: [1, 1, 0.95] });
      add("bein", new THREE.BoxGeometry(0.018, 0.5, 0.016), steelPolish, [s * 0.2, 1.42, 0.16]);

      /* Schulterstück: Kuppel, fünf Schienen, Achselscheibe */
      const piv = new THREE.Group(); piv.position.set(s * 0.45, 2.66, 0); piv.rotation.z = s * 0.2; scene.add(piv);
      add("schulter", sph(0.2, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), steelPolish, [0, 0.02, 0], { scale: [1.12, 0.95, 1.12], parent: piv });
      for (let i = 1; i <= 4; i++) add("schulter", sph(0.2, 36, 14, 0, Math.PI * 2, 0, Math.PI * 0.44), steel, [0, 0.0 - i * 0.065, 0], { scale: [1.14 - i * 0.045, 0.52, 1.14 - i * 0.045], parent: piv });
      add("schulter", new THREE.CylinderGeometry(0.075, 0.075, 0.012, 28), steelPolish, [0, -0.14, 0.17], { rot: [Math.PI / 2, 0, 0], parent: piv });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; rivet("schulter", piv, Math.cos(a) * 0.2, -0.065, Math.sin(a) * 0.2, 0.009); }

      /* Armzeug */
      add("arm", cyl(0.074, 0.08, 0.36), steel, [0, -0.3, 0], { parent: piv });
      add("arm", sph(0.09, 24, 16), steelPolish, [0, -0.52, 0.02], { scale: [1, 1.05, 1.05], parent: piv });
      add("arm", sph(0.07, 16, 12), steel, [s * 0.075, -0.52, -0.02], { scale: [0.4, 1.4, 1.3], parent: piv });
      add("arm", cyl(0.083, 0.058, 0.4), steel, [0, -0.78, 0], { parent: piv });
      add("arm", new THREE.BoxGeometry(0.016, 0.34, 0.014), steelPolish, [0, -0.78, 0.07], { parent: piv });
      add("arm", cyl(0.08, 0.082, 0.04, true), steelPolish, [0, -0.6, 0], { parent: piv });

      /* Panzerhandschuh */
      add("hand", new THREE.CylinderGeometry(0.058, 0.082, 0.14, 24, 1, true), steel, [0, -1.04, 0], { parent: piv });
      add("hand", new THREE.BoxGeometry(0.1, 0.11, 0.045), steel, [0, -1.17, 0.0], { parent: piv });
      for (const kx of [-0.034, 0, 0.034]) add("hand", sph(0.018, 10, 8), steelPolish, [kx, -1.22, 0.03], { parent: piv });
      for (let f = 0; f < 4; f++) {
        const fx = -0.036 + f * 0.024;
        for (let k = 0; k < 3; k++) add("hand", cyl(0.0125, 0.0115, 0.03, false, 10), steel, [fx, -1.265 - k * 0.032, 0.012 + k * 0.012], { rot: [-0.25 * k, 0, 0], parent: piv });
      }
      for (let k = 0; k < 2; k++) add("hand", cyl(0.013, 0.012, 0.03, false, 10), steel, [s * 0.058, -1.2 - k * 0.03, 0.03 + k * 0.012], { rot: [-0.2, 0, s * 0.45], parent: piv });
    }

    /* Bauchreifen mit Schößen */
    for (let i = 0; i < 5; i++) {
      const r = 0.285 + i * 0.016;
      const ring = add("fauld", cyl(r, r + 0.016, 0.085, true, 48), steel, [0, 1.96 - i * 0.07, 0], { scale: [1.08, 1, 0.8] });
      for (let k = 0; k < 14; k++) { const a = -Math.PI * 0.45 + (k / 13) * Math.PI * 0.9 + Math.PI / 2; rivet("fauld", scene, Math.cos(a) * (r + 0.01) * 1.08, ring.position.y + 0.025, Math.sin(a) * (r + 0.01) * 0.8, 0.008); }
    }
    for (const s of [-1, 1]) {
      add("fauld", sph(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), steel, [s * 0.21, 1.58, 0.17], { rot: [Math.PI, 0, s * 0.15], scale: [0.095, 0.2, 0.05] });
      add("fauld", sph(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), steel, [s * 0.13, 1.56, 0.2], { rot: [Math.PI, 0, s * 0.05], scale: [0.075, 0.17, 0.045] });
    }

    /* Kürass */
    add("brust", cuirassGeometry(), steelPolish, [0, 2.36, 0.01], { scale: [0.37, 0.46, 0.28] });
    add("brust", new THREE.TorusGeometry(0.15, 0.012, 10, 40), steelPolish, [0, 2.78, 0], { rot: [Math.PI / 2, 0, 0], scale: [1.1, 1, 1] });
    add("brust", sph(1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), steel, [0, 2.06, 0.1], { rot: [Math.PI, 0, 0], scale: [0.2, 0.15, 0.12] });
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) rivet("brust", scene, s * 0.34, 2.14 + k * 0.1, 0.08 - k * 0.012, 0.009);

    /* Schaller: Kuppel, Visier, Kamm, langer Nackenschirm, Kinnreff, Halsringe */
    add("helm", sph(0.2, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.6), steelPolish, [0, 3.07, 0.0], { scale: [1, 1.12, 1.25] });
    add("helm", new THREE.ConeGeometry(0.2, 0.46, 36), steel, [0, 3.0, -0.34], { rot: [-Math.PI / 2 - 0.42, 0, 0], scale: [1, 1, 0.5] });
    add("helm", sph(0.212, 40, 16, Math.PI / 2 - 0.62, 1.24, Math.PI * 0.4, Math.PI * 0.15), steel, [0, 3.07, 0.0], { scale: [1, 1.12, 1.25] });
    add("helm", new THREE.BoxGeometry(0.2, 0.014, 0.02), core, [0, 3.07, 0.262]);
    add("helm", new THREE.TorusGeometry(0.21, 0.01, 8, 48, Math.PI), steelPolish, [0, 3.1, 0.0], { rot: [0, Math.PI / 2, 0], scale: [1.2, 1.12, 1] });
    add("helm", sph(0.195, 36, 20, Math.PI / 2 - 1.25, 2.5, Math.PI * 0.62, Math.PI * 0.34), steel, [0, 3.04, 0.07], { scale: [1.02, 1.0, 1.15] });
    for (let i = 0; i < 3; i++) add("helm", cyl(0.125 + i * 0.012, 0.135 + i * 0.012, 0.055, true), steel, [0, 2.9 - i * 0.045, 0.0], { scale: [1, 1, 0.95] });
    for (let k = 0; k < 5; k++) add("helm", sph(0.007, 6, 4), core, [-0.045 + (k % 3) * 0.045, 2.97 - Math.floor(k / 3) * 0.03, 0.235]);

    /* Schwert an der linken Hüfte */
    add("schwert", new THREE.CapsuleGeometry(0.03, 0.88, 6, 16), blued, [-0.5, 1.42, -0.06], { rot: [0.04, 0, 0.1], scale: [1, 1, 0.55] });
    add("schwert", cyl(0.034, 0.034, 0.06), steelPolish, [-0.545, 1.93, -0.07], { rot: [0.04, 0, 0.1] });
    add("schwert", cyl(0.018, 0.018, 0.18), blued, [-0.555, 2.05, -0.07], { rot: [0.04, 0, 0.1] });
    add("schwert", new THREE.BoxGeometry(0.3, 0.026, 0.03), steelPolish, [-0.545, 1.97, -0.07], { rot: [0.04, 0, 0.1] });
    add("schwert", sph(0.035, 16, 12), steelPolish, [-0.57, 2.15, -0.07]);

    for (const [part, geos] of rivetBuckets) {
      const merged = mergeGeometries(geos);
      if (merged) add(part, merged, steelPolish, [0, 0, 0]);
    }

    /* ----- Nachbearbeitung: leuchtende Umrandung ----- */
    const w0 = el.clientWidth || window.innerWidth, h0 = el.clientHeight || window.innerHeight;
    const target = new THREE.WebGLRenderTarget(w0 * dpr, h0 * dpr, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    const outline = new OutlinePass(new THREE.Vector2(w0, h0), scene, camera);
    outline.visibleEdgeColor.set(0xffe2a0); outline.hiddenEdgeColor.set(0xffe2a0);
    outline.edgeGlow = 1.4; outline.edgeThickness = 2.4; outline.edgeStrength = 0; outline.pulsePeriod = 0;
    composer.addPass(outline);
    composer.addPass(new OutputPass());

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.setViewOffset(w, h, 0, -Math.round(h * 0.075), w, h);
      camera.updateProjectionMatrix();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(el);

    /* ----- Interaktion ----- */
    let focus: { c: THREE.Vector3; d: number; speed: number } | null = null;
    const home = new THREE.Vector3(0, 1.62, 0);
    let selected: string | null = null;
    let selT = 0;
    let hint: { id: string; t: number } | null = null;
    let nextHint = 4000, hintIdx = 0;
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
      if (!id) { outline.selectedObjects = []; focus = { c: home.clone(), d: 9.8, speed: 0.07 }; return; }
      outline.selectedObjects = byPart.get(id) ?? [];
      const { c, s } = centerOf(id);
      focus = { c, d: Math.min(8, Math.max(2.2, Math.max(s.x, s.y) * 2.1 + 0.9)), speed: 0.08 };
    };
    api.current.open = () => {
      if (!selected || busy) return;
      busy = true; setDiving(true);
      const { c, s } = centerOf(selected);
      focus = { c, d: Math.max(0.7, Math.max(s.x, s.y) * 0.9), speed: 0.12 };
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

      // Umrandung: Aufblitzen bei Auswahl, danach ruhiges Glimmen. Ohne Auswahl ab und zu ein Hinweis.
      if (selected) {
        const dt = t - selT;
        outline.edgeStrength = 3.2 + 7 * Math.exp(-dt / 280) + 0.5 * Math.sin(t / 420);
        outline.edgeGlow = 1.2 + 1.6 * Math.exp(-dt / 350);
      } else if (hint) {
        const p = (t - hint.t) / 1500;
        if (p >= 1) { hint = null; outline.selectedObjects = []; outline.edgeStrength = 0; }
        else outline.edgeStrength = 2.4 * Math.sin(Math.PI * p);
      } else if (!busy && t > nextHint) {
        const id = PARTS[hintIdx++ % PARTS.length].id;
        hint = { id, t }; outline.selectedObjects = byPart.get(id) ?? []; nextHint = t + 5200;
      }
      composer.render();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose(); composer.dispose(); renderer.dispose(); pm.dispose();
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
        <div className="rk-canvas" ref={mount} />
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
