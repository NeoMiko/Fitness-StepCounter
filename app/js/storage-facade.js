import { IDB } from "./idb-helpers.js";
async function saveDaily(dateStr, steps) {
  return await IDB.put("daily", { date: dateStr, steps });
}

async function getDaily(dateStr) {
  const o = await IDB.get("daily", dateStr);
  return o ? o.steps : 0;
}

async function addSession(session) {
  return await IDB.put("sessions", session);
}

async function getSessions() {
  return await IDB.getAll("sessions");
}

async function queuePayload(payload) {
  return await IDB.put("queued", { payload, ts: Date.now() });
}

async function getQueued() {
  return await IDB.getAll("queued");
}

async function deleteQueued(id) {
  return await IDB.delete("queued", id);
}

async function setMeta(k, v) {
  return await IDB.put("meta", { k, v });
}

async function getMeta(k) {
  const r = await IDB.get("meta", k);
  return r ? r.v : null;
}

export const storage = {
  saveDaily,
  getDaily,
  addSession,
  getSessions,
  queuePayload,
  getQueued,
  deleteQueued,
  setMeta,
  getMeta,
};
