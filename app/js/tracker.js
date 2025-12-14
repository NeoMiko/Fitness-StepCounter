import { storage } from "./storage-facade.js";

let running = false,
  stepCount = 0,
  lastStep = 0,
  stepDelay = 300,
  accelThreshold = 1.0;
let sessionStart = 0,
  distanceMeters = 0,
  path = [];
let watchId = null,
  rpmWorker = null;

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600),
    mm = Math.floor((s % 3600) / 60),
    ss = s % 60;
  return `${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function ensureWorker() {
  if (!rpmWorker && window.Worker) {
    rpmWorker = new Worker("/js/worker-rpm.js");
    rpmWorker.onmessage = (e) => {
      const el = document.getElementById("live-pace");
      if (el) el.textContent = e.data.rpm + " spm";
    };
  }
}

function startSession() {
  if (running) return;
  running = true;
  stepCount = 0;
  distanceMeters = 0;
  path = [];
  sessionStart = Date.now();
  ensureWorker();
  document.getElementById("start-track").disabled = true;
  document.getElementById("pause-track").disabled = false;
  document.getElementById("stop-track").disabled = false;

  const handler = (e) => {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const ax = a.x || 0,
      ay = a.y || 0,
      az = a.z || 0;
    const mag = Math.sqrt(ax * ax + ay * ay + az * az);
    const dyn = Math.abs(mag - 9.81);
    const now = Date.now();
    if (dyn > accelThreshold && now - lastStep > stepDelay) {
      lastStep = now;
      stepCount++;
      document.getElementById("live-steps").textContent = stepCount;
      if (rpmWorker) rpmWorker.postMessage({ type: "step", ts: now });
      if (navigator.vibrate && stepCount % 100 === 0) navigator.vibrate(120);
    }
  };
  window.addEventListener("devicemotion", handler);
  window._pedMotionHandler = handler;

  const useGps =
    document.getElementById("use-gps") &&
    document.getElementById("use-gps").checked;
  if (useGps && navigator.geolocation) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (path.length) {
          const last = path[path.length - 1];
          const d = haversine(last.lat, last.lon, latitude, longitude);
          distanceMeters += d;
        }
        path.push({ lat: latitude, lon: longitude, t: Date.now() });
        document.getElementById("live-distance").textContent =
          distanceMeters.toFixed(1);
      },
      (e) => console.warn("geo err", e),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 7000 }
    );
  }

  // timer update
  window._pedTimer = setInterval(() => {
    const elapsed = Date.now() - sessionStart;
    document.getElementById("live-pace").textContent = "...";
    document.getElementById("live-steps").textContent = stepCount;
    document.getElementById("live-distance").textContent =
      distanceMeters.toFixed(1);
    document.getElementById("elapsed") &&
      (document.getElementById("elapsed").textContent = formatTime(elapsed));
  }, 500);
}

function pauseSession() {
  if (!running) return;
  running = false;
  window.removeEventListener("devicemotion", window._pedMotionHandler);
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  clearInterval(window._pedTimer);
  document.getElementById("start-track").disabled = false;
  document.getElementById("pause-track").disabled = true;
}

async function stopAndSave() {
  pauseSession();
  const session = {
    userId: window.PEDOMETER.USER_ID,
    ts: sessionStart,
    steps: stepCount,
    distance: Number(distanceMeters.toFixed(2)),
    pace: null,
    weather: null,
  };
  // save local
  await storage.addSession(session);
  // update daily
  const dateStr = new Date(sessionStart).toISOString().split("T")[0];
  const prev = await storage.getDaily(dateStr);
  const newTotal = (prev || 0) + stepCount;
  await storage.saveDaily(dateStr, newTotal);
  // try send to server
  try {
    const r = await fetch("/.netlify/functions/createActivity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
    if (!r.ok) throw new Error("server refused");
    // update ranking
    await fetch("/.netlify/functions/updateRanking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.userId,
        username: "anon",
        date: dateStr,
        stepsToday: newTotal,
      }),
    });
  } catch (err) {
    // offline or failed: queue for background sync
    await storage.queuePayload({
      userId: session.userId,
      date: dateStr,
      stepsToday: newTotal,
    });
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      const reg = await navigator.serviceWorker.ready;
      try {
        await reg.sync.register("sync-ranking");
      } catch (e) {
        console.warn("sync register failed", e);
      }
    }
  }
  alert(
    "Saved: " +
      stepCount +
      " steps, " +
      (distanceMeters / 1000).toFixed(2) +
      " km"
  );
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

document.addEventListener("DOMContentLoaded", () => {
  const s = document.getElementById("start-track");
  const p = document.getElementById("pause-track");
  const stop = document.getElementById("stop-track");
  if (s)
    s.addEventListener("click", () => {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        DeviceMotionEvent.requestPermission
      ) {
        DeviceMotionEvent.requestPermission()
          .then((state) => {
            if (state === "granted") startSession();
            else alert("Motion permission denied");
          })
          .catch(() => startSession());
      } else startSession();
    });
  if (p) p.addEventListener("click", pauseSession);
  if (stop) stop.addEventListener("click", stopAndSave);
});
