import { storage } from "./storage.js";
import { ui } from "./ui.js";

const base = "";

export async function api(path, { method="GET", body=null, auth=true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = storage.getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (!res.ok) {
    const msg = data?.message || "Request failed";
    if (res.status === 401) {
      storage.clearAll();
    }
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data;
}

export async function safeApi(...args){
  try{ return await api(...args); }
  catch(e){ ui.toast("Error", e.message); throw e; }
}
