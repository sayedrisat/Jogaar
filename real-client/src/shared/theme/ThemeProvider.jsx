import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { ThemeContext } from "./ThemeContext";

const STORAGE_KEY = "jogaar-theme";
const MODES = ["light", "dark", "auto"];

function readSavedMode() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return MODES.includes(saved) ? saved : "auto";
  } catch {
    return "auto";
  }
}

function subscribeToSystemTheme(onChange) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readSavedMode);
  const prefersDark = useSyncExternalStore(subscribeToSystemTheme, systemPrefersDark, () => false);
  const resolvedMode = mode === "auto" ? (prefersDark ? "dark" : "light") : mode;

  // Update the whole document before paint, including when Auto follows the OS.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedMode;
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  function changeMode(nextMode) {
    if (!MODES.includes(nextMode)) return;
    setMode(nextMode);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    } catch {
      // The theme still works for this visit if storage is unavailable.
    }
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode: changeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
