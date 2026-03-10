// ./scripts/rxconnect.js
(function () {
  const API_BASE = String(window.RXCONNECT_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

  const TOKEN_KEY = "rxconnect_token";
  const USER_KEY = "rxconnect_user";

  function safeJsonParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  const RX = {
    API_BASE,

    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    getUser() {
      return safeJsonParse(localStorage.getItem(USER_KEY) || "null");
    },

    setSession(token, user) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    clearSession() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },

    isLoggedIn() {
      return !!(RX.getToken() && RX.getUser());
    },

    requireAuth(allowedLoginTypes) {
      const user = RX.getUser();
      if (!RX.getToken() || !user) {
        window.location.href = "./login.html";
        return null;
      }
      if (Array.isArray(allowedLoginTypes) && !allowedLoginTypes.includes(user.login_type)) {
        window.location.href = "./dashboard.html";
        return null;
      }
      return user;
    },

    async request(path, { method = "GET", body, auth = true, headers = {} } = {}) {
      const h = { Accept: "application/json", ...headers };

      const isForm = body instanceof FormData;
      if (body && !isForm && typeof body !== "string") {
        h["Content-Type"] = "application/json";
        body = JSON.stringify(body);
      }

      if (auth) {
        const t = RX.getToken();
        if (t) h["Authorization"] = `Bearer ${t}`;
      }

      const normalizedPath = path.startsWith("/") ? path : `/${path}`;
      const res = await fetch(`${API_BASE}${normalizedPath}`, {
        method,
        headers: h,
        body,
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text ? { raw: text } : null;
      }

      if (!res.ok) {
        const message =
          (data && (data.message || data.error || data.details)) ||
          `Request failed (${res.status})`;

        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
      }

      return data;
    },

    api: {
      get(path, opts) {
        return RX.request(path, { ...opts, method: "GET" });
      },
      post(path, body, opts) {
        return RX.request(path, { ...opts, method: "POST", body });
      },
      put(path, body, opts) {
        return RX.request(path, { ...opts, method: "PUT", body });
      },
      del(path, opts) {
        return RX.request(path, { ...opts, method: "DELETE" });
      },
    },
  };

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[data-rx-logout]");
    if (!a) return;
    e.preventDefault();
    RX.clearSession();
    window.location.href = "./login.html";
  });

  window.RX = RX;
})();