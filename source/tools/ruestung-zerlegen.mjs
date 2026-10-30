import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { prune, weld, simplify, textureCompress, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const MODE = process.argv[2] || "debug";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const doc = await io.read("henry2.glb");
const root = doc.getRoot();
const node = root.listNodes().find((n) => n.getName() === "A19_mdl_n3d");
const world = node.getWorldMatrix();
const yaw = (30 * Math.PI) / 180, cy = Math.cos(yaw), sy = Math.sin(yaw);
const prims = node.getMesh().listPrimitives();

// Positionen in normierter Lage (Front +z, Boden y=0)
const XS = [], offs = []; let nV = 0;
for (const p of prims) {
  const pos = p.getAttribute("POSITION"); const n = pos.getCount(); const v = [0, 0, 0]; const a = new Float32Array(n * 3); const m = world;
  for (let k = 0; k < n; k++) {
    pos.getElement(k, v);
    const x = m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12], y = m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13], z = m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14];
    a[k*3] = cy*x + sy*z; a[k*3+1] = y + 1.0581; a[k*3+2] = -sy*x + cy*z;
  }
  XS.push(a); offs.push(nV); nV += n;
}
// Zusammenhangskomponenten über verschweißte Positionen
const X = new Float32Array(nV * 3); XS.forEach((a, i) => X.set(a, offs[i] * 3));
const key = new Map(); const rep = new Int32Array(nV);
for (let i = 0; i < nV; i++) { const k = Math.round(X[i*3]*20000)+","+Math.round(X[i*3+1]*20000)+","+Math.round(X[i*3+2]*20000); let r = key.get(k); if (r === undefined) { r = i; key.set(k, i); } rep[i] = r; }
const par = new Int32Array(nV); for (let i = 0; i < nV; i++) par[i] = i;
const f = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
const IA = prims.map((p) => p.getIndices().getArray());
IA.forEach((ia, pi) => { for (let t = 0; t < ia.length; t += 3) { const a = f(rep[ia[t]+offs[pi]]), b = f(rep[ia[t+1]+offs[pi]]), c = f(rep[ia[t+2]+offs[pi]]); par[a] = b; par[f(b)] = f(c); } });
const csize = new Map();
IA.forEach((ia, pi) => { for (let t = 0; t < ia.length; t += 3) { const r = f(rep[ia[t]+offs[pi]]); csize.set(r, (csize.get(r) || 0) + 1); } });
let helmRoot = -1, best = 0;
for (const [r, n] of csize) { if (n < 1500000 && n > best) { best = n; helmRoot = r; } }

const HANDZ = Number(process.env.HANDZ || 0.15);
function label(x, y, z, comp) {
  if (comp === helmRoot) return "helm";
  const ax = Math.abs(x);
  if (y > 1.42) return ax > 0.16 ? "schulter" : "brust";
  if (y > 1.25) { if (ax > 0.175) return "schulter"; return z < 0.0 ? "ruecken" : "brust"; }
  if (y > 1.06) { if (ax > 0.19) return "arm"; return z < 0.0 ? "ruecken" : "brust"; }
  if (y > 0.86 && y < 1.07 && x > 0.04 && (z > 0.175 || (x > 0.14 && z > 0.14))) return "hand";
  if (y > 0.97) return ax > 0.19 && !(x > 0 && z < 0.07 && y < 1.06) ? "arm" : "fauld";
  if (y > 0.68) return x < -0.21 ? "hand" : "fauld";
  if (y > 0.66) return "fauld";
  if (y > 0.12) return "bein";
  return "schuh";
}

