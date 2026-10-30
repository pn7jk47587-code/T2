import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// SINGLE_FILE=1 erzeugt eine einzelne HTML-Datei (für die Vorschau im Chat).
const single = process.env.SINGLE_FILE === "1";

export default defineConfig({
  base: "./",
  plugins: [react(), ...(single ? [viteSingleFile()] : [])],
});
