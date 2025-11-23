const CACHE_NAME = "pwa-step-tracker-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/dashboard.html",
  "/tracker.html",
  "/history.html",
  "/settings.html",
  "/css/style.css",
  "/js/main.js",
  "/js/tracker.js",
  "/js/idb-helpers.js",
  "/js/storage-facade.js",
  "/js/worker-rpm.js",
  "/js/dashboard.js",
  "/js/history.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/data/offline-weather.json",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => ev.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    caches
      .match(ev.request)
      .then(
        (r) => r || fetch(ev.request).catch(() => caches.match("/index.html"))
      )
  );
});

function swOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("pedometer-db", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("queued"))
        db.createObjectStore("queued", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function swGetAllQueued() {
  const db = await swOpenDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("queued", "readonly");
    const req = tx.objectStore("queued").getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function swDeleteQueued(id) {
  const db = await swOpenDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("queued", "readwrite");
    tx.objectStore("queued").delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

/* Background Sync - send queued ranking/activity to serverless endpoints */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-ranking" || event.tag === "sync-activities") {
    event.waitUntil(handleSyncAll());
  }
});

async function handleSyncAll() {
  try {
    const items = await swGetAllQueued();
    for (const it of items) {
      try {
        const res = await fetch("/.netlify/functions/updateRanking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(it.payload),
        });
        if (res.ok) {
          await swDeleteQueued(it.id);
          continue;
        }
      } catch (err) {
        try {
          if (it.payload && it.payload.activity) {
            await fetch("/.netlify/functions/createActivity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(it.payload.activity),
            });
            await swDeleteQueued(it.id);
            continue;
          }
        } catch (e) {}
        throw err;
      }
    }
  } catch (err) {
    console.error("sync failed", err);
    throw err;
  }
}
