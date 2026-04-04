// ./scripts/login.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.onclick = null;

  function showError(message) {
    if (window.RxToast?.error) {
      window.RxToast.error("Login failed", message);
      return;
    }
    alert(message);
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = (document.getElementById("email")?.value || "").trim();
    const password = document.getElementById("password")?.value || "";

    if (!username || !password) {
      showError("Username and password are required");
      return;
    }

    try {
      const resp = await RX.api.post("/login", { username, password }, { auth: false });

      RX.setSession(resp.access_token, resp.user);
      window.name = `${resp.user.full_name || ""}`;

      const lt = resp.user?.login_type;
      const isAdmin = Number(resp.user?.is_admin || 0) === 1;

      if (lt === "dispenser" || lt === "chobham") {
        window.location.href = "./dispense-prescription.html";
      } else if (lt === "clinician") {
        window.location.href = "./dr-form.html";
      } else if (lt === "clinic") {
        window.location.href = "./approvals.html";
      } else if (lt === "managment" && isAdmin) {
        window.location.href = "./dashboard.html";
      } else {
        window.location.href = "./dashboard.html";
      }
    } catch (err) {
      showError(err?.response?.error || err?.data?.message || err.message || "Login failed");
    }
  });
});