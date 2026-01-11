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
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
];

// Instalacja
self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Rozpoczynanie cache'owania aktywów...");
      return Promise.all(
        ASSETS.map((url) => {
          return cache
            .add(url)
            .catch((err) =>
              console.warn(`SW: Pominiecie pliku (brak na serwerze): ${url}`)
            );
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        );
      }),
    ])
  );
});

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;

  if (ev.request.url.includes("/.netlify/functions/")) {
    return;
  }

  ev.respondWith(
    caches.match(ev.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(ev.request).catch(() => {
        if (ev.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

function swOpenDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("pedometer-db", 1);
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
    const req = tx.objectStore("queued").delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-ranking" || event.tag === "sync-activities") {
    event.waitUntil(handleSyncAll());
  }
});

async function handleSyncAll() {
  try {
    const items = await swGetAllQueued();
    for (const it of items) {
      let endpoint = "/.netlify/functions/updateRanking";

      if (
        it.type === "activity" ||
        (it.payload && it.payload.steps === undefined)
      ) {
        endpoint = "/.netlify/functions/createActivity";
      }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(it.payload),
        });

        if (res.ok) {
          await swDeleteQueued(it.id);
        }
      } catch (err) {
        console.error("Pojedyncza synchronizacja nieudana:", err);
      }
    }
  } catch (err) {
    console.error("Globalny błąd synchronizacji:", err);
  }
}
