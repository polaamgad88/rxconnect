document.addEventListener("DOMContentLoaded", function () {
  const MOBILE_BREAKPOINT = 980;
  const PRESCRIBER_RATES = {
    chobham: 1.0,
    other: 0.55,
  };

  const menuButton = document.getElementById("menu-btn");
  const navMenu = document.getElementById("nav-menu");
  const reportsButton = document.getElementById("reportsBtn");
  const reportsWrap = document.getElementById("reportsDropdownWrap");
  const userButton = document.querySelector(".user-trigger");
  const userWrap = document.getElementById("userDropdownWrap");
  const usernameEl = document.getElementById("username");
  const footerForm = document.getElementById("footerMessageForm");
  const footerFeedback = document.getElementById("footerFormFeedback");
  const logoutLink = document.getElementById("logoutLink");

  const chobhamInput = document.getElementById("chobhamCount");
  const otherInput = document.getElementById("otherCount");
  const counterButtons = document.querySelectorAll("[data-counter][data-counter-target]");

  const chobhamCountDisplay = document.getElementById("chobhamCountDisplay");
  const otherCountDisplay = document.getElementById("otherCountDisplay");
  const otherChargeTotal = document.getElementById("otherChargeTotal");
  const doctorProfitTotal = document.getElementById("doctorProfitTotal");
  const tableChobhamCount = document.getElementById("tableChobhamCount");
  const tableOtherCount = document.getElementById("tableOtherCount");
  const tableTrackedCount = document.getElementById("tableTrackedCount");
  const tableChobhamProfit = document.getElementById("tableChobhamProfit");
  const tableOtherProfit = document.getElementById("tableOtherProfit");
  const tableDoctorProfitTotal = document.getElementById("tableDoctorProfitTotal");

  function isMobileView() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function setExpandedState(button, state) {
    if (button) button.setAttribute("aria-expanded", String(Boolean(state)));
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

  function getStoredUser() {
    if (window.RX && typeof window.RX.getUser === "function") {
      try {
        return window.RX.getUser() || null;
      } catch (error) {}
    }

    const possibleKeys = ["rxconnectUser", "user", "currentUser", "authUser"];

    for (let i = 0; i < possibleKeys.length; i += 1) {
      const raw = window.localStorage.getItem(possibleKeys[i]);
      if (!raw) continue;
      try {
        return JSON.parse(raw);
      } catch (error) {}
    }

    return null;
  }

  function clearSession() {
    if (window.RX && typeof window.RX.clearSession === "function") {
      try {
        window.RX.clearSession();
        return;
      } catch (error) {}
    }

    [
      "rxconnectUser",
      "user",
      "currentUser",
      "authUser",
      "token",
      "rxconnectToken",
      "authToken",
    ].forEach(function (key) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
  }

  function setUsername() {
    if (!usernameEl) return;
    const user = getStoredUser();
    const displayName =
      (user && (user.username || user.name || user.full_name || user.email)) ||
      "admin.builtin";
    usernameEl.textContent = displayName;
  }

  function formatSignedCurrency(value) {
    const number = Number(value || 0);
    return `${number < 0 ? "-" : ""}£${Math.abs(number).toFixed(2)}`;
  }

  function sanitizeInputValue(input) {
    if (!input) return 0;
    const value = parseInt(input.value || "0", 10);
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
    input.value = String(safeValue);
    return safeValue;
  }

  function updateProfitSummary() {
    const chobhamCount = sanitizeInputValue(chobhamInput);
    const otherCount = sanitizeInputValue(otherInput);

    const chobhamReimbursement = chobhamCount * PRESCRIBER_RATES.chobham;
    const otherCharge = otherCount * PRESCRIBER_RATES.other;
    const totalTracked = chobhamCount + otherCount;
    const netPrescriberTotal = chobhamReimbursement - otherCharge;

    if (chobhamCountDisplay) chobhamCountDisplay.textContent = String(chobhamCount);
    if (otherCountDisplay) otherCountDisplay.textContent = String(otherCount);
    if (otherChargeTotal) otherChargeTotal.textContent = formatSignedCurrency(-otherCharge);
    if (doctorProfitTotal) doctorProfitTotal.textContent = formatSignedCurrency(netPrescriberTotal);

    if (tableChobhamCount) tableChobhamCount.textContent = String(chobhamCount);
    if (tableOtherCount) tableOtherCount.textContent = String(otherCount);
    if (tableTrackedCount) tableTrackedCount.textContent = String(totalTracked);
    if (tableChobhamProfit) tableChobhamProfit.textContent = formatSignedCurrency(chobhamReimbursement);
    if (tableOtherProfit) tableOtherProfit.textContent = formatSignedCurrency(-otherCharge);
    if (tableDoctorProfitTotal) tableDoctorProfitTotal.textContent = formatSignedCurrency(netPrescriberTotal);
  }

  setUsername();
  updateProfitSummary();

  if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
      const willOpen = !navMenu.classList.contains("is-open");
      navMenu.classList.toggle("is-open", willOpen);
      setExpandedState(menuButton, willOpen);
      setMenuIcon(willOpen);
      if (!willOpen) closeAllDropdowns();
    });
  }

  if (reportsButton && reportsWrap) {
    reportsButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeWrap(userWrap, userButton);
      toggleWrap(reportsWrap, reportsButton);
    });
  }

  if (userButton && userWrap) {
    userButton.addEventListener("click", function (event) {
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

  [chobhamInput, otherInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", updateProfitSummary);
    input.addEventListener("change", updateProfitSummary);
  });

  counterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const targetId = button.getAttribute("data-counter-target");
      const targetInput = document.getElementById(targetId);
      if (!targetInput) return;

      const currentValue = sanitizeInputValue(targetInput);
      const isPlus = button.getAttribute("data-counter") === "plus";
      const nextValue = isPlus ? currentValue + 1 : Math.max(0, currentValue - 1);
      targetInput.value = String(nextValue);
      updateProfitSummary();
    });
  });

  document.addEventListener("click", function (event) {
    if (reportsWrap && !reportsWrap.contains(event.target)) {
      closeWrap(reportsWrap, reportsButton);
    }

    if (userWrap && !userWrap.contains(event.target)) {
      closeWrap(userWrap, userButton);
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAllDropdowns();
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (!isMobileView()) {
      navMenu?.classList.remove("is-open");
      setExpandedState(menuButton, false);
      setMenuIcon(false);
    }
  });
});