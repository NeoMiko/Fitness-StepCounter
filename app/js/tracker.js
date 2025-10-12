let steps = 0,
  lastAcc = { x: 0, y: 0, z: 0 };
let lastTime = Date.now(),
  distance = 0,
  startTime = Date.now();

if ("Accelerometer" in window) {
  const acc = new Accelerometer({ frequency: 10 });
  acc.addEventListener("reading", () => {
    const diff =
      Math.abs(acc.x - lastAcc.x) +
      Math.abs(acc.y - lastAcc.y) +
      Math.abs(acc.z - lastAcc.z);
    if (diff > 2) {
      steps++;
      document.getElementById("live-steps").textContent = steps;
      if (steps % 100 === 0) navigator.vibrate(200);
    }
    lastAcc = { x: acc.x, y: acc.y, z: acc.z };
  });
  acc.start();
}

// GPS distance
navigator.geolocation.watchPosition((pos) => {
  if (!window.lastPos) {
    window.lastPos = pos.coords;
    return;
  }
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(pos.coords.latitude - lastPos.latitude);
  const dLon = toRad(pos.coords.longitude - lastPos.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lastPos.latitude)) *
      Math.cos(toRad(pos.coords.latitude)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  distance += R * c;
  document.getElementById("distance").textContent = distance.toFixed(1);
  const speed =
    pos.coords.speed || distance / ((Date.now() - startTime) / 1000);
  document.getElementById("speed").textContent = speed.toFixed(2);
  lastPos = pos.coords;
});

setInterval(() => {
  const elapsed = ((Date.now() - startTime) / 1000) | 0;
  const m = Math.floor(elapsed / 60),
    s = elapsed % 60;
  document.getElementById("elapsed").textContent = `${m}:${s
    .toString()
    .padStart(2, "0")}`;
}, 1000);
