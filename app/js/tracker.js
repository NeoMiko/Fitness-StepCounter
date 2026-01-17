import { storage } from "./storage-facade.js";

let steps = 0;
let isRunning = false;
let lastMag = 0;
const threshold = 11.5; // Prog czulosci acc
const STEP_LENGTH = 0.762; // dlugosc kroku

const stepsEl = document.getElementById("steps");
const distanceEl = document.getElementById("distance");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const saveBtn = document.getElementById("save-btn");

// Funkcja liczaca kroki
function handleMotion(event) {
  if (!isRunning) return;

  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  // Obliczamy sile acc
  const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

  // Prosty filtr
  if (mag > threshold && lastMag <= threshold) {
    steps++;
    updateUI();
  }
  lastMag = mag;
}

function updateUI() {
  stepsEl.textContent = steps;
  const distKm = (steps * STEP_LENGTH) / 1000;
  distanceEl.textContent = distKm.toFixed(2) + " km";
}

startBtn.onclick = async () => {
  // Prosba o uprawnienia
  if (typeof DeviceMotionEvent.requestPermission === "function") {
    const permission = await DeviceMotionEvent.requestPermission();
    if (permission !== "granted") {
      alert("Brak uprawnień do sensorów!");
      return;
    }
  }

  isRunning = true;
  window.addEventListener("devicemotion", handleMotion);

  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  pauseBtn.textContent = "Pause";
};

pauseBtn.onclick = () => {
  isRunning = !isRunning;
  pauseBtn.textContent = isRunning ? "Pause" : "Resume";
};

saveBtn.onclick = async () => {
  isRunning = false;
  window.removeEventListener("devicemotion", handleMotion);

  const today = new Date().toISOString().split("T")[0];
  const userId =
    window.APP_CONTEXT?.userId || localStorage.getItem("userId") || "anon";

  const payload = {
    userId: userId,
    username: localStorage.getItem("username") || "User",
    date: today,
    stepsToday: steps,
    distance: parseFloat(((steps * STEP_LENGTH) / 1000).toFixed(2)), // Zapisujemy dystans online
  };

  try {
    // Zapis lokalny
    await storage.saveDaily(today, steps);

    // Zapis Online
    const res = await fetch("/.netlify/functions/updateRanking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Zapisano pomyślnie!");
    } else {
      throw new Error("Błąd serwera");
    }
  } catch (err) {
    console.warn("Tryb offline: dodawanie do kolejki");
    await storage.queuePayload(payload);
    alert("Zapisano lokalnie (brak połączenia).");
  }

  window.location.href = "dashboard.html";
};
