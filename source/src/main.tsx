import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installShields } from "./core/shapes";
import "./fonts.css";
import "./styles/theme.css";
import "./styles/app.css";
import "./styles/skins.css";

installShields();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
