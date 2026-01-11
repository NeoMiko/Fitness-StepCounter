import { storage } from "./storage-facade.js";

async function drawChart() {
  const c = document.getElementById("history-chart");
  if (!c) return;
  const ctx = c.getContext("2d");

  const allData = await storage.getAll("daily");

  allData.sort((a, b) => a.date.localeCompare(b.date));

  ctx.clearRect(0, 0, c.width, c.height);

  let i = 0;
  allData.forEach((entry) => {
    const h = entry.steps / 50;
    ctx.fillStyle = "#4CAF50";
    // Rysowanie słupka
    ctx.fillRect(40 * i + 10, c.height - 30 - h, 30, h);
    const dayLabel = entry.date.split("-")[2];
    ctx.fillStyle = "#ffffff";
    ctx.fillText(dayLabel, 40 * i + 15, c.height - 10);

    i++;
  });

  const exportBtn = document.getElementById("export");
  if (exportBtn) {
    exportBtn.onclick = () => {
      const blob = new Blob([JSON.stringify(allData, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `steps_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();
    };
  }
}

document.addEventListener("DOMContentLoaded", drawChart);
