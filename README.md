# App

Kleine Web-App mit lokaler Speicherung im Browser.

`index.html` im Hauptverzeichnis ist die gebaute App. Der Quellcode liegt in `source/`.

```bash
cd source
npm install
npm run dev
SINGLE_FILE=1 npx vite build --outDir ../dist-single
```
