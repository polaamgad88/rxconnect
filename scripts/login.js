// ./scripts/login.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.onclick = null;

  const warningModal = document.getElementById("warningModal");
  const warningTitle = document.getElementById("warningTitle");
  const warningMessage = document.getElementById("warningMessage");
  const warningOkBtn = document.getElementById("warningOkBtn");
  const warningCloseBtn = document.getElementById("warningCloseBtn");

  function showWarningPopup(message, title = "Warning") {
    if (!warningModal) {
      alert(message);
      return;
    }

    if (warningTitle) warningTitle.textContent = title;
    if (warningMessage) warningMessage.textContent = message;

    warningModal.classList.add("show");
    warningModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeWarningPopup() {
    if (!warningModal) return;
    warningModal.classList.remove("show");
    warningModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (warningOkBtn) {
    warningOkBtn.addEventListener("click", closeWarningPopup);
  }

  if (warningCloseBtn) {
    warningCloseBtn.addEventListener("click", closeWarningPopup);
  }

  if (warningModal) {
    warningModal.addEventListener("click", function (e) {
      if (e.target === warningModal) {
        closeWarningPopup();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && warningModal?.classList.contains("show")) {
      closeWarningPopup();
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = (document.getElementById("email")?.value || "").trim();
    const password = document.getElementById("password")?.value || "";

    if (!username || !password) {
      showWarningPopup("Username and password are required", "Missing Data");
      return;
    }

    try {
      const resp = await RX.api.post("/login", { username, password }, { auth: false });

      RX.setSession(resp.access_token, resp.user);
      window.name = `${resp.user.full_name}`;

      const lt = resp.user?.login_type;
      if (lt === "dispenser" || lt === "chobham") window.location.href = "./dispense-prescription.html";
      else if (lt === "clinician") window.location.href = "./dr-form.html";
      else if (lt === "clinic") window.location.href = "./patients.html";
      else if (lt === "managment") window.location.href = "./dashboard.html";
      else window.location.href = "./dashboard.html";
    } catch (err) {
      showWarningPopup(err?.response?.error || err.message || "Login failed", "Login Failed");
    }
  });
});