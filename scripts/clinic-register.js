// scripts/clinic-register.js
document.addEventListener("DOMContentLoaded", function () {
  // This is a public registration page (no auth required)
  const container =
    document.querySelector(".w-container") ||
    document.querySelector(".container") ||
    document.body;

  // Build form UI (doesn't depend on existing markup)
  const card = document.createElement("div");
  card.style.maxWidth = "760px";
  card.style.margin = "18px auto";
  card.style.background = "#fff";
  card.style.border = "1px solid #eee";
  card.style.borderRadius = "12px";
  card.style.padding = "16px";
  card.style.boxShadow = "0 6px 18px rgba(0,0,0,.06)";

  card.innerHTML = `
    <h2 style="margin:0 0 6px;">Clinic Registration</h2>
    <div style="color:#666;font-size:13px;margin-bottom:14px;">
      Clinic accounts require manual approval by Management.
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Clinic Name *</label>
        <input id="c_clinic_name" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">License Number</label>
        <input id="c_license_number" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Phone</label>
        <input id="c_phone" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Email (will be clinic username) *</label>
        <input id="c_email" type="email" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Address</label>
        <input id="c_address" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Username (defaults to email)</label>
        <input id="c_username" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Full Name (defaults to clinic name)</label>
        <input id="c_full_name" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Password *</label>
        <input id="c_password" type="password" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Request Notes (optional)</label>
        <textarea id="c_request_notes" rows="3" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;resize:vertical;"></textarea>
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
      <button id="c_submit" type="button" style="padding:10px 14px;border:0;border-radius:10px;background:#0ea5e9;color:#fff;cursor:pointer;">
        Submit Registration
      </button>
      <button id="c_clear" type="button" style="padding:10px 14px;border:1px solid #ddd;border-radius:10px;background:#fff;cursor:pointer;">
        Clear
      </button>
    </div>

    <div id="c_result" style="margin-top:12px;"></div>

    <div style="margin-top:14px;font-size:13px;color:#444;">
      Already registered? <a href="./login.html">Login</a>
    </div>
  `;

  // Put it at top of page
  container.prepend(card);

  const $ = (id) => document.getElementById(id);
  const res = $("c_result");

  function setResult(msg, isErr) {
    res.innerHTML = `
      <div style="padding:10px;border-radius:10px;border:1px solid ${isErr ? "#fecaca" : "#bbf7d0"};background:${isErr ? "#fef2f2" : "#f0fdf4"};">
        ${msg}
      </div>
    `;
  }

  function clear() {
    [
      "c_clinic_name",
      "c_license_number",
      "c_phone",
      "c_email",
      "c_address",
      "c_username",
      "c_full_name",
      "c_password",
      "c_request_notes",
    ].forEach((id) => ($(id).value = ""));
    res.innerHTML = "";
  }

  $("c_clear").addEventListener("click", clear);

  $("c_submit").addEventListener("click", async function () {
    const clinic_name = $("c_clinic_name").value.trim();
    const license_number = $("c_license_number").value.trim() || null;
    const phone = $("c_phone").value.trim() || null;
    const email = $("c_email").value.trim();
    const address = $("c_address").value.trim() || null;

    const username = $("c_username").value.trim() || email;
    const full_name = $("c_full_name").value.trim() || clinic_name;
    const password = $("c_password").value;
    const request_notes = $("c_request_notes").value.trim() || null;

    if (!clinic_name || !email || !password) {
      setResult("clinic_name, email, password are required.", true);
      return;
    }

    try {
      const resp = await RX.api.post(
        "/clinics/register",
        {
          clinic_name,
          license_number,
          phone,
          email,
          address,
          username,
          full_name,
          password,
          request_notes,
        },
        { auth: false }
      );

      setResult(
        `Registration submitted for approval.<br>
         clinic_id: <strong>${resp.clinic_id}</strong><br>
         user_id: <strong>${resp.user_id}</strong><br>
         approval_request_id: <strong>${resp.approval_request_id}</strong><br>
         username: <strong>${resp.username}</strong>`,
        false
      );

      // optional: redirect to login after a moment
      setTimeout(() => (window.location.href = "./login.html"), 1500);
    } catch (err) {
      setResult(err.message || "Registration failed", true);
    }
  });
});