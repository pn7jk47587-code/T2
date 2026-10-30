/** Wappenformen im Raster 100 x 120. */
export interface Shield { id: string; name: string; d: string }

export const SHIELDS: Shield[] = [
  { id: "dreieck", name: "Dreieckschild", d: "M10 8H90V52C90 86 70 106 50 115C30 106 10 86 10 52Z" },
  { id: "halbrund", name: "Halbrundschild", d: "M10 8H90V72A40 40 0 0 1 10 72Z" },
  { id: "franzoesisch", name: "Französischer Schild", d: "M10 8H90V88Q90 100 78 100H62Q53 100 50 113Q47 100 38 100H22Q10 100 10 88Z" },
  { id: "tartsche", name: "Tartsche", d: "M12 12Q50 2 88 12L85 38Q76 43 85 50L88 70Q86 104 50 115Q14 104 12 70Z" },
  { id: "rossstirn", name: "Rossstirnschild", d: "M50 5C78 5 92 20 88 40C84 52 94 62 90 80C86 100 64 115 50 115C36 115 14 100 10 80C6 62 16 52 12 40C8 20 22 5 50 5Z" },
  { id: "raute", name: "Rautenschild", d: "M50 4L92 60L50 116L8 60Z" },
  { id: "rund", name: "Rundschild", d: "M50 14A46 46 0 1 1 49.9 14Z" },
  { id: "kartusche", name: "Kartusche", d: "M50 6C74 6 90 30 90 60C90 90 74 114 50 114C26 114 10 90 10 60C10 30 26 6 50 6Z" },
];

export const getShield = (id: string) => SHIELDS.find((s) => s.id === id) ?? SHIELDS[0];
