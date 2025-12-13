import { storage } from "./storage-facade.js";

(async function initTheme() {
  try {
    const savedTheme =
      (await storage.getMeta("theme")) ||
      localStorage.getItem("theme") ||
      "light";

    document.documentElement.setAttribute("data-theme", savedTheme);
  } catch (err) {
    const fallbackTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", fallbackTheme);
  }
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

  window.APP_CONTEXT = {
    userId,
  };
});
