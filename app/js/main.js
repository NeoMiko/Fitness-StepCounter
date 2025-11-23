// js/main.js
(function () {
  // user id
  if (!localStorage.getItem("pedometer.userId")) {
    const id =
      "u_" +
      [...crypto.getRandomValues(new Uint8Array(12))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    localStorage.setItem("pedometer.userId", id);
  }
  const USER_ID = localStorage.getItem("pedometer.userId");
  window.PEDOMETER = { USER_ID };

  // theme
  const saved = localStorage.getItem("pedometer.theme");
  const prefers =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme:dark)").matches;
  document.documentElement.setAttribute(
    "data-theme",
    saved || (prefers ? "dark" : "light")
  );
  // install sw
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").catch(console.warn);
  }

  // Listen online/offline
  window.addEventListener("online", () => console.log("online"));
  window.addEventListener("offline", () => console.log("offline"));
})();
