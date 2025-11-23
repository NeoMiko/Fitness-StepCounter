(function () {
  const DB_NAME = "pedometer-db";
  const DB_VER = 1;
  let dbp = null;
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("daily"))
          db.createObjectStore("daily", { keyPath: "date" });
        if (!db.objectStoreNames.contains("sessions"))
          db.createObjectStore("sessions", {
            keyPath: "id",
            autoIncrement: true,
          });
        if (!db.objectStoreNames.contains("queued"))
          db.createObjectStore("queued", {
            keyPath: "id",
            autoIncrement: true,
          });
        if (!db.objectStoreNames.contains("meta"))
          db.createObjectStore("meta", { keyPath: "k" });
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return dbp;
  }

  async function idbPut(store, val) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(val);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }
  async function idbGet(store, key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly");
      const rq = tx.objectStore(store).get(key);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  async function idbGetAll(store) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly");
      const rq = tx.objectStore(store).getAll();
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  async function idbDelete(store, key) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  }

  window.IDB = {
    openDB,
    put: idbPut,
    get: idbGet,
    getAll: idbGetAll,
    delete: idbDelete,
  };
})();
