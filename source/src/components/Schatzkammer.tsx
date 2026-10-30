import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { kvGet, kvSet, useStored } from "../core/db";

/**
 * Testkasten "Schatzkammer". Eigene 3D-Scans (GLB) werden aus einer Datei geladen,
 * lokal in IndexedDB abgelegt und auf Regalbrettern in einem kleinen Raum gezeigt.
 * Das Scannen selbst passiert in einer Scan-App (z. B. Polycam, Scaniverse, Luma),
 * ein Browser kann aus Kamerabildern keine 3D-Modelle berechnen.
 */
interface Treasure {
  id: string;
  name: string;
  size: number;
  createdAt: number;
}

const MAX_ITEMS = 8;
const MAX_BYTES = 40 * 1024 * 1024;
const PER_SHELF = 4;
const SLOT = 1.15;

const blobKey = (id: string) => `schatz:${id}`;
const mb = (n: number) => (n / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";

function slotPosition(i: number): [number, number] {
  const row = Math.floor(i / PER_SHELF);
  const col = i % PER_SHELF;
  const x = (col - (PER_SHELF - 1) / 2) * SLOT;
  const y = row === 0 ? 0.62 : 1.72;
  return [x, y];
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
      Object.values(x).forEach((v) => {
        if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
      });
      x.dispose();
    });
  });
}

function parseGlb(buf: ArrayBuffer): Promise<THREE.Object3D> {
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buf.slice(0), "", (g) => resolve(g.scene), reject);
  });
}

/** Skaliert ein Modell auf eine Kantenlänge von 0,85 und setzt es mit der Unterseite auf y = 0. */
function normalize(obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const s = 0.85 / longest;
  const center = box.getCenter(new THREE.Vector3());
  const holder = new THREE.Group();
  obj.position.set(-center.x, -box.min.y, -center.z);
  holder.add(obj);
  holder.scale.setScalar(s);
  const wrap = new THREE.Group();
  wrap.add(holder);
  return wrap;
}

export function Schatzkammer() {
  const mount = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useStored<Treasure[]>("schatz", []);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const sceneApi = useRef<{ setItems: (list: Treasure[]) => void } | null>(null);

  // Szene aufbauen
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setMsg("3D-Darstellung wird von diesem Browser nicht unterstützt.");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a0b);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 1.5, 5.6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.25, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 2.2;
    controls.maxDistance = 7.5;
    controls.minAzimuthAngle = -0.9;
    controls.maxAzimuthAngle = 0.9;
    controls.minPolarAngle = 0.9;
    controls.maxPolarAngle = 1.75;

    // Raum: Boden, Rückwand, zwei Regalbretter
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b2a27, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.8 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), wallMat);
    wall.position.set(0, 3, -1.1);
    scene.add(wall);
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x6b4d36, roughness: 0.55, metalness: 0.1 });
    for (const y of [0.55, 1.65]) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(PER_SHELF * SLOT + 0.4, 0.07, 1.0), boardMat);
      board.position.set(0, y - 0.035, -0.55);
      scene.add(board);
    }
    const key = new THREE.SpotLight(0xffe9c4, 40, 14, 0.7, 0.6, 1.6);
    key.position.set(1.5, 4.2, 4);
    key.target.position.set(0, 1.2, 0);
    scene.add(key, key.target);

    const group = new THREE.Group();
    scene.add(group);

    let token = 0;
    async function setList(list: Treasure[]) {
      const mine = ++token;
      const next: THREE.Group[] = [];
      for (let i = 0; i < list.length; i++) {
        const buf = await kvGet<ArrayBuffer>(blobKey(list[i].id));
        if (mine !== token) return;
        if (!buf) continue;
        try {
          const obj = normalize(await parseGlb(buf));
          const [x, y] = slotPosition(i);
          obj.position.set(x, y, -0.55);
          obj.userData.id = list[i].id;
          next.push(obj);
        } catch {
          setMsg(`„${list[i].name}“ konnte nicht gelesen werden.`);
        }
      }
      if (mine !== token) return;
      group.children.slice().forEach((c) => {
        group.remove(c);
        disposeObject(c);
      });
      next.forEach((o) => group.add(o));
    }
    sceneApi.current = { setItems: (l) => void setList(l) };
    void setList(itemsRef.current);

    // Antippen wählt ein Objekt
    const ray = new THREE.Raycaster();
    let downAt = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
      const r = renderer.domElement.getBoundingClientRect();
      const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(p, camera);
      const hit = ray.intersectObjects(group.children, true)[0];
      let o: THREE.Object3D | null = hit?.object ?? null;
      while (o && !o.userData.id) o = o.parent;
      setSelected(o ? (o.userData.id as string) : null);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      token++;
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      controls.dispose();
      disposeObject(scene);
      pm.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      sceneApi.current = null;
    };
  }, []);

  // Szene neu füllen, sobald sich die Liste ändert
  const ids = items.map((i) => i.id).join(",");
  useEffect(() => {
    sceneApi.current?.setItems(itemsRef.current);
  }, [ids]);

  async function addFile(file?: File) {
    if (!file) return;
    setMsg("");
    if (!/\.glb$/i.test(file.name)) return setMsg("Bitte eine GLB-Datei wählen (Export aus der Scan-App als „GLB“).");
    if (file.size > MAX_BYTES) return setMsg(`Datei zu groß (${mb(file.size)}). Erlaubt sind ${mb(MAX_BYTES)}.`);
    if (itemsRef.current.length >= MAX_ITEMS) return setMsg(`Die Kammer fasst ${MAX_ITEMS} Objekte.`);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      await parseGlb(buf); // Prüfung, bevor etwas gespeichert wird
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      await kvSet(blobKey(id), buf);
      setItems((l) => [...l, { id, name: file.name.replace(/\.glb$/i, ""), size: file.size, createdAt: Date.now() }]);
    } catch {
      setMsg("Die Datei ist keine lesbare GLB-Datei.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    await kvSet(blobKey(id), undefined);
    setItems((l) => l.filter((i) => i.id !== id));
    setSelected(null);
  }

  const sel = items.find((i) => i.id === selected);

  return (
    <section className="card sk" aria-label="Schatzkammer (Test)">
      <div className="sk-head">
        <h2>Schatzkammer</h2>
        <span className="chip">Test</span>
      </div>
      <div className="sk-view" ref={mount}>
        {items.length === 0 && <div className="sk-empty">Noch leer. Lade ein gescanntes Objekt als GLB-Datei hoch.</div>}
      </div>
      <div className="sk-bar">
        <div className="sk-info">
          {sel ? (
            <>
              <b>{sel.name}</b>
              <small>{mb(sel.size)}</small>
            </>
          ) : (
            <small>
              {items.length} von {MAX_ITEMS} Plätzen belegt
            </small>
          )}
        </div>
        {sel && (
          <button className="chip" onClick={() => remove(sel.id)}>
            Entfernen
          </button>
        )}
        <button className="chip ok" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Lädt …" : "GLB hinzufügen"}
        </button>
        <input ref={fileRef} type="file" accept=".glb,model/gltf-binary" hidden onChange={(e) => addFile(e.target.files?.[0])} />
      </div>
      {msg && <p className="sk-msg">{msg}</p>}
      <p className="sk-hint">Scan mit Polycam, Scaniverse oder Luma, Export als GLB, Datei hier auswählen. Alles bleibt auf diesem Gerät.</p>
    </section>
  );
}
