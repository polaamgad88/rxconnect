// ./scripts/login.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.onclick = null;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = (document.getElementById("email")?.value || "").trim(); // your input id is "email"
    const password = document.getElementById("password")?.value || "";

    if (!username || !password) {
      alert("Username and password are required");
      return;
    }

    try {
      const resp = await RX.api.post("/login", { username, password }, { auth: false });

      // expected: { access_token, user }
      RX.setSession(resp.access_token, resp.user);

      const lt = resp.user?.login_type;
      if (lt === "dispenser" || lt === "chobham") window.location.href = "./dispense-prescription.html";
      else if (lt === "clinician") window.location.href = "./dr-form.html";
      else if (lt === "clinic") window.location.href = "./patients.html";
      else if (lt === "managment") window.location.href = "./dashboard.html";
      else window.location.href = "./dashboard.html";
    } catch (err) {
      alert(err.message || "Login failed");
    }
  });
});