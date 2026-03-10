// scripts/create-dispenser-admin.js
document.addEventListener("DOMContentLoaded", function () {
  const user = RX.requireAuth(["managment"]);
  if (!user) return;

  // Require admin flag (your backend decorator uses require_admin=True)
  if (!user.is_admin) {
    alert("Admin access required.");
    window.location.href = "./login.html";
    return;
  }

  const container =
    document.querySelector(".dashboard-container") ||
    document.querySelector(".container") ||
    document.querySelector(".w-container") ||
    document.body;

  const card = document.createElement("div");
  card.style.background = "#fff";
  card.style.border = "1px solid #eee";
  card.style.borderRadius = "12px";
  card.style.padding = "16px";
  card.style.margin = "18px 0";
  card.style.boxShadow = "0 6px 18px rgba(0,0,0,.06)";
  card.innerHTML = `
    <h3 style="margin:0 0 8px;">Create Dispenser + User (Admin)</h3>
    <div style="color:#666;font-size:13px;margin-bottom:12px;">
      Creates a dispenser record and an approved dispenser user in one transaction.
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div>
        <label style="font-size:12px;color:#555;">Pharmacy Name *</label>
        <input id="d_pharmacy_name" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">License Number</label>
        <input id="d_license_number" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Email *</label>
        <input id="d_email" type="email" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Phone</label>
        <input id="d_phone" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Address</label>
        <input id="d_address" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Username (defaults to email)</label>
        <input id="d_username" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div>
        <label style="font-size:12px;color:#555;">Full Name (defaults to pharmacy name)</label>
        <input id="d_full_name" type="text" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>

      <div style="grid-column:1 / span 2;">
        <label style="font-size:12px;color:#555;">Password *</label>
        <input id="d_password" type="password" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;">
      </div>
    </div>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
      <button id="d_submit" type="button" style="padding:10px 14px;border:0;border-radius:10px;background:#16a34a;color:#fff;cursor:pointer;">
        Create
      </button>
      <button id="d_clear" type="button" style="padding:10px 14px;border:1px solid #ddd;border-radius:10px;background:#fff;cursor:pointer;">
        Clear
      </button>
    </div>

    <div id="d_result" style="margin-top:12px;color:#111;"></div>
  `;

  // Insert near top
  if (container.firstChild) container.insertBefore(card, container.firstChild);
  else container.appendChild(card);

  const $ = (id) => document.getElementById(id);
  const resEl = $("d_result");

  function setResult(html, isError) {
    resEl.innerHTML = `<div style="padding:10px;border-radius:10px;border:1px solid ${isError ? "#fecaca" : "#bbf7d0"};background:${isError ? "#fef2f2" : "#f0fdf4"};">
      ${html}
    </div>`;
  }

  function clearForm() {
    [
      "d_pharmacy_name",
      "d_license_number",
      "d_email",
      "d_phone",
      "d_address",
      "d_username",
      "d_full_name",
      "d_password",
    ].forEach((id) => ($(id).value = ""));
    resEl.innerHTML = "";
  }

  $("d_clear").addEventListener("click", clearForm);

  $("d_submit").addEventListener("click", async function () {
    const pharmacy_name = $("d_pharmacy_name").value.trim();
    const license_number = $("d_license_number").value.trim() || null;
    const email = $("d_email").value.trim();
    const phone = $("d_phone").value.trim() || null;
    const address = $("d_address").value.trim() || null;
    const username = $("d_username").value.trim() || email;
    const full_name = $("d_full_name").value.trim() || pharmacy_name;
    const password = $("d_password").value;

    if (!pharmacy_name || !email || !password) {
      setResult("pharmacy_name, email, password are required.", true);
      return;
    }

    const payload = {
      pharmacy_name,
      license_number,
      phone,
      email,
      address,
      username,
      full_name,
      password,
    };

    try {
      const resp = await RX.api.post("/users/dispensers/create-with-user", payload);
      setResult(
        `Created successfully.<br>
         dispenser_id: <strong>${resp.dispenser_id}</strong><br>
         user_id: <strong>${resp.user_id}</strong><br>
         username: <strong>${resp.username}</strong>`,
        false
      );
      // Optionally clear password only
      $("d_password").value = "";
    } catch (err) {
      setResult(err.message || "Create failed", true);
    }
  });
});