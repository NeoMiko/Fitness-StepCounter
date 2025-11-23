async function registerSync(tag = "sync-ranking") {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    const reg = await navigator.serviceWorker.ready;
    try {
      await reg.sync.register(tag);
      return true;
    } catch (e) {
      console.warn("sync register", e);
      return false;
    }
  }
  return false;
}
window.registerSync = registerSync;
