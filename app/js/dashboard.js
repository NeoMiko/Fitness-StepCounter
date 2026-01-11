import { storage } from "./storage-facade.js";

document.addEventListener("DOMContentLoaded", async () => {
  const goal = Number(localStorage.getItem("pedometer.goal") || 5000);
  document.getElementById("today-goal").textContent = `Goal: ${goal}`;
  const today = new Date().toISOString().split("T")[0];

  const steps = await storage.getDaily(today);

  document.getElementById("today-steps").textContent = steps || 0;
  const pct = Math.min(100, Math.round(((steps || 0) / goal) * 100));
  document.getElementById("bar").style.width = pct + "%";

  // Obsługa pogody
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej)
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
    document.getElementById("weather-info").textContent = last
      ? `${last.temperature}°C (offline)`
      : "No weather data";
  }

  // Obsługa rankingu
  try {
    const r = await fetch("/.netlify/functions/getRanking");
    if (!r.ok) throw new Error("Serwer zwrócił błąd 500");
    const rows = await r.json();
    const ul = document.getElementById("leaderboard");
    if (ul) ul.innerHTML = "";
    rows
      .sort((a, b) => b.steps_today - a.steps_today)
      .forEach((entry, index) => {
        const li = document.createElement("li");

        const isCurrentUser = entry.user_id === window.APP_CONTEXT.userId;

        let content = `${index + 1}. ${entry.username || "Anonim"}: ${
          entry.steps_today
        } steps`;

        if (isCurrentUser) {
          content += " (Ty)";
          li.style.fontWeight = "bold";
          const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue("--accent")
            .trim();
          li.style.color = accentColor;
        }

        li.textContent = content;
        ul.appendChild(li);
      });
  } catch (e) {
    console.warn("ranking error", e);
  }

  // Rysowanie wykresu tygodniowego
  const daily = await storage.getAll("daily");
  const map = {};
  daily.forEach((d) => (map[d.date] = d.steps));
  drawWeekChart(map);
});

function drawWeekChart(map) {
  const canvas = document.getElementById("week-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  const mutedColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--muted")
    .trim();

  const keys = Object.keys(map).sort().slice(-7);
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(1000, ...vals);
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
