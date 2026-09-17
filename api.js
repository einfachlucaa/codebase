/* ---------- API CLIENT ----------
   Dünner Wrapper um fetch(). Das Auth-Token liegt in einem httpOnly-Cookie,
   das der Browser bei credentials:'include' automatisch mitschickt —
   das clientseitige JS bekommt das Token selbst nie zu Gesicht. */
async function api(method, url, body) {
  const res = await fetch("/api" + url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* kein JSON-Body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Fehler ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}
const apiGet = (url) => api("GET", url);
const apiPost = (url, body) => api("POST", url, body);
const apiPut = (url, body) => api("PUT", url, body);
const apiPatch = (url, body) => api("PATCH", url, body);
const apiDelete = (url) => api("DELETE", url);
