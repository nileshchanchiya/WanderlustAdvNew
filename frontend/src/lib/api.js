import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = BACKEND_URL && BACKEND_URL !== 'undefined' ? `${BACKEND_URL}/api` : "/api";

const USE_DEMO_MODE = !BACKEND_URL || BACKEND_URL === 'undefined';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  adapter: USE_DEMO_MODE ? demoAdapter : undefined
});

// ── Attach Bearer token from localStorage on every request ──
if (!USE_DEMO_MODE) {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ── Auto-refresh on 401 ──
  let isRefreshing = false;
  let refreshQueue = [];

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const orig = error.config;
      if (error.response?.status === 401 && !orig._retry && !orig.url?.includes("/auth/")) {
        orig._retry = true;
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const rt = localStorage.getItem("refresh_token");
            if (!rt) throw new Error("No refresh token");
            const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: rt }, { withCredentials: true });
            if (data.access_token) {
              localStorage.setItem("access_token", data.access_token);
            }
            refreshQueue.forEach((cb) => cb(null));
          } catch (err) {
            refreshQueue.forEach((cb) => cb(err));
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            return Promise.reject(error);
          } finally {
            isRefreshing = false;
            refreshQueue = [];
          }
        } else {
          await new Promise((resolve, reject) => {
            refreshQueue.push((err) => (err ? reject(err) : resolve()));
          });
        }
        orig.headers.Authorization = `Bearer ${localStorage.getItem("access_token")}`;
        return api(orig);
      }
      return Promise.reject(error);
    }
  );
}

function demoAdapter(config) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const url = config.url || '';
      const method = (config.method || 'get').toLowerCase();

      const parseJson = (data) => typeof data === 'string' ? JSON.parse(data) : data;

      // Auth
      if (url.includes('/auth/me')) {
        const user = localStorage.getItem('demo_user');
        if (user) return resolve({ data: JSON.parse(user), status: 200, statusText: 'OK', config, headers: {} });
        return reject({ response: { status: 401, data: { detail: "Not authenticated" } }, config });
      }

      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        const body = config.data ? parseJson(config.data) : {};
        const user = { id: 'demo-123', email: body.email || 'demo@example.com', name: body.name || 'Demo User' };
        localStorage.setItem('demo_user', JSON.stringify(user));
        return resolve({ data: user, status: 200, statusText: 'OK', config, headers: {} });
      }

      if (url.includes('/auth/logout')) {
        localStorage.removeItem('demo_user');
        return resolve({ data: { ok: true }, status: 200, statusText: 'OK', config, headers: {} });
      }

      // Itineraries
      if (url.includes('/itineraries')) {
        let itineraries = JSON.parse(localStorage.getItem('demo_itineraries') || '[]');
        
        if (method === 'get') {
          if (url.match(/\/itineraries\/it_.+/)) {
            const id = url.split('/').pop();
            const it = itineraries.find(i => i.id === id);
            if (it) return resolve({ data: it, status: 200, statusText: 'OK', config, headers: {} });
            return reject({ response: { status: 404, data: { detail: "Not Found" } }, config });
          }
          return resolve({ data: itineraries, status: 200, statusText: 'OK', config, headers: {} });
        }
        
        if (method === 'post') {
          const body = parseJson(config.data);
          const newItinerary = {
            ...body,
            id: 'it_' + Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
          };
          itineraries = [newItinerary, ...itineraries];
          localStorage.setItem('demo_itineraries', JSON.stringify(itineraries));
          return resolve({ data: newItinerary, status: 200, statusText: 'OK', config, headers: {} });
        }

        if (method === 'put') {
          const id = url.split('/').pop();
          const body = parseJson(config.data);
          itineraries = itineraries.map(it => it.id === id ? { ...it, ...body } : it);
          localStorage.setItem('demo_itineraries', JSON.stringify(itineraries));
          return resolve({ data: itineraries.find(i => i.id === id) || body, status: 200, statusText: 'OK', config, headers: {} });
        }

        if (method === 'delete') {
          const id = url.split('/').pop();
          itineraries = itineraries.filter(i => i.id !== id);
          localStorage.setItem('demo_itineraries', JSON.stringify(itineraries));
          return resolve({ data: { ok: true }, status: 200, statusText: 'OK', config, headers: {} });
        }
      }

      // Inquiries
      if (url.includes('/inquiries')) {
        return resolve({ data: { ok: true }, status: 200, statusText: 'OK', config, headers: {} });
      }
      
      // Destinations
      if (url.includes('/destinations')) {
        let dests = JSON.parse(localStorage.getItem('demo_destinations') || '[]');
        if (method === 'get') return resolve({ data: dests, status: 200, statusText: 'OK', config, headers: {} });
        if (method === 'post') {
          const newDest = { ...parseJson(config.data), id: 'dest_' + Math.random().toString(36).substr(2, 9) };
          dests = [newDest, ...dests];
          localStorage.setItem('demo_destinations', JSON.stringify(dests));
          return resolve({ data: newDest, status: 200, statusText: 'OK', config, headers: {} });
        }
        if (method === 'delete') {
          const id = url.split('/').pop();
          dests = dests.filter(d => d.id !== id);
          localStorage.setItem('demo_destinations', JSON.stringify(dests));
          return resolve({ data: { ok: true }, status: 200, statusText: 'OK', config, headers: {} });
        }
      }

      return reject({ response: { status: 404, data: { detail: "Not Found in Demo Mode" } }, config });
    }, 400); // 400ms network delay simulation
  });
}

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default api;
