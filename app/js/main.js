if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

document.getElementById("theme-toggle").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
};

if (localStorage.getItem("theme") === "dark")
  document.body.classList.add("dark");

const stepsToday = parseInt(localStorage.getItem("steps-today") || "0");
const goal = parseInt(localStorage.getItem("goal") || "5000");
document.getElementById("steps-today").textContent = stepsToday;
document.getElementById("goal").textContent = goal;
document.getElementById("bar").style.width =
  Math.min((stepsToday / goal) * 100, 100) + "%";

async function loadWeather() {
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej)
    );
    const data = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`
    ).then((r) => r.json());
    const w = data.current_weather;
    document.getElementById(
      "weather-info"
    ).textContent = `${w.temperature}°C, ${w.weathercode}`;
    localStorage.setItem("last-weather", JSON.stringify(w));
  } catch {
    const w = JSON.parse(localStorage.getItem("last-weather") || "{}");
    document.getElementById("weather-info").textContent = w.temperature
      ? `${w.temperature}°C (offline)`
      : "No weather data";
  }
}
loadWeather();
