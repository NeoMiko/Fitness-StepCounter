import * as storage from "./storage-facade.js";

document.addEventListener("DOMContentLoaded", async () => {
  const goal = Number(localStorage.getItem("pedometer.goal") || 5000);
  document.getElementById("today-goal").textContent = `Goal: ${goal}`;
  const today = new Date().toISOString().split("T")[0];
  const steps = await storage.getDaily(today);
  document.getElementById("today-steps").textContent = steps || 0;
  const pct = Math.min(100, Math.round(((steps || 0) / goal) * 100));
  document.getElementById("bar").style.width = pct + "%";

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

  // ranking
  try {
    const r = await fetch("/.netlify/functions/getRanking");
    const rows = await r.json();
    const ul = document.getElementById("leaderboard");
    ul.innerHTML = "";
    rows.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = `${entry.username || entry.user_id}: ${
        entry.steps_today
      } steps`;
      ul.appendChild(li);
    });
  } catch (e) {
    console.warn("ranking error", e);
  }

  const daily = await IDB.getAll("daily");
  const map = {};
  daily.forEach((d) => (map[d.date] = d.steps));
  drawWeekChart(map);
});

function drawWeekChart(map) {
  const canvas = document.getElementById("week-chart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const keys = Object.keys(map).sort().slice(-7);
  const vals = keys.map((k) => map[k] || 0);
  const max = Math.max(1000, ...vals);
  const w = canvas.width / Math.max(1, keys.length);
  ctx.fillStyle = "#4CAF50";
  vals.forEach((v, i) => {
    const h = (canvas.height - 20) * (v / max);
    ctx.fillRect(i * w + 10, canvas.height - 10 - h, w - 20, h);
    ctx.fillStyle = "#000";
    ctx.font = "10px sans-serif";
    ctx.fillText(keys[i].slice(5), i * w + 10, canvas.height - 2);
    ctx.fillStyle = "#4CAF50";
  });
}
