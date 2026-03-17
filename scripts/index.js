document.addEventListener("DOMContentLoaded", function () {
  const MOBILE_BREAKPOINT = 980;

  const menuButton = document.getElementById("menu-btn");
  const navMenu = document.getElementById("nav-menu");
  const reportsButton = document.getElementById("reportsBtn");
  const reportsWrap = document.getElementById("reportsDropdownWrap");
  const userButton = document.querySelector(".user-trigger");
  const userWrap = document.getElementById("userDropdownWrap");
  const usernameEl = document.getElementById("username");
  const footerForm = document.getElementById("footerMessageForm");
  const footerFeedback = document.getElementById("footerFormFeedback");
  const logoutLink = document.querySelector('#userDropdownMenu a[href="./login.html"]');

  const overlay = document.getElementById("rxDocOverlay");
  const modalEls = {
    avatar: document.getElementById("rxDocAvatar"),
    title: document.getElementById("rxDocTitle"),
    subtitle: document.getElementById("rxDocSub"),
    bio: document.getElementById("rxDocBio"),
    code: document.getElementById("rxDocCode"),
    category: document.getElementById("rxDocCategory"),
    email: document.getElementById("rxDocEmail"),
    phone: document.getElementById("rxDocPhone"),
    location: document.getElementById("rxDocLocation"),
    link: document.getElementById("rxDocProfile")
  };

  let lastFocusedElement = null;

  function isMobileView() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function setExpandedState(button, state) {
    if (button) {
      button.setAttribute("aria-expanded", String(Boolean(state)));
    }
  }

  function setMenuIcon(isOpen) {
    if (!menuButton) return;
    const icon = menuButton.querySelector("i");
    if (!icon) return;

    icon.classList.toggle("fa-bars", !isOpen);
    icon.classList.toggle("fa-xmark", isOpen);
  }

  function closeWrap(wrap, button) {
    if (!wrap) return;
    wrap.classList.remove("is-open");
    setExpandedState(button, false);
  }

  function openWrap(wrap, button) {
    if (!wrap) return;
    wrap.classList.add("is-open");
    setExpandedState(button, true);
  }

  function toggleWrap(wrap, button) {
    if (!wrap) return;
    const willOpen = !wrap.classList.contains("is-open");
    if (willOpen) {
      openWrap(wrap, button);
    } else {
      closeWrap(wrap, button);
    }
  }

  function closeAllDropdowns() {
    closeWrap(reportsWrap, reportsButton);
    closeWrap(userWrap, userButton);
  }

  function closeMobileMenu() {
    if (!navMenu) return;
    navMenu.classList.remove("is-open");
    setExpandedState(menuButton, false);
    setMenuIcon(false);
    closeAllDropdowns();
  }

  function toggleMobileMenu() {
    if (!menuButton || !navMenu) return;
    const willOpen = !navMenu.classList.contains("is-open");
    navMenu.classList.toggle("is-open", willOpen);
    setExpandedState(menuButton, willOpen);
    setMenuIcon(willOpen);

    if (!willOpen) {
      closeAllDropdowns();
    }
  }

  function getStoredUser() {
    if (window.RX && typeof window.RX.getUser === "function") {
      try {
        return window.RX.getUser() || null;
      } catch (error) {
        // Ignore and continue to fallback sources.
      }
    }

    const possibleKeys = [
      "rxconnectUser",
      "user",
      "currentUser",
      "authUser"
    ];

    for (let i = 0; i < possibleKeys.length; i += 1) {
      const raw = window.localStorage.getItem(possibleKeys[i]);
      if (!raw) continue;

      try {
        return JSON.parse(raw);
      } catch (error) {
        // Ignore malformed storage values.
      }
    }

    return null;
  }

  function setUsername() {
    if (!usernameEl) return;

    const user = getStoredUser();
    const displayName =
      (user && (user.username || user.name || user.full_name || user.email)) ||
      "admin.builtin";

    usernameEl.textContent = displayName;
  }

  function clearSession() {
    if (window.RX && typeof window.RX.clearSession === "function") {
      try {
        window.RX.clearSession();
        return;
      } catch (error) {
        // Ignore and fallback to localStorage/sessionStorage cleanup.
      }
    }

    const possibleKeys = [
      "rxconnectUser",
      "user",
      "currentUser",
      "authUser",
      "token",
      "rxconnectToken",
      "authToken"
    ];

    possibleKeys.forEach(function (key) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }

  function setText(el, value, fallback) {
    if (el) {
      el.textContent = value || fallback || "";
    }
  }

  function setHref(el, value, fallback) {
    if (el) {
      el.setAttribute("href", value || fallback || "#");
    }
  }

  function openAdvisorModal(card) {
    if (!overlay || !card) return;

    lastFocusedElement = document.activeElement;

    if (modalEls.avatar) {
      modalEls.avatar.style.backgroundImage = 'url("' + (card.dataset.avatar || "") + '")';
    }

    setText(modalEls.title, card.dataset.name, "Doctor");
    setText(modalEls.subtitle, card.dataset.category, "");
    setText(modalEls.bio, card.dataset.bio, "");
    setText(modalEls.code, card.dataset.code, "—");
    setText(modalEls.category, card.dataset.category, "—");
    setText(modalEls.email, card.dataset.email, "—");
    setText(modalEls.phone, card.dataset.phone, "—");
    setText(modalEls.location, card.dataset.location, "—");
    setHref(
      modalEls.link,
      card.dataset.slug ? "./doctors.html#" + encodeURIComponent(card.dataset.slug) : "./doctors.html",
      "./doctors.html"
    );

    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");

    const closeButton = overlay.querySelector("[data-rx-close]");
    if (closeButton) {
      closeButton.focus({ preventScroll: true });
    }
  }

  function closeAdvisorModal() {
    if (!overlay) return;

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  function trapModalFocus(event) {
    if (!overlay || !overlay.classList.contains("is-open") || event.key !== "Tab") {
      return;
    }

    const focusable = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  setUsername();

  if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
      toggleMobileMenu();
    });
  }

  if (reportsButton && reportsWrap) {
    reportsButton.addEventListener("click", function (event) {
      if (!isMobileView()) return;
      event.preventDefault();
      event.stopPropagation();
      closeWrap(userWrap, userButton);
      toggleWrap(reportsWrap, reportsButton);
    });
  }

  if (userButton && userWrap) {
    userButton.addEventListener("click", function (event) {
      if (!isMobileView()) return;
      event.preventDefault();
      event.stopPropagation();
      closeWrap(reportsWrap, reportsButton);
      toggleWrap(userWrap, userButton);
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", function () {
      clearSession();
    });
  }

  if (footerForm && footerFeedback) {
    footerForm.addEventListener("submit", function (event) {
      event.preventDefault();
      footerFeedback.textContent = "Thanks. We will get back to you shortly.";
      footerForm.reset();
    });
  }

  document.addEventListener("click", function (event) {
    const advisorCard = event.target.closest(".advisor-card");
    if (advisorCard) {
      event.preventDefault();
      openAdvisorModal(advisorCard);
      return;
    }

    if (overlay && (event.target === overlay || event.target.closest("[data-rx-close]"))) {
      event.preventDefault();
      closeAdvisorModal();
      return;
    }

    if (isMobileView()) {
      if (reportsWrap && !reportsWrap.contains(event.target)) {
        closeWrap(reportsWrap, reportsButton);
      }

      if (userWrap && !userWrap.contains(event.target)) {
        closeWrap(userWrap, userButton);
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAdvisorModal();
      closeMobileMenu();
    }

    trapModalFocus(event);
  });

  window.addEventListener("resize", function () {
    if (!isMobileView()) {
      closeMobileMenu();
    }
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const svg = document.getElementById("rxHeartLines");
  if (!svg) return;

  const paths = svg.querySelectorAll(".rx-beat-path");
  if (paths.length !== 3) return;

  const WIDTH = 1240;
  const STEP = 6;
  let rafId = null;

  const lines = [
    {
      baseY: 98,
      pulseAmp: 24,
      speed: 0.18,
      spacing: 420,
      phase: 0,
      driftAmp: 0.55
    },
    {
      baseY: 136,
      pulseAmp: 19,
      speed: 0.2,
      spacing: 435,
      phase: 120,
      driftAmp: 0.45
    },
    {
      baseY: 176,
      pulseAmp: 15,
      speed: 0.22,
      spacing: 450,
      phase: 240,
      driftAmp: 0.35
    }
  ];

  function gaussian(x, center, width) {
    const z = (x - center) / width;
    return Math.exp(-(z * z));
  }

  function ecgShape(x, center, amp) {
    const d = x - center;

    return (
      0.16 * amp * gaussian(d, -72, 10) +   // P wave
      -0.18 * amp * gaussian(d, -18, 4.5) + // Q dip
      1.25 * amp * gaussian(d, 0, 3.2) +    // R spike
      -0.52 * amp * gaussian(d, 13, 5.2) +  // S dip
      0.30 * amp * gaussian(d, 66, 20)      // T wave
    );
  }

  function buildPath(time, cfg) {
    const lead = ((time * cfg.speed) + cfg.phase) % cfg.spacing;
    let d = "";

    for (let x = 0; x <= WIDTH; x += STEP) {
      let y =
        cfg.baseY +
        Math.sin((x * 0.0042) + (time * 0.0007)) * cfg.driftAmp +
        Math.sin((x * 0.0017) - (time * 0.00035)) * cfg.driftAmp * 0.45;

      for (let k = -1; k <= 4; k++) {
        const center = lead + (k * cfg.spacing);
        y -= ecgShape(x, center, cfg.pulseAmp);
      }

      d += x === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    return d;
  }

  function animate(time) {
    paths.forEach(function (path, index) {
      path.setAttribute("d", buildPath(time, lines[index]));
    });

    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  window.addEventListener("beforeunload", function () {
    if (rafId) cancelAnimationFrame(rafId);
  });
});