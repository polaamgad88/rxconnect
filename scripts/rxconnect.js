// ./scripts/rxconnect.js
(function () {
  const API_BASE = String(window.RXCONNECT_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

  // Per-tab session keys
  const TOKEN_KEY = "rxconnect_token";
  const USER_KEY = "rxconnect_user";

  function safeJsonParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  function readStorage(key) {
    return sessionStorage.getItem(key);
  }

  function writeStorage(key, value) {
    sessionStorage.setItem(key, value);
  }

  function removeStorage(key) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key); // cleanup old shared values too
  }

  function migrateLegacyLocalStorage() {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    const sessionUser = sessionStorage.getItem(USER_KEY);

    if (!sessionToken) {
      const legacyToken = localStorage.getItem(TOKEN_KEY);
      if (legacyToken) sessionStorage.setItem(TOKEN_KEY, legacyToken);
    }

    if (!sessionUser) {
      const legacyUser = localStorage.getItem(USER_KEY);
      if (legacyUser) sessionStorage.setItem(USER_KEY, legacyUser);
    }

    // remove old shared session values so future tabs don't collide
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isManagementAdmin(user) {
    return !!user && user.login_type === "managment" && Number(user.is_admin || 0) === 1;
  }

  function isClinicAdmin(user) {
    return !!user && user.login_type === "clinic" && Number(user.is_admin || 0) === 1;
  }

  function canSeeApprovals(user) {
    return isManagementAdmin(user) || isClinicAdmin(user);
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.style.display = hidden ? "none" : "";
    el.classList.toggle("hidden", !!hidden);
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
  }

  function applyRoleUi() {
    const user = RX.getUser();

    const approvalLinks = Array.from(
      document.querySelectorAll('a[href="./approvals.html"], a[href="approvals.html"]')
    );

    const allowed = canSeeApprovals(user);

    approvalLinks.forEach((link) => {
      const container =
        link.closest("li") ||
        link.closest(".dropdown-content a") ||
        link.parentElement;

      if (container && container !== document.body) {
        setHidden(container, !allowed);
      } else {
        setHidden(link, !allowed);
      }
    });
  }

  const RX = {
    API_BASE,

    getToken() {
      return readStorage(TOKEN_KEY);
    },

    getUser() {
      return safeJsonParse(readStorage(USER_KEY) || "null");
    },

    setSession(token, user) {
      if (token) writeStorage(TOKEN_KEY, token);
      if (user) writeStorage(USER_KEY, JSON.stringify(user));

      // remove any old shared values
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      try {
        applyRoleUi();
      } catch (_) {}
    },

    clearSession() {
      removeStorage(TOKEN_KEY);
      removeStorage(USER_KEY);

      try {
        applyRoleUi();
      } catch (_) {}
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

    isManagementAdmin(user = RX.getUser()) {
      return isManagementAdmin(user);
    },

    isClinicAdmin(user = RX.getUser()) {
      return isClinicAdmin(user);
    },

    canSeeApprovals(user = RX.getUser()) {
      return canSeeApprovals(user);
    },

    applyRoleUi() {
      applyRoleUi();
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

        if (res.status === 401 || res.status === 403) {
          RX.clearSession();
        }

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

  migrateLegacyLocalStorage();

  document.addEventListener("click", function (e) {
    const a = e.target.closest("a[data-rx-logout]");
    if (!a) return;
    e.preventDefault();
    RX.clearSession();
    window.location.href = "./login.html";
  });

  document.addEventListener("DOMContentLoaded", function () {
    RX.applyRoleUi();
  });

  window.RX = RX;
})();