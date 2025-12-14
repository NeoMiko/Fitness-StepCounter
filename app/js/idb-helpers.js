const DB_NAME = "pedometer-db";
const DB_VER = 1;
let dbp = null;

/**
 * Otwiera połączenie z IndexedDB
 * @returns {Promise<IDBDatabase>}
 */
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

/**
 * Wstawia lub aktualizuje wartość
 * @param {string} store
 * @param {any} val
 */
async function idbPut(store, val) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(val);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

/**
 * Pobiera wartość z magazynu po kluczu.
 * @param {string} store Nazwa magazynu.
 * @param {any} key Klucz do pobrania.
 */
async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const rq = tx.objectStore(store).get(key);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}

/**
 * Pobiera wszystkie wartości z magazynu.
 * @param {string} store Nazwa magazynu.
 */
async function idbGetAll(store) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readonly");
    const rq = tx.objectStore(store).getAll();
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}

/**
 * Usuwa wartość z magazynu po kluczu.
 * @param {string} store Nazwa magazynu.
 * @param {any} id Klucz do usunięcia.
 */
async function idbDelete(store, id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}

export const IDB = {
  put: idbPut,
  get: idbGet,
  getAll: idbGetAll,
  delete: idbDelete,
};
