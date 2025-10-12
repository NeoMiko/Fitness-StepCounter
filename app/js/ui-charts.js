const c = document.getElementById("history-chart");
const ctx = c.getContext("2d");
const data = JSON.parse(localStorage.getItem("history") || "{}");
let i = 0;
for (let day in data) {
  const h = data[day] / 10;
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(30 * i + 10, 200 - h, 20, h);
  ctx.fillText(day.split("-")[2], 30 * i + 10, 220);
  i++;
}

document.getElementById("export").onclick = () => {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "steps.json";
  a.click();
};
