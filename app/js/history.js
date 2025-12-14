import { storage } from "./storage-facade.js";

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("sessions-list");
  const sessions = await storage.getSessions();
  list.innerHTML = "";

  sessions
    .sort((a, b) => b.ts - a.ts)
    .forEach((s) => {
      const li = document.createElement("li");
      const d = new Date(s.ts);
      li.textContent = `${d.toLocaleString()}: ${s.steps} steps, ${
        s.distance
      } m`;
      list.appendChild(li);
    });

  document.getElementById("export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sessions.json";
    a.click();
  });

  // Obsługa czyszczenia danych
  document.getElementById("clear-data").addEventListener("click", () => {
    if (confirm("Clear local sessions?")) {
      indexedDB.deleteDatabase("pedometer-db");
      list.innerHTML = "";
      alert("Cleared local DB. Reload the page.");
    }
  });

  const map = {};
  sessions.forEach((s) => {
    const d = new Date(s.ts).toISOString().split("T")[0];
    map[d] = (map[d] || 0) + s.steps;
  });

  drawHistoryChart(map);
});

function drawHistoryChart(map) {
  const canvas = document.getElementById("history-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const mutedColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--muted")
    .trim();

  const keys = Object.keys(map).sort().slice(-14); // Pokaż ostatnie 14 dni
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(500, ...vals);
  const w = canvas.width / (keys.length + 1);
  const h = canvas.height;

  ctx.font = "10px Inter";

  keys.forEach((k, i) => {
    const val = vals[i];
    const barH = (val / max) * (h - 20);

    ctx.fillStyle = accentColor || "#1e88e5";
    ctx.fillRect(w * i + 10, h - barH, w * 0.7, barH);

    ctx.fillStyle = mutedColor || "#6272a4";
    const day = k.split("-")[2];
    ctx.fillText(day, w * i + 10 + w * 0.35, h - 5);
  });
}
