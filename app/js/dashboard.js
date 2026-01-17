import { storage } from "./storage-facade.js";

document.addEventListener("DOMContentLoaded", async () => {
  const goal = Number(localStorage.getItem("pedometer.goal") || 5000);
  const todayGoalEl = document.getElementById("today-goal");
  if (todayGoalEl) todayGoalEl.textContent = `Goal: ${goal}`;

  const today = new Date().toISOString().split("T")[0];
  const steps = await storage.getDaily(today);

  const todayStepsEl = document.getElementById("today-steps");
  if (todayStepsEl) todayStepsEl.textContent = steps || 0;

  const progressBar = document.getElementById("bar");
  if (progressBar) {
    const pct = Math.min(100, Math.round(((steps || 0) / goal) * 100));
    progressBar.style.width = pct + "%";
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
      document.getElementById(
        "weather-info"
      ).textContent = `${w.temperature}°C, wind ${w.windspeed} m/s`;
      await storage.setMeta("lastWeather", w);
    } else throw new Error("no weather");
  } catch (err) {
    const last = await storage.getMeta("lastWeather");
    const weatherEl = document.getElementById("weather-info");
    if (weatherEl) {
      weatherEl.textContent = last
        ? `${last.temperature}°C (offline)`
        : "No weather data";
    }
  }

  // Obsługa rankingu
  try {
    const r = await fetch("/.netlify/functions/getRanking");
    if (!r.ok) throw new Error("Serwer zwrócił błąd " + r.status);

    const rows = await r.json();
    const ul = document.getElementById("leaderboard");

    if (ul && Array.isArray(rows)) {
      ul.innerHTML = "";
      const currentUserId =
        window.APP_CONTEXT?.userId || localStorage.getItem("userId");

      rows
        .sort((a, b) => (b.steps_today || 0) - (a.steps_today || 0))
        .forEach((entry, index) => {
          const li = document.createElement("li");
          const isCurrentUser = entry.user_id === currentUserId;

          let iconHTML = "";
          if (index === 0)
            iconHTML =
              '<i class="fa-solid fa-trophy" style="color: #ffd700;"></i>';
          else if (index === 1)
            iconHTML =
              '<i class="fa-solid fa-medal" style="color: #c0c0c0;"></i>';
          else if (index === 2)
            iconHTML =
              '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i>';
          else
            iconHTML =
              '<i class="fa-solid fa-shoe-prints" style="opacity: 0.5;"></i>';

          li.innerHTML = `
            <div class="rank-name">
              <span class="rank-icon">${iconHTML}</span>
              ${entry.username || "Anonim"} ${
            isCurrentUser ? "<small>(Ty)</small>" : ""
          }
            </div>
            <div class="rank-steps">
              ${entry.steps_today || 0} <span>steps</span>
            </div>
          `;

          if (isCurrentUser) {
            li.style.borderColor = "var(--accent)";
            li.style.backgroundColor = "rgba(30, 136, 229, 0.1)";
          }

          ul.appendChild(li);
        });
    }
  } catch (e) {
    console.warn("ranking error", e);
    const ul = document.getElementById("leaderboard");
    if (ul) ul.innerHTML = '<li class="muted">Ranking niedostępny</li>';
  }

  // Rysowanie wykresu tygodniowego
  try {
    const daily = await storage.getAll("daily");
    if (Array.isArray(daily)) {
      const map = {};
      daily.forEach((d) => (map[d.date] = d.steps));
      drawWeekChart(map);
    }
  } catch (e) {
    console.error("Chart data error", e);
  }
});

function drawWeekChart(map) {
  const canvas = document.getElementById("week-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // ostrości wykresu na ekranach mobilnych
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

  const chartWidth = rect.width;
  const chartHeight = rect.height - 40;
  const barWidth = (chartWidth - 40) / 7;

  ctx.font = "10px Inter";

  keys.forEach((k, i) => {
    const val = vals[i];
    const barH = (val / max) * chartHeight;
    const x = 20 + i * (barWidth + 4);
    const y = rect.height - 25 - barH;

    // Rysowanie słupka
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Podpis dnia
    ctx.fillStyle = mutedColor;
    ctx.textAlign = "center";
    const day = k.split("-")[2];
    ctx.fillText(day, x + barWidth / 2, rect.height - 10);
  });
}
