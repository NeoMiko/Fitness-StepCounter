import { storage } from "./storage-facade.js";

(function applyThemeImmediately() {
  const theme = localStorage.getItem("pedometer.theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
})();

(async function enhanceTheme() {
  try {
    const saved = await storage.getMeta("theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
      localStorage.setItem("pedometer.theme", saved);
    }
  } catch (e) {
    console.warn("Theme sync error:", e);
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  }

  let userId = localStorage.getItem("pedometer.userId");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("pedometer.userId", userId);
  }

  window.APP_CONTEXT = { userId };
});
