import { storage } from "./storage-facade.js";

document.addEventListener("DOMContentLoaded", async () => {
  //  Pobieranie podstawowych danych użytkownika
  const userId = localStorage.getItem("userId") || window.APP_CONTEXT?.userId;
  const username = localStorage.getItem("username") || "Użytkownik";
  const goal = Number(localStorage.getItem("pedometer.goal") || 5000);

  const todayGoalEl = document.getElementById("today-goal");
  if (todayGoalEl) todayGoalEl.textContent = `Cel: ${goal}`;

  const today = new Date().toISOString().split("T")[0];
  const steps = (await storage.getDaily(today)) || 0;

  const todayStepsEl = document.getElementById("today-steps");
  if (todayStepsEl) todayStepsEl.textContent = steps;

  const progressBar = document.getElementById("bar");
  if (progressBar) {
    const pct = Math.min(100, Math.round((steps / goal) * 100));
    progressBar.style.width = pct + "%";
  }

  // SYNCHRONIZACJA Z RANKINGIEM
  if (userId && userId !== "anon") {
    try {
      await fetch("/.netlify/functions/updateRanking", {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
          username: username,
          date: today,
          stepsToday: steps,
        }),
      });
    } catch (err) {
      console.error("Sync ranking error:", err);
    }
  }

  // Obsługa pogody
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
    );
    const res = await fetch(
      `/.netlify/functions/fetchWeather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
    );
    const json = await res.json();
    if (json?.current_weather) {
      const w = json.current_weather;
      const weatherEl = document.getElementById("weather-info");
      if (weatherEl)
        weatherEl.textContent = `${w.temperature}°C, wiatr ${w.windspeed} m/s`;
      await storage.setMeta("lastWeather", w);
    }
  } catch (err) {
    const last = await storage.getMeta("lastWeather");
    const weatherEl = document.getElementById("weather-info");
    if (weatherEl) {
      weatherEl.textContent = last
        ? `${last.temperature}°C (offline)`
        : "Brak danych pogodowych";
    }
  }

  // Obsługa wyświetlania rankingu
  try {
    const r = await fetch("/.netlify/functions/getRanking");
    if (!r.ok) throw new Error("Błąd serwera");

    const rows = await r.json();
    const ul = document.getElementById("leaderboard");

    if (ul && Array.isArray(rows)) {
      ul.innerHTML = "";

      rows
        .sort((a, b) => (b.steps_today || 0) - (a.steps_today || 0))
        .forEach((entry, index) => {
          const li = document.createElement("li");
          const isCurrentUser = entry.username === username;

          let iconHTML =
            '<i class="fa-solid fa-shoe-prints" style="opacity: 0.5;"></i>';
          if (index === 0)
            iconHTML =
              '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i>';
          else if (index === 1)
            iconHTML =
              '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i>';
          else if (index === 2)
            iconHTML =
              '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i>';

          li.innerHTML = `
            <div class="rank-name">
              <span class="rank-icon">${iconHTML}</span>
              ${entry.username || "Anonim"} ${
            isCurrentUser ? "<small>(Ty)</small>" : ""
          }
            </div>
            <div class="rank-steps">
              ${entry.steps_today || 0} <span>kroków</span>
            </div>
          `;

          if (isCurrentUser) {
            li.classList.add("current-user-row");
            li.style.backgroundColor = "rgba(30, 136, 229, 0.1)";
            li.style.borderLeft = "4px solid var(--accent)";
          }
          ul.appendChild(li);
        });
    }
  } catch (e) {
    console.warn("Ranking error", e);
    const ul = document.getElementById("leaderboard");
    if (ul) ul.innerHTML = '<li class="muted">Ranking niedostępny</li>';
  }

  //  Rysowanie wykresu
  const daily = await storage.getAll("daily");
  if (Array.isArray(daily)) {
    const map = {};
    daily.forEach((d) => (map[d.date] = d.steps));
    drawWeekChart(map);
  }
});

function drawWeekChart(map) {
  const canvas = document.getElementById("week-chart");
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
      .trim() || "#888";
  const keys = Object.keys(map).sort().slice(-7);
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(2000, ...vals);
  const chartHeight = rect.height - 40;
  const barWidth = (rect.width - 40) / 7;
  ctx.font = "10px Inter";
  keys.forEach((k, i) => {
    const val = vals[i];
    const barH = (val / max) * chartHeight;
    const x = 20 + i * (barWidth + 4);
    const y = rect.height - 25 - barH;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
    ctx.fill();
    ctx.fillStyle = mutedColor;
    ctx.textAlign = "center";
    ctx.fillText(k.split("-")[2], x + barWidth / 2, rect.height - 10);
  });
}