const parts = ["helm", "brust", "ruecken", "fauld", "schulter", "arm", "hand", "bein", "schuh"];
const colors = { helm: [1,.3,.3,1], brust: [.3,1,.3,1], ruecken: [.2,.5,.2,1], fauld: [.3,.5,1,1], schulter: [1,1,.3,1], arm: [1,.5,0,1], hand: [1,.3,1,1], bein: [.3,1,1,1], schuh: [.6,.6,.6,1] };
const counts = {}; const HIST = {};
const buckets = parts.map(() => prims.map(() => []));
IA.forEach((ia, pi) => {
  const o = offs[pi];
  for (let t = 0; t < ia.length; t += 3) {
    const r = f(rep[ia[t]+o]);
    if ((csize.get(r) || 0) < 300) continue;
    let cx = 0, cy2 = 0, cz = 0;
    for (let j = 0; j < 3; j++) { const v = ia[t+j]+o; cx += X[v*3]; cy2 += X[v*3+1]; cz += X[v*3+2]; }
    if (process.env.PROBE) { const X0=cx/3,Y0=cy2/3,Z0=cz/3; if (X0>0.0 && X0<0.2 && Y0>0.86 && Y0<1.07) { const zb=Math.round(Z0*100); const xb=Math.round(X0*50)/50; const k=xb.toFixed(2)+'|'+zb; HIST[k]=(HIST[k]||0)+1; } }
    const l = label(cx/3, cy2/3, cz/3, r);
    const li = parts.indexOf(l); counts[l] = (counts[l] || 0) + 1;
    buckets[li][pi].push(ia[t], ia[t+1], ia[t+2]);
  }
});
console.log(counts); if (process.env.PROBE) { const xs=[...new Set(Object.keys(HIST).map(k=>k.split('|')[0]))].sort(); for (const xb of xs){ const row=Object.entries(HIST).filter(([k])=>k.startsWith(xb+'|')).map(([k,v])=>[+k.split('|')[1],v]).sort((a,b)=>a[0]-b[0]); console.log(xb, row.map(([z,v])=>z+':'+v).join(' ')); } process.exit(0); }

// Neuer Aufbau: ein Knoten je Teil, Drehung und Bodenversatz auf einem neuen Wurzelknoten
const scene = root.listScenes()[0];
const top = doc.createNode("Ruestung").setRotation([0, Math.sin(yaw/2), 0, Math.cos(yaw/2)]).setTranslation([0, 1.0581, 0]);
for (const c of scene.listChildren()) { scene.removeChild(c); top.addChild(c); }
scene.addChild(top);
const oldMesh = node.getMesh();
parts.forEach((pname, li) => {
  const mesh = doc.createMesh(pname);
  prims.forEach((p, pi) => {
    const tri = buckets[li][pi]; if (!tri.length) return;
    const np = p.clone();
    np.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(tri)).setBuffer(p.getIndices().getBuffer()));
    if (MODE === "debug") np.setMaterial(doc.createMaterial(pname).setBaseColorFactor(colors[pname]).setMetallicFactor(0).setRoughnessFactor(.6));
    mesh.addPrimitive(np);
  });
  node.addChild(doc.createNode(pname).setMesh(mesh));
});
node.setMesh(null); oldMesh.dispose();

if (MODE === "debug") {
  for (const m of root.listMaterials()) if (!parts.includes(m.getName())) m.dispose();
  for (const t of root.listTextures()) t.dispose();
  await doc.transform(prune());
  doc.createExtension(KHRDracoMeshCompression).setRequired(true);
  await io.write("debug.glb", doc);
} else {
  // Nur Normalen- und Okklusionstextur behalten, Farbe kommt später als Stahl aus der App
  for (const m of root.listMaterials()) { m.setBaseColorTexture(null); m.setMetallicRoughnessTexture(null); m.setBaseColorFactor([0.62,0.64,0.67,1]).setMetallicFactor(1).setRoughnessFactor(0.3); }
  await doc.transform(
    prune(), dedup(), weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: Number(process.argv[3] || 0.35), error: 0.0004 }),
    textureCompress({ encoder: sharp, targetFormat: "jpeg", resize: [2048, 2048], quality: 82 }),
    prune()
  );
  doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12 });
  await io.write("armor.glb", doc);
}
