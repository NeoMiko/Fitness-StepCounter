let windowArr = [];
const WINDOW_MS = 60000;
self.onmessage = (e) => {
  const { type, ts } = e.data;
  if (type === "step") {
    const now = ts || Date.now();
    windowArr.push(now);
    const cutoff = now - WINDOW_MS;
    windowArr = windowArr.filter((t) => t >= cutoff);
    const rpm = windowArr.length;
    self.postMessage({ rpm, count: windowArr.length });
  } else if (type === "reset") {
    windowArr = [];
    self.postMessage({ rpm: 0, count: 0 });
  }
};
