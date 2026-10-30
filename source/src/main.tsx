import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installShapes } from "./core/shapes";
import "./styles/theme.css";
import "./styles/app.css";
import "./styles/skins.css";

installShapes();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
