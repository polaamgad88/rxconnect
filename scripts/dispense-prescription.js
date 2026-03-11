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

  let lastLookup = null;

  function normalizeValue(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  function asNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showMessage(message, isError = false) {
    resultBox.innerHTML = `
      <div style="
        margin-top:12px;
        background:${isError ? "#fff1f0" : "#fff"};
        color:#222;
        border:1px solid ${isError ? "#ffccc7" : "#eee"};
        border-radius:10px;
        padding:14px;
        box-shadow:0 6px 18px rgba(0,0,0,.08);
        text-align:left;
      ">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function buildRow(it, index, canDispense) {
    const prescribed = asNumber(it.quantity_prescribed, 0);
    const dispensed = asNumber(it.quantity_dispensed_total, 0);
    const remaining = Math.max(prescribed - dispensed, 0);

    const infoParts = [];
    if (it.item_status) infoParts.push(`Status: ${it.item_status}`);
    infoParts.push(`Remaining: ${remaining}`);
    if (it.dosage_instructions)
      infoParts.push(`Dose: ${it.dosage_instructions}`);

    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#222;">${index + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#222;">
          ${escapeHtml(it.medication_name || it.medication_id || "")}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#222;">
          ${escapeHtml(it.schedule || "")}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#222;">${prescribed}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#222;">${dispensed}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:#222;">
          ${escapeHtml(infoParts.join(" | "))}
        </td>
        ${
          canDispense
            ? `<td style="padding:8px;border-bottom:1px solid #eee;color:#222;">
                <input
                  data-pi="${escapeHtml(it.prescription_item_id)}"
                  data-mid="${escapeHtml(it.medication_id)}"
                  class="rx-qty"
                  type="number"
                  min="0"
                  step="1"
                  max="${remaining}"
                  placeholder="Qty"
                  style="width:110px;color:#222;background:#fff;"
                />
              </td>`
            : `<td style="padding:8px;border-bottom:1px solid #eee;color:#222;">-</td>`
        }
      </tr>
    `;
  }

  function renderLookup(data, canDispense) {
    const items = Array.isArray(data.items) ? data.items : [];
    const displayCode = data.code || data.prescription_number || "-";
    const displayUnique = data.prescriber_unique_string || "-";

    const rows = items.map((it, i) => buildRow(it, i, canDispense)).join("");

    const header = `
      <div style="background:#fff;color:#222;border-radius:10px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.08);text-align:left;">
        <div><strong>Prescription code:</strong> ${escapeHtml(displayCode)}</div>
        <div><strong>Unique string:</strong> ${escapeHtml(displayUnique)}</div>
        <div><strong>Status:</strong> ${escapeHtml(data.status || "-")}</div>
        <div><strong>Issue date:</strong> ${escapeHtml(data.issue_date || "-")}</div>
        <div><strong>Expires at:</strong> ${escapeHtml(data.expires_at || "-")}</div>
      </div>
    `;

    const table = `
      <div style="margin-top:12px;background:#fff;color:#222;border-radius:10px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.08);overflow:auto;">
        <table style="width:100%;border-collapse:collapse;color:#222;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">#</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">Medication</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">Schedule</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">Prescribed</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">Dispensed</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">Info</th>
              <th style="text-align:left;padding:8px;border-bottom:1px solid #eee;color:#222;">Dispense</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows ||
              `<tr><td colspan="7" style="padding:12px;color:#222;">No items found for this prescription.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;

    const btn =
      canDispense && items.length
        ? `<button id="doDispense" type="button" class="button full-width w-button" style="margin-top:12px;background:green;">
             Dispense
           </button>`
        : canDispense
          ? `<div style="margin-top:10px;color:#444;">This prescription has no items to dispense.</div>`
          : `<div style="margin-top:10px;color:#444;">
             Logged-out mode: lookup only. Login as a dispenser to dispense.
           </div>`;

    resultBox.innerHTML = header + table + btn;
  }

  async function lookupPrescription() {
    const enteredCode = normalizeValue(codeEl.value);
    const dob = dobEl.value;

    if (!enteredCode || !dob) {
      throw new Error("Prescription code and DOB are required");
    }

    const user = RX.getUser();
    const canPortalLookup =
      user &&
      (user.login_type === "dispenser" || user.login_type === "chobham");

    const payload = {
      code: enteredCode,
      date_of_birth: dob,
    };

    const data = canPortalLookup
      ? await RX.api.post("/prescriptions/lookup", payload)
      : await RX.api.post("/prescriptions/public/lookup", payload, {
          auth: false,
        });

    lastLookup = {
      inputCode: enteredCode,
      dob,
      canPortalLookup,
      data,
    };

    return { data, canPortalLookup };
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMessage("Searching...");

    try {
      const { data, canPortalLookup } = await lookupPrescription();
      console.log("lookup response:", data);
      renderLookup(data, canPortalLookup);
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Lookup failed", true);
    }
  });

  resultBox.addEventListener("click", async function (e) {
    if (e.target.id !== "doDispense") return;

    const user = RX.requireAuth(["dispenser", "chobham"]);
    if (!user) return;

    let lookup;
    try {
      lookup = lastLookup?.data;
      if (!lookup) {
        const refreshed = await lookupPrescription();
        lookup = refreshed.data;
        renderLookup(lookup, true);
      }
    } catch (err) {
      showMessage(err.message || "Failed to refresh prescription data", true);
      return;
    }

    if (!lookup.prescription_id || !lookup.patient_id) {
      showMessage(
        "This prescription cannot be dispensed because prescription_id or patient_id is missing from lookup.",
        true,
      );
      return;
    }

    const items = (lookup.items || [])
      .map((it) => {
        const qtyEl = resultBox.querySelector(
          `.rx-qty[data-pi="${it.prescription_item_id}"]`,
        );

        const quantity_dispensed = qtyEl ? Number(qtyEl.value || 0) : 0;

        if (!quantity_dispensed || quantity_dispensed <= 0) return null;

        return {
          prescription_item_id: it.prescription_item_id,
          medication_id: it.medication_id,
          quantity_dispensed,
        };
      })
      .filter(Boolean);

    if (!items.length) {
      showMessage("Enter quantity for at least one item.", true);
      return;
    }

    try {
      const resp = await RX.api.post("/dispensations/create", {
        prescription_id: lookup.prescription_id,
        patient_id: lookup.patient_id,
        prescriber_unique_string: lookup.prescriber_unique_string,
        verified_first_name: lookup.first_name || "Unknown",
        verified_last_name: lookup.last_name || "Unknown",
        verified_date_of_birth: lastLookup?.dob || dobEl.value,
        items,
      });

      showMessage(resp.message || "Dispensation created successfully");
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Dispense failed", true);
    }
  });
});
