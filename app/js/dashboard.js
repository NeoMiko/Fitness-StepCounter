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
      rows
        .sort((a, b) => (b.steps_today || 0) - (a.steps_today || 0))
        .forEach((entry, index) => {
          const li = document.createElement("li");
          const currentUserId = window.APP_CONTEXT?.userId;
          const isCurrentUser = entry.user_id === currentUserId;

          let content = `${index + 1}. ${entry.username || "Anonim"}: ${
            entry.steps_today || 0
          } steps`;
          if (isCurrentUser) {
            content += " (Ty)";
            li.style.fontWeight = "bold";
            const accentColor = getComputedStyle(document.documentElement)
              .getPropertyValue("--accent")
              .trim();
            li.style.color = accentColor || "#ff00ff";
          }
          li.textContent = content;
          ul.appendChild(li);
        });
    }
  } catch (e) {
    console.warn("ranking error", e);
    const ul = document.getElementById("leaderboard");
    if (ul) ul.innerHTML = "<li>Ranking niedostępny</li>";
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const accentColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim() || "#4CAF50";
  const mutedColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--muted")
      .trim() || "#888";

  const keys = Object.keys(map).sort().slice(-7);
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(1000, ...vals);
  const padding = 30;
  const chartHeight = canvas.height - 40;
  const w = (canvas.width - 20) / Math.max(1, keys.length);

  ctx.font = "10px Inter";

  keys.forEach((k, i) => {
    const val = vals[i];
    const barH = (val / max) * chartHeight;

    ctx.fillStyle = accentColor;
    ctx.fillRect(w * i + 10, canvas.height - 25 - barH, w * 0.6, barH);

    ctx.fillStyle = mutedColor;
    ctx.textAlign = "center";
    const day = k.split("-")[2];
    ctx.fillText(day, w * i + 10 + w * 0.3, canvas.height - 10);
  });
}
