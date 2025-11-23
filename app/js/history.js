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

  document.getElementById("clear-data").addEventListener("click", () => {
    if (confirm("Clear local sessions?")) {
      indexedDB.deleteDatabase("pedometer-db");
      list.innerHTML = "";
      alert("Cleared local DB. Reload the page.");
    }
  });

  // draw simple chart by date
  const map = {};
  sessions.forEach((s) => {
    const d = new Date(s.ts).toISOString().split("T")[0];
    map[d] = (map[d] || 0) + s.steps;
  });
  const canvas = document.getElementById("history-chart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const keys = Object.keys(map).sort().slice(-14);
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(500, ...vals);
  const w = canvas.width / Math.max(1, keys.length);
  ctx.fillStyle = "#4CAF50";
  vals.forEach((v, i) => {
    const h = (canvas.height - 20) * (v / max);
    ctx.fillRect(i * w + 6, canvas.height - 10 - h, w - 10, h);
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.fillText(keys[i].slice(5), i * w + 6, canvas.height - 2);
    ctx.fillStyle = "#4CAF50";
  });
});
