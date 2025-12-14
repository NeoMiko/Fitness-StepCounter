document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("auth-form");
  const usernameInput = document.getElementById("username-input");
  const statusEl = document.getElementById("auth-status");
  const loginBtn = document.getElementById("login-btn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();

    if (!username) return;

    statusEl.textContent = "Łączenie z serwerem...";
    loginBtn.disabled = true;

    try {
      const response = await fetch("/.netlify/functions/handleAuth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ username: username }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("pedometer.userId", data.userId);
        localStorage.setItem("pedometer.username", data.username);

        statusEl.textContent = `Witaj, ${data.username}! Zalogowano pomyślnie.`;

        setTimeout(() => {
          window.location.href = "/dashboard.html";
        }, 1000);
      } else {
        throw new Error(data.message || "Błąd logowania/rejestracji.");
      }
    } catch (error) {
      console.error(error);
      statusEl.textContent = `Błąd: ${error.message}. Spróbuj ponownie.`;
      loginBtn.disabled = false;
    }
  });
});
