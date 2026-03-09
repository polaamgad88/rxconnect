// ./scripts/dispense-prescription.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".form-card form");
  const codeEl = document.getElementById("prescription-id");
  const dobEl = document.getElementById("dob");

  if (!form || !codeEl || !dobEl) return;

  let resultBox = document.getElementById("rxResult");
  if (!resultBox) {
    resultBox = document.createElement("div");
    resultBox.id = "rxResult";
    resultBox.style.marginTop = "18px";
    form.parentElement.appendChild(resultBox);
  }

  function renderLookup(data, canDispense) {
    const items = data.items || [];
    const rows = items.map((it, i) => {
      const stock = it.stock_on_hand != null ? ` (stock: ${it.stock_on_hand})` : "";
      const qtyRemain = (it.quantity_prescribed != null && it.quantity_dispensed_total != null)
        ? (Number(it.quantity_prescribed) - Number(it.quantity_dispensed_total))
        : null;

      const qtyInfo = qtyRemain != null ? `Remaining: ${qtyRemain}` : "";

      return `
        <tr>
          <td>${i + 1}</td>
          <td>${it.medication_name || it.medication_id}</td>
          <td>${it.schedule || ""}</td>
          <td>${it.quantity_prescribed || ""}</td>
          <td>${it.quantity_dispensed_total || ""}</td>
          <td>${qtyInfo}${stock}</td>
          ${
            canDispense
              ? `<td>
                  <input data-pi="${it.prescription_item_id}" data-mid="${it.medication_id}" class="rx-qty" type="number" min="0" step="1" placeholder="Qty" style="width:90px" />
                  <input data-pi="${it.prescription_item_id}" class="rx-price" type="number" min="0" step="0.01" placeholder="Price" style="width:110px" />
                </td>`
              : `<td>-</td>`
          }
        </tr>
      `;
    }).join("");

    const header = `
      <div style="background:#fff;border-radius:10px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.08);text-align:left;">
        <div><strong>Status:</strong> ${data.status || "-"}</div>
        <div><strong>Issue date:</strong> ${data.issue_date || "-"}</div>
        <div><strong>Expires at:</strong> ${data.expires_at || "-"}</div>
      </div>
    `;

    const table = `
      <div style="margin-top:12px;background:#fff;border-radius:10px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.08);overflow:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">#</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Medication</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Schedule</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Prescribed</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Dispensed</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Info</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">Dispense</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const btn = canDispense
      ? `<button id="doDispense" type="button" class="button full-width w-button" style="margin-top:12px;background:green;">
           Dispense (logged-in pharmacy)
         </button>`
      : `<div style="margin-top:10px;color:#444;">
           Logged-out mode: lookup only. Login as a dispenser to dispense.
         </div>`;

    resultBox.innerHTML = header + table + btn;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    resultBox.innerHTML = "";

    const code = (codeEl.value || "").trim();
    const dob = dobEl.value;

    if (!code || !dob) {
      alert("Prescription ID and DOB are required");
      return;
    }

    const user = RX.getUser();
    const canPortalLookup = user && (user.login_type === "dispenser" || user.login_type === "chobham");

    try {
      const data = canPortalLookup
        ? await RX.api.post("/prescriptions/lookup", { code, date_of_birth: dob })
        : await RX.api.post("/prescriptions/public/lookup", { code, date_of_birth: dob }, { auth: false });

      renderLookup(data, canPortalLookup);
    } catch (err) {
      alert(err.message || "Lookup failed");
    }
  });

  resultBox.addEventListener("click", async function (e) {
    if (e.target.id !== "doDispense") return;

    const user = RX.requireAuth(["dispenser", "chobham"]);
    if (!user) return;

    const code = (codeEl.value || "").trim();
    const dob = dobEl.value;

    let lookup;
    try {
      lookup = await RX.api.post("/prescriptions/lookup", { code, date_of_birth: dob });
    } catch (err) {
      alert(err.message || "Failed to refresh prescription data");
      return;
    }

    if (!lookup.prescription_id || !lookup.patient_id) {
      alert("This prescription cannot be dispensed from this view (missing IDs).");
      return;
    }

    const items = (lookup.items || []).map((it) => {
      const qtyEl = resultBox.querySelector(`.rx-qty[data-pi="${it.prescription_item_id}"]`);
      const priceEl = resultBox.querySelector(`.rx-price[data-pi="${it.prescription_item_id}"]`);
      const quantity_dispensed = qtyEl ? Number(qtyEl.value || 0) : 0;
      const unit_price = priceEl ? Number(priceEl.value || 0) : 0;

      if (!quantity_dispensed || !unit_price) return null;

      return {
        prescription_item_id: it.prescription_item_id,
        medication_id: it.medication_id,
        quantity_dispensed,
        unit_price,
      };
    }).filter(Boolean);

    if (!items.length) {
      alert("Enter quantity and unit price for at least one item.");
      return;
    }

    try {
      await RX.api.post("/dispensations/create", {
        prescription_id: lookup.prescription_id,
        patient_id: lookup.patient_id,
        verified_first_name: lookup.first_name || "Unknown",
        verified_last_name: lookup.last_name || "Unknown",
        verified_date_of_birth: dob,
        items,
      });
      alert("Dispensation created successfully");
    } catch (err) {
      alert(err.message || "Dispense failed");
    }
  });
});