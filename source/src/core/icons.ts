/**
 * Symbole der Schmiede. Jedes Symbol besteht nur aus SVG-Pfaden, damit es sowohl als Kachel
 * (SVG) als auch als leuchtende Rune auf der Rüstung (Canvas, Path2D) gezeichnet werden kann.
 * Raster 24 x 24, Linienstärke kommt vom Stil.
 */
export const ICONS: Record<string, string[]> = {
  // Mondsichel mit Stern (die Mondsichel ist auch das Zeichen Heinrichs II.)
  zyklus: ["M14 3.5a8.5 8.5 0 1 0 0 17a7 7 0 0 1 0-17Z", "M18.5 9.5v5M16 12h5"],
  // Glocke
  erinnerungen: ["M12 3v2", "M7 16c0-6.2 1.6-10.5 5-10.5s5 4.3 5 10.5", "M4.5 16h15", "M12 16v2.2", "M10.8 19.4a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0Z"],
  // Strahlendes Herz
  gefuehle: ["M12 20.5s-7.5-4.6-7.5-9.8A3.9 3.9 0 0 1 12 8.6a3.9 3.9 0 0 1 7.5 2.1c0 5.2-7.5 9.8-7.5 9.8Z", "M12 6.2V3.2M8.7 6.9 7.2 4.4M15.3 6.9l1.5-2.5"],
  // Amboss
  gewohnheiten: ["M3 7.5h11.5c0 2.6 2 3.7 6 3.7V13h-7.2c-1.1 0-1.8.7-1.8 1.8v1.7h2.8v2.8H6.7v-2.8h2.8v-1.7c0-1.1-.7-1.8-1.8-1.8H6.4C4.3 13 3 11.6 3 9.6V7.5Z"],
  // Münze mit Kreuz
  finanzen: ["M12 3.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 1 1 0-17Z", "M12 6.5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 1 1 0-11Z", "M12 9v6M9 12h6"],
  // Schlüssel
  fundorte: ["M12 3a3.2 3.2 0 1 1 0 6.4A3.2 3.2 0 1 1 12 3Z", "M12 9.4V21", "M12 17.5h3.6V21H12M12 14.6h2.6"],
  // Wachturm
  analytics: ["M7 21V9.5h10V21", "M6 9.5V5h2.6v2h2.1V5h2.6v2h2.1V5H18v4.5", "M10.4 21v-3.3a1.6 1.6 0 0 1 3.2 0V21", "M12 11.8v2.4", "M4.5 21h15"],
  // Buch mit Schließe
  archiv: ["M6 3.5h11.5v17H6z", "M8.6 3.5v17", "M17.5 10.5h-3.2v3h3.2"],
  // Schmiedehammer
  einstellungen: ["M10.6 8.4 15.3 3.7l4.9 4.9-4.7 4.7Z", "M12.9 10.7 4 19.6"],
};

export const UI_ICONS: Record<string, string[]> = {
  back: ["m14.5 5.5-6.5 6.5 6.5 6.5"],
  trash: ["M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7"],
};
