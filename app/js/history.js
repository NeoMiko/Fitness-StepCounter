import { storage } from "./storage-facade.js";

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("sessions-list");
  const userId = localStorage.getItem("userId") || "anon";
  let allSessions = [];

  // Pobieranie danych
  try {
    const res = await fetch(
      `/.netlify/functions/getActivities?userId=${userId}`
    );
    if (res.ok) {
      allSessions = await res.json();
    } else {
      throw new Error("Serwer offline");
    }
  } catch (err) {
    console.warn("Pobieranie online nieudane, ładuję z IndexedDB:", err);
    allSessions = await storage.getSessions();
  }

  renderSessions(allSessions, list);

  // Generowanie mapy do wykresu
  const chartMap = {};
  allSessions.forEach((s) => {
    const d = new Date(parseInt(s.ts)).toISOString().split("T")[0];
    chartMap[d] = (chartMap[d] || 0) + parseInt(s.steps);
  });
  drawHistoryChart(chartMap);

  // Obsługa Exportu JSON
  document.getElementById("export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(allSessions, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `treningi_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  });

  // Obsługa czyszczenia danych
  document.getElementById("clear-data").addEventListener("click", () => {
    if (
      confirm(
        "Czy na pewno chcesz wyczyścić LOKALNĄ bazę danych? (Dane w chmurze pozostaną bezpieczne)"
      )
    ) {
      indexedDB.deleteDatabase("pedometer-db");
      list.innerHTML =
        '<li class="muted">Baza wyczyszczona. Odśwież stronę.</li>';
    }
  });
});

function renderSessions(sessions, container) {
  if (!container) return;
  container.innerHTML = "";

  if (sessions.length === 0) {
    container.innerHTML =
      '<li class="muted">Brak zarejestrowanych aktywności.</li>';
    return;
  }

  sessions
    .sort((a, b) => b.ts - a.ts)
    .forEach((s) => {
      const dateObj = new Date(parseInt(s.ts));
      const dateStr = dateObj.toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const li = document.createElement("li");
      li.className = "card activity-card";
      li.style.listStyle = "none";
      li.style.margin = "10px 0";

      li.innerHTML = `
                <div class="activity-header">
                    <span class="activity-date"><i class="fa-solid fa-calendar-check"></i> ${dateStr}</span>
                    <span class="activity-id">ID: ${s.id || "N/A"}</span>
                </div>
                <div class="row stats-row" style="margin-top: 10px; justify-content: space-between;">
                    <div class="metric">
                        <div class="label">Kroki</div>
                        <div class="value">${s.steps}</div>
                    </div>
                    <div class="metric">
                        <div class="label">Dystans</div>
                        <div class="value">${parseFloat(
                          s.distance || 0
                        ).toFixed(2)} km</div>
                    </div>
                    <div class="metric">
                        <div class="label">Tempo</div>
                        <div class="value">${Math.round(
                          s.pace || 0
                        )} <small>spm</small></div>
                    </div>
                </div>
            `;
      container.appendChild(li);
    });
}

function drawHistoryChart(map) {
  const canvas = document.getElementById("history-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const accentColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#1e88e5";
  const mutedColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--muted")
      .trim() || "#6272a4";

  const keys = Object.keys(map).sort().slice(-14);
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(2000, ...vals);

  const chartWidth = rect.width;
  const chartHeight = rect.height - 40;
  const barWidth = (chartWidth - 40) / Math.max(1, keys.length);

  ctx.font = "10px Inter";

  keys.forEach((k, i) => {
    const val = vals[i];
    const barH = (val / max) * chartHeight;
    const x = 20 + i * (barWidth + 4);
    const y = rect.height - 25 - barH;

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
    } else {
      ctx.fillRect(x, y, barWidth, barH);
    }
    ctx.fill();

    ctx.fillStyle = mutedColor;
    ctx.textAlign = "center";
    const day = k.split("-")[2];
    ctx.fillText(day, x + barWidth / 2, rect.height - 10);
  });
}
