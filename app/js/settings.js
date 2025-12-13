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

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      textEl.textContent = "Light Mode";
      iconEl.textContent = "☀️";
    } else {
      textEl.textContent = "Dark Mode";
      iconEl.textContent = "🌙";
    }
  }

  async function loadTheme() {
    let theme = localStorage.getItem("theme") || "light";

    if (storage) {
      try {
        theme = (await storage.getMeta("theme")) || theme;
      } catch {}
    }

    applyTheme(theme);
  }

  btn.addEventListener("click", async () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";

    const next = current === "dark" ? "light" : "dark";

    applyTheme(next);
    localStorage.setItem("theme", next);

    if (storage) {
      try {
        await storage.setMeta("theme", next);
      } catch {}
    }
  });

  loadTheme();
});
