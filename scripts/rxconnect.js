// ./scripts/rxconnect.js
(function () {
  const API_BASE = String(window.RXCONNECT_API_BASE || "https://rxconnect.co.uk/api").replace(/\/+$/, "");

  const TOKEN_KEY = "rxconnect_token";
  const USER_KEY = "rxconnect_user";

  const PUBLIC_PAGES = new Set([
    "",
    "index.html",
    "login.html",
    "register.html",
    "clinic-register.html",
    "about-us.html",
    "contact-us.html",
    "services.html",
    "doctors.html",
    "FAQs.html",
    "dispense-prescription.html",
  ]);

  const PROTECTED_PAGE_RULES = {
    "dashboard.html": null,
    "myprofile.html": null,
    "reports.html": null,
    "medicationExport.html": null,

    "dr-form.html": ["clinician"],
    "create-patient.html": ["clinician", "clinic"],
    "patients.html": ["clinician", "clinic"],
    "patient-history.html": ["clinician", "clinic", "dispenser", "chobham"],

    "prescriptions.html": ["clinician"],

    "billing.html": function (user) {
      return isManagementAdmin(user);
    },

    "approvals.html": function (user) {
      return canSeeApprovals(user);
    },

    "pending-prescription.html": ["clinician"],
    "import-patient.html": ["clinician", "clinic"],
  };

  const PROTECTED_LINKS = new Set([
    "dashboard.html",
    "myprofile.html",
    "dr-form.html",
    "create-patient.html",
    "patients.html",
    "patient-history.html",
    "prescriptions.html",
    "reports.html",
    "billing.html",
    "medicationExport.html",
    "approvals.html",
    "pending-prescription.html",
    "import-patient.html",
    "doctors.html",
  ]);

  function safeJsonParse(s) {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  }

  function readStorage(key) {
    return localStorage.getItem(key);
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, value);
  }

  function removeStorage(key) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }

  function normalizeStoredUser(user) {
    if (!user || typeof user !== "object") return null;

    return {
      user_id: user.user_id ?? user.id ?? null,
      username: user.username || user.email || "",
      email: user.email || "",
      full_name: user.full_name || user.name || user.username || user.email || "",
      name: user.name || user.full_name || user.username || user.email || "",
      phone: user.phone || "",
      login_type: user.login_type || "",
      is_admin: Number(user.is_admin || 0),

      clinic_id: user.clinic_id ?? null,
      clinician_id: user.clinician_id ?? null,
      dispenser_id: user.dispenser_id ?? null,

      pharmacy_name: user.pharmacy_name || "",
    };
  }

  function migrateLegacySessionStorage() {
    const localToken = localStorage.getItem(TOKEN_KEY);
    const localUser = localStorage.getItem(USER_KEY);

    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    const sessionUser = sessionStorage.getItem(USER_KEY);


    if (!localToken && sessionToken) {
      localStorage.setItem(TOKEN_KEY, sessionToken);
    }

    if (!localUser && sessionUser) {
      localStorage.setItem(USER_KEY, sessionUser);
    }

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function normalizePageName(pathname) {
    const last = String(pathname || "").split("/").pop() || "index.html";
    return last;
  }

  function currentPageName() {
    return normalizePageName(window.location.pathname);
  }

  function loginRedirectUrl() {
    const current = `${window.location.pathname}${window.location.search || ""}`;
    return `./login.html?next=${encodeURIComponent(current)}`;
  }

  function isManagementAdmin(user) {
    return !!user && user.login_type === "managment" && Number(user.is_admin || 0) === 1;
  }

  function isClinicAdmin(user) {
    return !!user && user.login_type === "clinic" && Number(user.is_admin || 0) === 1;
  }

  function isBuiltinAdmin(user) {
    return (
      !!user &&
      String(user.username || "").toLowerCase() === "admin.builtin"
    );
  }

  function canSeeApprovals(user) {
    return isBuiltinAdmin(user);
  }

  function getDisplayName(user) {
    return (
      user?.full_name ||
      user?.name ||
      user?.username ||
      user?.email ||
      "User"
    );
  }

  function setHidden(el, hidden) {
    if (!el) return;

    if (hidden) {
      el.style.setProperty("display", "none", "important");
      el.classList.add("hidden");
      el.setAttribute("aria-hidden", "true");
    } else {
      el.style.removeProperty("display");
      el.classList.remove("hidden");
      el.setAttribute("aria-hidden", "false");
    }
  }

  function getLinkPageName(anchor) {
    if (!anchor) return "";
    const href = anchor.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return "";
    }

    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return "";
      return normalizePageName(url.pathname);
    } catch {
      return normalizePageName(href.split("?")[0].split("#")[0]);
    }
  }

  function syncLoggedInNavigation(loggedIn) {
    document
    .querySelectorAll('a[href="./prescriptions.html"], a[href="prescriptions.html"], a[href="/prescriptions.html"]')
    .forEach(function (link) {
      if (loggedIn) {
        link.style.removeProperty("display");
      } else {
        link.style.setProperty("display", "none", "important");
      }
    });
    document
      .querySelectorAll('a[href="./register.html"], a[href="register.html"], a[href="/register.html"]')
      .forEach(function (link) {
        const text = String(link.textContent || "").trim().toLowerCase();
        const isJoinLink =
          link.classList.contains("join-btn") ||
          link.classList.contains("join-card-cta") ||
          link.classList.contains("primary-cta") ||
          text === "join us" ||
          text.includes("join us");

        if (!isJoinLink) return;

        if (loggedIn) {
          link.style.setProperty("display", "none", "important");
        } else {
          link.style.removeProperty("display");
        }
      });

    document.querySelectorAll(".nav-center, .nav-menu").forEach(function (nav) {
      let existing = nav.querySelector(".rx-dashboard-nav-link");

      if (!loggedIn) {
        if (existing) existing.remove();
        return;
      }

      const alreadyHasDashboard = nav.querySelector('a[href="./dashboard.html"], a[href="dashboard.html"], a[href="/dashboard.html"]');
      if (alreadyHasDashboard) return;

      const dashboardLink = document.createElement("a");
      dashboardLink.href = "./dashboard.html";
      dashboardLink.textContent = "Dashboard";

      if (nav.classList.contains("w-nav-menu")) {
        dashboardLink.className = "nav-link w-nav-link rx-dashboard-nav-link";
      } else {
        dashboardLink.className = "nav-link rx-dashboard-nav-link";
      }

      nav.insertBefore(dashboardLink, nav.firstElementChild);
    });
  }

  function linkNeedsAuth(anchor) {
    const page = getLinkPageName(anchor);
    return PROTECTED_LINKS.has(page);
  }

  function linkAllowedForUser(anchor, user) {
    const page = getLinkPageName(anchor);

    if (!PROTECTED_LINKS.has(page)) return true;
    if (!user) return false;

    const rule = PROTECTED_PAGE_RULES[page];

    if (!rule) return true;

    if (Array.isArray(rule)) {
      return rule.includes(user.login_type);
    }

    if (typeof rule === "function") {
      return rule(user);
    }

    return true;
  }

 function applyRoleUi() {
  const user = RX.getUser();

  const allowed = canSeeApprovals(user);

  const approvalLinks = Array.from(
    document.querySelectorAll('a[href="./approvals.html"], a[href="approvals.html"]')
  );

  approvalLinks.forEach(function (link) {
    setHidden(link, !allowed);
  });

  document.querySelectorAll("a[href]").forEach(function (link) {
    if (!linkNeedsAuth(link)) return;

    const allowedForPage = linkAllowedForUser(link, user);

    link.classList.toggle("rx-link-disabled", !allowedForPage);
    link.setAttribute("aria-disabled", allowedForPage ? "false" : "true");

    if (!allowedForPage) {
      link.title = user
        ? "Your account does not have access to this page."
        : "Please login to access this page.";
    } else {
      link.removeAttribute("title");
    }
  });
}

  function applySessionUi() {
    const token = RX.getToken();
    const user = RX.getUser();
    const loggedIn = !!(token && user);

    const usernameEls = document.querySelectorAll("#username");
    usernameEls.forEach((el) => {
      el.textContent = loggedIn ? getDisplayName(user) : "Guest";
    });

    const userButtons = document.querySelectorAll(".user-trigger");
    userButtons.forEach((button) => {
      if (!button.textContent.trim()) {
        button.innerHTML = `
          <span class="hello-label">Hello,</span>
          <span id="username">${loggedIn ? escapeHtml(getDisplayName(user)) : "Guest"}</span>
          <i class="fa-solid fa-chevron-down dropdown-icon" aria-hidden="true"></i>
        `;
      }
    });

    const profileLinks = document.querySelectorAll('a[href="./myprofile.html"], a[href="myprofile.html"]');
    profileLinks.forEach((link) => {
      const li = link.closest("li") || link;
      setHidden(li, !loggedIn);
    });

    const logoutLinks = Array.from(document.querySelectorAll("#logoutLink, #logoutBtn, #userDropdownMenu a[href='./login.html'], #userDropdownMenu a[href='login.html']"));

    logoutLinks.forEach((link) => {
      const span = link.querySelector("span");
      const icon = link.querySelector("i");

      if (loggedIn) {
        link.setAttribute("href", "./login.html");
        link.setAttribute("data-rx-logout", "true");
        if (span) span.textContent = "Logout";
        else link.textContent = "Logout";
        if (icon) {
          icon.className = "fa-solid fa-right-from-bracket";
        }
      } else {
        link.removeAttribute("data-rx-logout");
        link.setAttribute("href", "./login.html");
        if (span) span.textContent = "Login";
        else link.textContent = "Login";
        if (icon) {
          icon.className = "fa-solid fa-right-to-bracket";
        }
      }
    });

    syncLoggedInNavigation(loggedIn);
    applyRoleUi();
  }

  function injectGuardCss() {
    if (document.getElementById("rxAuthGuardCss")) return;

    const style = document.createElement("style");
    style.id = "rxAuthGuardCss";
    style.textContent = `
      a.rx-link-disabled {
        opacity: 0.45;
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(style);
  }

  function guardCurrentPage() {
    const page = currentPageName();

    if (PUBLIC_PAGES.has(page)) return true;

    const rule = PROTECTED_PAGE_RULES[page] || null;
    const token = RX.getToken();
    const user = RX.getUser();

    if (!token || !user) {
      window.location.href = loginRedirectUrl();
      return false;
    }

    if (Array.isArray(rule) && !rule.includes(user.login_type)) {
      window.location.href = "./dashboard.html";
      return false;
    }

    if (typeof rule === "function" && !rule(user)) {
      window.location.href = "./dashboard.html";
      return false;
    }

    return true;
  }

  function setupProtectedLinkInterception() {
    document.addEventListener("click", function (event) {
      const link = event.target.closest("a[href]");
      if (!link) return;

      if (link.hasAttribute("data-rx-logout")) {
        event.preventDefault();
        RX.logout();
        return;
      }

      if (!linkNeedsAuth(link)) return;

      const user = RX.getUser();
      const token = RX.getToken();

      if (!token || !user) {
        event.preventDefault();
        window.location.href = loginRedirectUrl();
        return;
      }

      if (!linkAllowedForUser(link, user)) {
        event.preventDefault();
        window.location.href = "./dashboard.html";
      }
    });
  }

  function setupShellDropdowns() {
  if (document.body.dataset.rxShellDropdownsReady === "true") return;
  document.body.dataset.rxShellDropdownsReady = "true";

  if (!document.getElementById("rxShellDropdownCss")) {
    const style = document.createElement("style");
    style.id = "rxShellDropdownCss";
    style.textContent = `
      .dropdown,
      .user-dropdown-container {
        position: relative;
      }

      .dropdown-content,
      .user-dropdown-menu {
        min-width: 230px !important;
        border-radius: 18px !important;
        background: #ffffff !important;
        box-shadow: 0 22px 55px rgba(35, 31, 28, 0.14) !important;
        border: 1px solid rgba(35, 31, 28, 0.08) !important;
        padding: 14px !important;
        z-index: 99999 !important;
      }

      .dropdown-content {
        position: absolute !important;
        top: calc(100% + 8px) !important;
        left: 50% !important;
        transform: translateX(-50%) translateY(8px) !important;
        display: block !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease !important;
      }

      .user-dropdown-menu {
        position: absolute !important;
        top: calc(100% + 8px) !important;
        right: 0 !important;
        left: auto !important;
        display: block !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        transform: translateY(8px) !important;
        transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease !important;
        list-style: none !important;
        margin: 0 !important;
      }

      .dropdown.is-open > .dropdown-content,
      .dropdown-content.show,
      .user-dropdown-container.is-open > .user-dropdown-menu,
      .user-dropdown-menu.show {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transform: translateX(-50%) translateY(0) !important;
      }

      .user-dropdown-container.is-open > .user-dropdown-menu,
      .user-dropdown-menu.show {
        transform: translateY(0) !important;
      }

      .dropdown-content::before,
      .user-dropdown-menu::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: -12px;
        height: 12px;
      }

      .dropdown-content a,
      .user-dropdown-menu a {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        width: 100% !important;
        padding: 12px 8px !important;
        border-radius: 12px !important;
        color: #2f2d2a !important;
        text-decoration: none !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
        white-space: nowrap !important;
      }

      .dropdown-content a:hover,
      .user-dropdown-menu a:hover {
        background: #f7f2ea !important;
        color: #b87528 !important;
      }

      .dropdown-toggle .dropdown-icon,
      .user-trigger .dropdown-icon {
        transition: transform 160ms ease !important;
      }

      .dropdown.is-open .dropdown-toggle .dropdown-icon,
      .user-dropdown-container.is-open .user-trigger .dropdown-icon {
        transform: rotate(180deg) !important;
      }
    `;
    document.head.appendChild(style);
  }

  const reportsButton = document.getElementById("reportsBtn");
  const reportsWrap =
    document.getElementById("reportsDropdownWrap") ||
    reportsButton?.closest(".dropdown");

  const userButton = document.querySelector(".user-trigger");
  const userWrap =
    document.getElementById("userDropdownWrap") ||
    userButton?.closest(".user-dropdown-container");

  const dropdownPairs = [
    { button: reportsButton, wrap: reportsWrap, closeTimer: null },
    { button: userButton, wrap: userWrap, closeTimer: null },
  ].filter(function (pair) {
    return pair.button && pair.wrap;
  });

  function clearCloseTimer(pair) {
    if (!pair) return;
    if (pair.closeTimer) {
      clearTimeout(pair.closeTimer);
      pair.closeTimer = null;
    }
  }

  function closePair(pair) {
    if (!pair || !pair.wrap) return;

    clearCloseTimer(pair);

    pair.wrap.classList.remove("is-open");

    const menu =
      pair.wrap.querySelector(".dropdown-content") ||
      pair.wrap.querySelector(".user-dropdown-menu");

    if (menu) {
      menu.classList.remove("show");
      menu.style.display = "";
    }

    pair.button.setAttribute("aria-expanded", "false");
  }

  function closePairDelayed(pair) {
    clearCloseTimer(pair);

    pair.closeTimer = setTimeout(function () {
      closePair(pair);
    }, 280);
  }

  function closeOthers(activePair) {
    dropdownPairs.forEach(function (pair) {
      if (pair !== activePair) closePair(pair);
    });
  }

  function openPair(pair) {
    clearCloseTimer(pair);
    closeOthers(pair);

    pair.wrap.classList.add("is-open");

    const menu =
      pair.wrap.querySelector(".dropdown-content") ||
      pair.wrap.querySelector(".user-dropdown-menu");

    if (menu) {
      menu.classList.add("show");
      menu.style.display = "";
    }

    pair.button.setAttribute("aria-expanded", "true");
  }

  function togglePair(pair) {
    if (pair.wrap.classList.contains("is-open")) {
      closePair(pair);
    } else {
      openPair(pair);
    }
  }

  dropdownPairs.forEach(function (pair) {
    const menu =
      pair.wrap.querySelector(".dropdown-content") ||
      pair.wrap.querySelector(".user-dropdown-menu");

    pair.button.addEventListener(
      "click",
      function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        togglePair(pair);
      },
      true
    );

    pair.wrap.addEventListener("mouseenter", function () {
      if (window.matchMedia("(hover: hover)").matches) {
        openPair(pair);
      }
    });

    pair.wrap.addEventListener("mouseleave", function () {
      if (window.matchMedia("(hover: hover)").matches) {
        closePairDelayed(pair);
      }
    });

    if (menu) {
      menu.addEventListener("mouseenter", function () {
        clearCloseTimer(pair);
        openPair(pair);
      });

      menu.addEventListener("mouseleave", function () {
        closePairDelayed(pair);
      });
    }
  });

  document.addEventListener(
    "click",
    function (event) {
      const clickedInsideAnyDropdown = dropdownPairs.some(function (pair) {
        return pair.wrap && pair.wrap.contains(event.target);
      });

      if (clickedInsideAnyDropdown) return;

      dropdownPairs.forEach(closePair);
    },
    true
  );

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    dropdownPairs.forEach(closePair);
  });
  applyRoleUi();
}

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

      const safeUser = normalizeStoredUser(user);
      if (safeUser) {
        writeStorage(USER_KEY, JSON.stringify(safeUser));
      }

      // Clean old per-tab auth values after moving to localStorage.
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);

      try {
        if (typeof applySessionUi === "function") applySessionUi();
        else applyRoleUi();
      } catch (_) {}
    },

    clearSession() {
      removeStorage(TOKEN_KEY);
      removeStorage(USER_KEY);

      try {
        applySessionUi();
      } catch (_) {}
    },

    async logout() {
      try {
        if (RX.getToken()) {
          await RX.api.get("/logout");
        }
      } catch (_) {
        // Still clear client session even if backend logout fails.
      }

      RX.clearSession();
      window.location.href = "./login.html";
    },

    isLoggedIn() {
      return !!(RX.getToken() && RX.getUser());
    },

    requireAuth(allowedLoginTypes) {
      const user = RX.getUser();

      if (!RX.getToken() || !user) {
        window.location.href = loginRedirectUrl();
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

    applySessionUi() {
      applySessionUi();
    },

    guardCurrentPage() {
      return guardCurrentPage();
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

        if (res.status === 401) {
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

  migrateLegacySessionStorage();

  document.addEventListener("DOMContentLoaded", function () {
    injectGuardCss();
    guardCurrentPage();
    applySessionUi();
    setupShellDropdowns();
    setupProtectedLinkInterception();

    setTimeout(function () {
      applySessionUi();
      setupShellDropdowns();
    }, 0);
  });

  window.addEventListener("storage", function (event) {
    if (![TOKEN_KEY, USER_KEY].includes(event.key)) return;

    try {
      if (typeof applySessionUi === "function") {
        applySessionUi();
      } else {
        applyRoleUi();
      }

      if (!RX.getToken() && !RX.getUser()) {
        const page = String(window.location.pathname || "").split("/").pop();

        const publicPages = new Set([
          "",
          "index.html",
          "login.html",
          "register.html",
          "clinic-register.html",
          "about-us.html",
          "contact-us.html",
          "services.html",
          "doctors.html",
          "FAQs.html",
          "dispense-prescription.html",
        ]);

        if (!publicPages.has(page)) {
          window.location.href = "./login.html";
        }
      }
    } catch (_) {}
  });
  window.RX = RX;
})();