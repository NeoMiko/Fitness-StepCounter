const themeToggle = document.getElementById("theme-toggle");

const applyTheme = (isDarkMode) => {
  document.documentElement.classList.toggle("dark-theme", isDarkMode);

  themeToggle.querySelector(".toggle-icon").textContent = isDarkMode
    ? "☀️"
    : "🌙";
  themeToggle.querySelector(".toggle-text").textContent = isDarkMode
    ? "Light Mode"
    : "Dark Mode";
  themeToggle.setAttribute("aria-checked", isDarkMode);
};

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("pedometer.theme");
  const isDarkMode = savedTheme === "dark";
  applyTheme(isDarkMode);
});

themeToggle.addEventListener("click", () => {
  const isCurrentlyDark =
    document.documentElement.classList.contains("dark-theme");
  const newDarkModeState = !isCurrentlyDark;

  localStorage.setItem("pedometer.theme", newDarkModeState ? "dark" : "light");

  applyTheme(newDarkModeState);
});
