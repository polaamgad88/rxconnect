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
  const logoutLink = document.getElementById("logoutLink");
  const form = document.getElementById("createPatientForm");
  const submitBtn = document.getElementById("submitPatientBtn");
  const statusEl = document.getElementById("formStatus");

  const user = RX.requireAuth(["clinician", "clinic"]);
  if (!user) return;

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
    if (willOpen) openWrap(wrap, button);
    else closeWrap(wrap, button);
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
    const currentUser = getStoredUser();
    const displayName =
      (currentUser && (currentUser.username || currentUser.name || currentUser.full_name || currentUser.email)) ||
      "admin.builtin";
    usernameEl.textContent = displayName;
  }

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.classList.remove("success", "error");
    if (type) statusEl.classList.add(type);
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    const label = submitBtn.querySelector(".btn-label");
    if (label) {
      label.textContent = isSubmitting ? "Creating Patient..." : "Create Patient";
    }
  }

  function buildRedirect(patientId) {
    const ref = String(document.referrer || "").toLowerCase();

    sessionStorage.setItem("rx_selected_patient_id", String(patientId));
    sessionStorage.setItem("patient_history_patient_id", String(patientId));

    if (ref.includes("dr-form.html")) {
      return `./dr-form.html?patient_id=${encodeURIComponent(patientId)}`;
    }

    return `./patient-history.html?patient_id=${encodeURIComponent(patientId)}`;
  }

  async function saveForClinician(patientId) {
    if (user.login_type !== "clinician") return;
    await RX.api.post("/clinicians/me/saved-patients", {
      patient_id: patientId,
    });
  }

  setUsername();

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

  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setStatus("");
    setSubmitting(true);

    const first_name = (document.getElementById("firstName")?.value || "").trim();
    const last_name = (document.getElementById("lastName")?.value || "").trim();
    const gender = document.getElementById("gender")?.value || null;
    const phone = (document.getElementById("phone")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const national_id = (document.getElementById("nhsNumber")?.value || "").trim();
    const date_of_birth = document.getElementById("dob")?.value || "";

    const address1 = (document.getElementById("address1")?.value || "").trim();
    const address2 = (document.getElementById("address2")?.value || "").trim();
    const city = (document.getElementById("city")?.value || "").trim();
    const postcode = (document.getElementById("postcode")?.value || "").trim();
    const country = (document.getElementById("country")?.value || "").trim();

    if (!first_name || !last_name || !date_of_birth) {
      setStatus("First name, last name and date of birth are required.", "error");
      setSubmitting(false);
      return;
    }

    const notesParts = [];
    if (address1) notesParts.push(address1);
    if (address2) notesParts.push(address2);
    if (city) notesParts.push(city);
    if (postcode) notesParts.push(postcode);
    if (country) notesParts.push(country);
    const notes = notesParts.length ? `Address: ${notesParts.join(", ")}` : null;

    try {
      const resp = await RX.api.post("/patients/create", {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        national_id,
        notes,
      });

      const patientId = Number(resp.patient_id);
      if (!patientId) {
        throw new Error("Patient was created but no patient_id was returned.");
      }

      await saveForClinician(patientId);
      setStatus("Patient created successfully. Redirecting...", "success");
      window.location.href = buildRedirect(patientId);
    } catch (err) {
      setStatus(err.message || "Failed to create patient", "error");
    } finally {
      setSubmitting(false);
    }
  });
});