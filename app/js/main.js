document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("pedometer.theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark-theme");
  } else {
    document.documentElement.classList.remove("dark-theme");
  }

  const installButton = document.getElementById("install");
  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installButton) {
      installButton.style.display = "block";
    }
  });

  if (installButton) {
    installButton.addEventListener("click", () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
          } else {
            console.log("User dismissed the install prompt");
          }
          deferredPrompt = null;
          installButton.style.display = "none";
        });
      }
    });
  }
});
