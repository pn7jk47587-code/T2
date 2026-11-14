/** Formelbuch: Übungstexte zerlegen und Antworten bewerten. */
import type { Klausur, Uebung } from "../data/klausuren";

export interface Luecke { key: string; antworten: string[] }
export type Teil = { t: string } | { l: Luecke };
export interface Zeile { ebene: number; teile: Teil[]; tipp?: string; luecken: Luecke[] }

export function zerlege(k: Klausur, u: Uebung): Zeile[] {
  let n = 0;
  return u.text.split("\n").filter((z) => z.trim()).map((roh) => {
    const ebene = Math.floor((roh.length - roh.trimStart().length) / 2);
    const [text, tipp] = roh.trim().split(/\s+\/\/\s+/);
    const teile: Teil[] = []; const luecken: Luecke[] = [];
    text.split(/(\{[^}]*\})/).forEach((s) => {
      if (!s) return;
      if (s.startsWith("{")) { const l = { key: `${k.id}.${u.id}.${n++}`, antworten: s.slice(1, -1).split("|").map((x) => x.trim()) }; teile.push({ l }); luecken.push(l); }
      else teile.push({ t: s });
    });
    return { ebene, teile, tipp, luecken };
  });
}

const STOPP = new Set("der die das des den dem und oder ein eine einer eines einem einen in im von vom zu zur zum mit auf fuer als an am bei nach aus".split(" "));
const norm = (s: string) => s.toLowerCase()
  .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/\babsatz\b/g, "abs").replace(/\bsatz\b/g, "s").replace(/\bnummer\b/g, "nr").replace(/\beuro\b/g, "€").replace(/%/g, " prozent ")
  .replace(/[^a-z0-9€ ]+/g, " ").replace(/\bii\b/g, "2").replace(/\s+/g, " ").trim();

function abstand(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}

/** Richtig, wenn die Eingabe einer Lösung entspricht oder deren tragende Wörter (mit Tippfehlertoleranz) enthält */
export function richtig(eingabe: string, antworten: string[]) {
  const e = norm(eingabe); if (!e) return false;
  const et = e.split(" ");
  return antworten.some((a) => {
    const n = norm(a); if (n === e) return true;
    const soll = n.split(" ").filter((w) => !STOPP.has(w)); if (!soll.length) return false;
    const treffer = soll.filter((w) => et.some((x) => (/\d/.test(w) || w.length <= 3 ? x === w : abstand(x, w) <= (w.length > 6 ? 2 : 1)))).length;
    return treffer / soll.length >= (soll.length <= 2 ? 1 : 0.75);
  });
}

/** Wink: Anfangsbuchstaben jedes Wortes */
export const wink = (a: string) => a.split(" ").map((w) => (/^[§\d]/.test(w) ? w : w[0] + "·".repeat(Math.max(0, w.length - 1)))).join(" ");
