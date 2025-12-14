document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("theme-toggle");
  const textEl = btn.querySelector(".toggle-text");
  const iconEl = btn.querySelector(".toggle-icon");

  let storage = null;
  try {
    const mod = await import("./storage-facade.js");
    storage = mod.storage;
  } catch (err) {
    console.warn("IndexedDB not available, using localStorage only");
  }

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    if (confirm("Czy na pewno chcesz się wylogować?")) {
      localStorage.removeItem("pedometer.userId");
      localStorage.removeItem("pedometer.username");

      window.location.href = "/login.html";
    }
  });

  const initialTheme =
    document.documentElement.getAttribute("data-theme") || "light";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      textEl.textContent = "Light Mode";
      iconEl.textContent = "☀️";
      btn.setAttribute("aria-checked", "true");
    } else {
      textEl.textContent = "Dark Mode";
      iconEl.textContent = "🌙";
      btn.setAttribute("aria-checked", "false");
    }
  }

  applyTheme(initialTheme);

  btn.addEventListener("click", async () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";

    applyTheme(next);
    localStorage.setItem("pedometer.theme", next);

    if (storage) {
      try {
        await storage.setMeta("theme", next);
      } catch (e) {
        console.error("Failed to save theme to IDB", e);
      }
    }
  });

  const g = localStorage.getItem("pedometer.goal") || "5000";
  document.getElementById("goal-input").value = g;
  document.getElementById("save-goal").onclick = () => {
    localStorage.setItem(
      "pedometer.goal",
      document.getElementById("goal-input").value
    );
    alert("Goal saved");
  };

  document.getElementById("clear-storage").onclick = () => {
    if (confirm("Clear all local data?")) {
      indexedDB.deleteDatabase("pedometer-db");
      localStorage.removeItem("pedometer.userId");
      localStorage.removeItem("pedometer.username");
      alert("Cleared");
    }
  };
});
