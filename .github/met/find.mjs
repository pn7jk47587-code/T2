import { chromium } from "playwright";
import fs from "node:fs";
const out = [];
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
p.on("request", (r) => out.push(r.url()));
await p.goto("https://www.metmuseum.org/art/collection/search/24671", { waitUntil: "domcontentloaded", timeout: 90000 });
await p.waitForTimeout(15000);
fs.writeFileSync("out/title.txt", (await p.title()) + "\n");
for (const t of ["View in 3D", "3D"]) {
  const el = p.getByText(t, { exact: false }).first();
  try { await el.click({ timeout: 5000 }); fs.appendFileSync("out/title.txt", "clicked " + t + "\n"); break; } catch {}
}
await p.waitForTimeout(20000);
await p.screenshot({ path: "out/page.png" });
const html = await p.content();
fs.writeFileSync("out/page.html", html);
const hits = [...new Set(out.filter((u) => /\.(glb|gltf|usdz|fbx|json)(\?|$)|masters|3d/i.test(u)))];
fs.writeFileSync("out/requests.txt", hits.join("\n") + "\n\nALL:\n" + [...new Set(out)].join("\n"));
// Datei herunterladen, falls eine .glb geladen wurde
const glb = hits.find((u) => /\.glb(\?|$)/i.test(u));
const masters = hits.find((u) => /masters/i.test(u));
if (masters) { const r = await ctx.request.get(masters); fs.writeFileSync("out/masters.json", await r.body()); }
if (glb) { const r = await ctx.request.get(glb); fs.writeFileSync("model/viewer.glb", await r.body()); }
await b.close();
