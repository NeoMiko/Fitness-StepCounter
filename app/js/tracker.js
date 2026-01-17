import { storage } from "./storage-facade.js";

let steps = 0;
let isRunning = false;
let startTime = null;
const STEP_LENGTH = 0.762;

const stepsEl = document.getElementById("steps");
const distanceEl = document.getElementById("distance");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const saveBtn = document.getElementById("save-btn");

// Accelerometer
let sensor = null;
if ("Accelerometer" in window) {
  sensor = new Accelerometer({ frequency: 60 });
  sensor.addEventListener("reading", () => {
    if (!isRunning) return;
    const magnitude = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2);
    if (magnitude > 12) {
      updateSteps();
    }
  });
}

function updateSteps() {
  steps++;
  stepsEl.textContent = steps;
  const distKm = (steps * STEP_LENGTH) / 1000;
  distanceEl.textContent = distKm.toFixed(2) + " km";
}

startBtn.onclick = () => {
  isRunning = true;
  startTime = startTime || Date.now();
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  pauseBtn.textContent = "Pause";
  if (sensor) sensor.start();
};

pauseBtn.onclick = () => {
  isRunning = !isRunning;
  pauseBtn.textContent = isRunning ? "Pause" : "Resume";
  if (!isRunning && sensor) sensor.stop();
  if (isRunning && sensor) sensor.start();
};

saveBtn.onclick = async () => {
  isRunning = false;
  if (sensor) sensor.stop();

  const today = new Date().toISOString().split("T")[0];
  const userId = window.APP_CONTEXT?.userId || "anon";
  const username = window.APP_CONTEXT?.username || "User";

  const payload = {
    userId: userId,
    username: username,
    date: today,
    stepsToday: steps,
    distance: parseFloat(distanceEl.textContent),
  };

  try {
    //Zapis lokalny
    await storage.saveDaily(today, steps);

    const res = await fetch("/.netlify/functions/updateRanking", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Activity saved successfully!");
      window.location.href = "dashboard.html";
    } else {
      throw new Error("Server error");
    }
  } catch (err) {
    // 3. Jeśli offline - dodaj do kolejki synchronizacji
    console.warn("Saving to queue...", err);
    await storage.queuePayload(payload);
    if (window.registerSync) await window.registerSync("sync-ranking");
    alert("Saved offline. Will sync when online.");
    window.location.href = "dashboard.html";
  }
};
