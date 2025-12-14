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
  let username = localStorage.getItem("pedometer.username");

  const currentPath = window.location.pathname;

  if (!userId || !username) {
    if (
      !currentPath.includes("/login.html") &&
      !currentPath.endsWith("/") &&
      !currentPath.endsWith("/index.html")
    ) {
      window.location.href = "/login.html";
      return;
    }
  } else if (currentPath.includes("/login.html")) {
    window.location.href = "/dashboard.html";
    return;
  }

  window.APP_CONTEXT = {
    userId: userId,
    username: username,
  };

  const userEl = document.getElementById("user-welcome");
  if (userEl && username) {
    userEl.textContent = `Witaj, ${username}!`;
  }

  const idEl = document.getElementById("user-id-display");
  if (idEl && userId) {
    idEl.textContent = `ID Użytkownika: ${userId.substring(0, 8)}...`;
  }
});
