(function applyThemeImmediately() {
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
})();

import { storage } from "./storage-facade";
(async function enhanceTheme() {
  try {
    const saved = await storage.getMeta("theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
      localStorage.setItem("theme", saved);
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
  }

  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userId", userId);
  }

  window.APP_CONTEXT = { userId };
});
