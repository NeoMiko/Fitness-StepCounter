import { storage } from "./storage-facade.js";

let steps = 0;
let isRunning = false;
let lastMag = 0;
let sessionStartTime = null;
let timerInterval = null;

const threshold = 11.5;
const STEP_LENGTH = 0.762;

const stepsEl = document.getElementById("steps");
const distanceEl = document.getElementById("distance");
const paceEl = document.getElementById("live-pace");
const timeEl = document.getElementById("live-time");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const saveBtn = document.getElementById("save-btn");

// Akcelerometr
function handleMotion(event) {
  if (!isRunning) return;
  const acc = event.accelerationIncludingGravity;
  if (!acc) return;

  const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
  if (mag > threshold && lastMag <= threshold) {
    steps++;
    updateUI();
  }
  lastMag = mag;
}

// Aktualizacja interfejsu
function updateUI() {
  if (stepsEl) stepsEl.textContent = steps;

  const distKm = (steps * STEP_LENGTH) / 1000;
  if (distanceEl) distanceEl.textContent = distKm.toFixed(2) + " km";

  // Obliczanie tempa
  if (sessionStartTime) {
    const durationMinutes = (Date.now() - sessionStartTime) / 60000;
    const paceSPM =
      durationMinutes > 0 ? Math.round(steps / durationMinutes) : 0;
    if (paceEl) paceEl.textContent = paceSPM;
  }
}

// Stoper
function startTimer() {
  timerInterval = setInterval(() => {
    if (!isRunning) return;
    const elapsedMs = Date.now() - sessionStartTime;
    const secs = Math.floor((elapsedMs / 1000) % 60)
      .toString()
      .padStart(2, "0");
    const mins = Math.floor((elapsedMs / 60000) % 60)
      .toString()
      .padStart(2, "0");
    const hrs = Math.floor(elapsedMs / 3600000)
      .toString()
      .padStart(2, "0");
    if (timeEl) timeEl.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);
}

// Przycisk START
startBtn.onclick = async () => {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== "granted") {
        alert("Brak uprawnień do sensorów!");
        return;
      }
    } catch (err) {
      console.error("Permission error:", err);
    }
  }

  isRunning = true;
  if (!sessionStartTime) sessionStartTime = Date.now();

  window.addEventListener("devicemotion", handleMotion);
  startTimer();

  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  pauseBtn.textContent = "Pause";
};

// Przycisk PAUZA / WZNÓW
pauseBtn.onclick = () => {
  isRunning = !isRunning;
  pauseBtn.textContent = isRunning ? "Pause" : "Resume";
};

// Przycisk ZAPISZ I STOP
saveBtn.onclick = async () => {
  isRunning = false;
  clearInterval(timerInterval);
  window.removeEventListener("devicemotion", handleMotion);

  const endTime = Date.now();
  const durationMinutes = (endTime - sessionStartTime) / 60000;
  const paceSPM =
    durationMinutes > 0 ? parseFloat((steps / durationMinutes).toFixed(2)) : 0;
  const distance = parseFloat(((steps * STEP_LENGTH) / 1000).toFixed(2));

  const today = new Date().toISOString().split("T")[0];
  const userId =
    window.APP_CONTEXT?.userId || localStorage.getItem("userId") || "anon";
  const username = localStorage.getItem("username") || "User";

  // Przygotowanie danych do baz
  const rankingPayload = { userId, username, date: today, stepsToday: steps };
  const activityPayload = {
    userId,
    ts: endTime,
    steps,
    distance,
    pace: paceSPM,
  };

  try {
    // Zapis lokalny IndexedDB
    await storage.saveDaily(today, steps);

    // Wyslanie danych online
    const [resRanking, resActivity] = await Promise.all([
      fetch("/.netlify/functions/updateRanking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rankingPayload),
      }),
      fetch("/.netlify/functions/createActivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityPayload),
      }),
    ]);

    if (resRanking.ok && resActivity.ok) {
      alert("Trening został pomyślnie zapisany w bazie!");
    } else {
      throw new Error("Serwer zwrócił błąd (prawdopodobnie 502)");
    }
  } catch (err) {
    console.warn("Błąd zapisu online. Dane dodane do kolejki offline:", err);

    // Kolejkowanie dla Service Workera
    await storage.queuePayload({ type: "ranking", payload: rankingPayload });
    await storage.queuePayload({ type: "activity", payload: activityPayload });

    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register("sync-ranking");
    }
    alert(
      "Zapisano lokalnie. Dane zostaną wysłane automatycznie, gdy serwer będzie dostępny."
    );
  }

  // Reset i powrót
  sessionStartTime = null;
  window.location.href = "dashboard.html";
};
