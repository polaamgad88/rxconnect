document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".form-card form");
  const codeEl = document.getElementById("prescription-id");
  const dobEl = document.getElementById("dob");

  const inquiryBox = document.getElementById("clinicInquiryBox");
  const inquiryClinicNameEl = document.getElementById("inquiryClinicName");
  const inquiryClinicPhoneEl = document.getElementById("inquiryClinicPhone");
  const inquiryClinicEmailEl = document.getElementById("inquiryClinicEmail");
  const inquiryClinicLicenseNumberEl = document.getElementById("inquiryClinicLicenseNumber");
  const inquiryClinicAddressEl = document.getElementById("inquiryClinicAddress");
  const inquiryBtn = document.getElementById("submitClinicInquiry");
  const inquiryStatusEl = document.getElementById("clinicInquiryStatus");

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
    return String(value || "").trim().toUpperCase();
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

  function setInquiryVisibility() {
    const isLoggedOut = !RX.getUser();
    if (inquiryBox) {
      inquiryBox.style.display = isLoggedOut ? "block" : "none";
    }
  }

  function showInquiryStatus(message, isError = false) {
    if (!inquiryStatusEl) return;
    inquiryStatusEl.style.display = message ? "block" : "none";
    inquiryStatusEl.style.color = isError ? "#c62828" : "#2e7d32";
    inquiryStatusEl.textContent = message || "";
  }

  function buildRow(it, index, canDispense) {
    const prescribed = asNumber(it.quantity_prescribed, 0);
    const dispensed = asNumber(it.quantity_dispensed_total, 0);

    const infoParts = [];
    if (it.item_status) infoParts.push(`Status: ${it.item_status}`);
    if (it.dosage_instructions) infoParts.push(`Dose: ${it.dosage_instructions}`);

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
                <button
                  type="button"
                  class="rx-select"
                  data-pi="${escapeHtml(it.prescription_item_id)}"
                  data-mid="${escapeHtml(it.medication_id)}"
                  style="padding:4px 10px;"
                >
                  Include
                </button>
              </td>`
            : `<td style="padding:8px;border-bottom:1px solid #eee;color:#222;">-</td>`
        }
      </tr>
    `;
  }

  function renderLookup(data, canDispense) {
    const items = Array.isArray(data.items) ? data.items : [];
    const displayCode = data.code || data.prescription_number || "-";

    const rows = items.map((it, i) => buildRow(it, i, canDispense)).join("");

    const header = `
      <div style="background:#fff;color:#222;border-radius:10px;padding:14px;box-shadow:0 6px 18px rgba(0,0,0,.08);text-align:left;">
        <div><strong>Prescription code:</strong> ${escapeHtml(displayCode)}</div>
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
      renderLookup(data, canPortalLookup);
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Lookup failed", true);
    }
  });

  resultBox.addEventListener("click", function (e) {
    if (!e.target.classList.contains("rx-select")) return;

    const btn = e.target;
    btn.classList.toggle("selected");

    if (btn.classList.contains("selected")) {
      btn.style.background = "#2e7d32";
      btn.style.color = "#fff";
      btn.textContent = "Included";
    } else {
      btn.style.background = "";
      btn.style.color = "";
      btn.textContent = "Include";
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
        true
      );
      return;
    }

    const items = Array.from(
      resultBox.querySelectorAll(".rx-select.selected")
    ).map((btn) => ({
      prescription_item_id: btn.dataset.pi,
      medication_id: btn.dataset.mid,
    }));

    if (!items.length) {
      showMessage("Select at least one item to dispense.", true);
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

  inquiryBtn?.addEventListener("click", async function () {
    if (RX.getUser()) return;

    const clinic_name = (inquiryClinicNameEl?.value || "").trim();
    const email = (inquiryClinicEmailEl?.value || "").trim();
    const phone = (inquiryClinicPhoneEl?.value || "").trim();
    const license_number = (inquiryClinicLicenseNumberEl?.value || "").trim();
    const address = (inquiryClinicAddressEl?.value || "").trim();


    if (!clinic_name || !phone || !email || !license_number) {
      showInquiryStatus("Clinic data is missing please fill the fields which are required.", true);
      return;
    }

    try {
      inquiryBtn.disabled = true;
      inquiryBtn.textContent = "Sending...";
      showInquiryStatus("");

      const resp = await RX.api.post(
        "/clinics/register",
        { clinic_name, phone, license_number, address, email },
        { auth: false }
      );

      showInquiryStatus(
        resp.message || "Clinic inquiry submitted successfully.",
        false
      );

      if (inquiryClinicNameEl) inquiryClinicNameEl.value = "";
      if (inquiryClinicPhoneEl) inquiryClinicPhoneEl.value = "";
    } catch (err) {
      console.error(err);
      showInquiryStatus(
        err.message || "Failed to submit clinic inquiry.",
        true
      );
    } finally {
      inquiryBtn.disabled = false;
      inquiryBtn.textContent = "Send Inquiry";
    }
  });

  setInquiryVisibility();
});