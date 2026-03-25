document.addEventListener("DOMContentLoaded", function () {
  const form =
    document.getElementById("dispenseLookupForm") ||
    document.querySelector(".dispense-form") ||
    document.querySelector("form");

  const codeEl = document.getElementById("prescription-id");
  const dobEl = document.getElementById("dob");

  const pharmacyBox = document.getElementById("pharmacyRegistrationBox");
  const pharmacyNameEl = document.getElementById("pharmacyName");
  const pharmacyPhoneEl = document.getElementById("pharmacyPhone");
  const pharmacyEmailEl = document.getElementById("pharmacyEmail");
  const pharmacyAddressEl = document.getElementById("pharmacyAddress");
  const pharmacyStatusEl = document.getElementById("pharmacyRegistrationStatus");

  if (!form || !codeEl || !dobEl) return;

  let resultBox = document.getElementById("rxResult");
  if (!resultBox) {
    resultBox = document.createElement("div");
    resultBox.id = "rxResult";
    resultBox.className = "dispense-result";
    form.parentElement.appendChild(resultBox);
  }

  let lastLookup = null;
  let isSubmittingDispense = false;
  let respRegister = null;

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
        border-radius:16px;
        padding:14px 16px;
        box-shadow:0 10px 30px rgba(12, 34, 71, .08);
        text-align:left;
      ">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function showPharmacyStatus(message, isError = false) {
    if (!pharmacyStatusEl) return;
    pharmacyStatusEl.style.display = message ? "block" : "none";
    pharmacyStatusEl.style.color = isError ? "#c62828" : "#2e7d32";
    pharmacyStatusEl.textContent = message || "";
  }

  function getCurrentUser() {
    try {
      return typeof RX !== "undefined" && typeof RX.getUser === "function"
        ? RX.getUser()
        : null;
    } catch {
      return null;
    }
  }

  function setPharmacyBoxVisibility() {
    const user = getCurrentUser();
    const canAlreadyDispense =
      user && ["dispenser", "chobham"].includes(user.login_type);

    if (pharmacyBox) {
      pharmacyBox.style.display = canAlreadyDispense ? "none" : "block";
    }
  }

  function getPharmacyFormData() {
    return {
      pharmacy_name: (pharmacyNameEl?.value || "").trim(),
      phone: (pharmacyPhoneEl?.value || "").trim(),
      email: (pharmacyEmailEl?.value || "").trim(),
      address: (pharmacyAddressEl?.value || "").trim(),
    };
  }

  function validatePharmacyFormData(data) {
    if (!data.pharmacy_name) return "Pharmacy name is required.";
    if (!data.phone) return "Phone number is required.";
    if (!data.address) return "Address is required.";
    return null;
  }

  function clearPharmacyForm() {
    if (pharmacyNameEl) pharmacyNameEl.value = "";
    if (pharmacyPhoneEl) pharmacyPhoneEl.value = "";
    if (pharmacyEmailEl) pharmacyEmailEl.value = "";
    if (pharmacyAddressEl) pharmacyAddressEl.value = "";
  }

  function getDispenserId() {
    const user = getCurrentUser();
    return (
      user?.dispenser_id ||
      user?.id ||
      respRegister?.dispenser_id ||
      respRegister?.id ||
      null
    );
  }

  async function ensureDispenserSession() {
    let user = getCurrentUser();
    if (user && ["dispenser", "chobham"].includes(user.login_type)) {
      return user;
    }

    const pharmacyData = getPharmacyFormData();
    const validationError = validatePharmacyFormData(pharmacyData);
    if (validationError) {
      throw new Error(validationError);
    }

    showPharmacyStatus("Creating pharmacy account...");

    try {
      respRegister = await RX.api.post(
        "/dispensers/register",
        {
          pharmacy_name: pharmacyData.pharmacy_name,
          phone: pharmacyData.phone || null,
          email: pharmacyData.email,
          address: pharmacyData.address || null,
          username: pharmacyData.email,
          full_name: pharmacyData.pharmacy_name,
        },
        { auth: false }
      );
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      const alreadyExists =
        msg.includes("already taken") ||
        msg.includes("duplicate") ||
        msg.includes("integrity");

      if (!alreadyExists) {
        throw err;
      }
    }

    showPharmacyStatus("Signing in pharmacy account...");

    user = getCurrentUser();
    setPharmacyBoxVisibility();
    showPharmacyStatus("Pharmacy account is ready.", false);
    clearPharmacyForm();

    return user || respRegister || null;
  }

  function buildRow(it, index) {
    const prescribed = asNumber(it.quantity_prescribed, 0);
    const dispensed = asNumber(it.quantity_dispensed_total, 0);
    const remaining = Math.max(prescribed - dispensed, 0);

    const infoParts = [];
    if (it.item_status) infoParts.push(`Status: ${it.item_status}`);
    if (it.dosage_instructions) infoParts.push(`Dose: ${it.dosage_instructions}`);
    infoParts.push(`Prescribed: ${prescribed}`);
    infoParts.push(`Dispensed: ${dispensed}`);
    infoParts.push(`Remaining: ${remaining}`);

    return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#222;">${index + 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#222;">
          ${escapeHtml(it.medication_name || it.medication_id || "")}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#222;">
          ${escapeHtml(it.schedule || "")}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#222;">
          ${escapeHtml(infoParts.join(" | "))}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:#222;">
          <button
            type="button"
            class="rx-select cnp-btn-secondary"
            data-pi="${escapeHtml(it.prescription_item_id)}"
            data-mid="${escapeHtml(it.medication_id)}"
            style="min-width:110px;"
          >
            Include
          </button>
        </td>
      </tr>
    `;
  }

  function renderLookup(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const displayCode = data.code || data.prescription_number || "-";

    const rows = items.map((it, i) => buildRow(it, i)).join("");

    const header = `
      <div style="
        background:#fff;
        color:#222;
        border-radius:16px;
        padding:16px;
        box-shadow:0 10px 30px rgba(12, 34, 71, .08);
        text-align:left;
      ">
        <div><strong>Prescription code:</strong> ${escapeHtml(displayCode)}</div>
        <div><strong>Status:</strong> ${escapeHtml(data.status || "-")}</div>
        <div><strong>Issue date:</strong> ${escapeHtml(data.issue_date || "-")}</div>
        <div><strong>Expires at:</strong> ${escapeHtml(data.expires_at || "-")}</div>
      </div>
    `;

    const table = `
      <div style="
        margin-top:12px;
        background:#fff;
        color:#222;
        border-radius:16px;
        padding:16px;
        box-shadow:0 10px 30px rgba(12, 34, 71, .08);
        overflow:auto;
      ">
        <table style="width:100%;border-collapse:collapse;color:#222;">
          <thead>
            <tr>
              <th style="text-align:left;padding:10px 8px;border-bottom:1px solid #eee;color:#222;">#</th>
              <th style="text-align:left;padding:10px 8px;border-bottom:1px solid #eee;color:#222;">Medication</th>
              <th style="text-align:left;padding:10px 8px;border-bottom:1px solid #eee;color:#222;">Schedule</th>
              <th style="text-align:left;padding:10px 8px;border-bottom:1px solid #eee;color:#222;">Details</th>
              <th style="text-align:left;padding:10px 8px;border-bottom:1px solid #eee;color:#222;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows ||
              `<tr><td colspan="5" style="padding:12px;color:#222;">No items found for this prescription.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;

    const btn = items.length
      ? `
        <button
          id="doDispense"
          type="button"
          class="dispense-search-btn button full-width w-button"
          style="margin-top:12px;"
        >
          Dispense
        </button>
      `
      : `<div style="margin-top:10px;color:#444;">This prescription has no items to dispense.</div>`;

    resultBox.innerHTML = header + table + btn;
  }

  async function lookupPrescription() {
    const enteredCode = normalizeValue(codeEl.value);
    const dob = dobEl.value;

    if (!enteredCode || !dob) {
      throw new Error("Prescription code and DOB are required");
    }

    const user = getCurrentUser();
    const canPortalLookup =
      user && ["dispenser", "chobham"].includes(user.login_type);

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

    return { data };
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMessage("Searching...");

    try {
      const { data } = await lookupPrescription();
      renderLookup(data);
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Lookup failed", true);
    }
  });

  resultBox.addEventListener("click", function (e) {
    const btn = e.target.closest(".rx-select");
    if (!btn || !resultBox.contains(btn)) return;

    btn.classList.toggle("selected");

    if (btn.classList.contains("selected")) {
      btn.style.background = "#2e7d32";
      btn.style.borderColor = "#2e7d32";
      btn.style.color = "#fff";
      btn.textContent = "Included";
    } else {
      btn.style.background = "";
      btn.style.borderColor = "";
      btn.style.color = "";
      btn.textContent = "Include";
    }
  });

  resultBox.addEventListener("click", async function (e) {
    const dispenseBtn = e.target.closest("#doDispense");
    if (!dispenseBtn || !resultBox.contains(dispenseBtn) || isSubmittingDispense) {
      return;
    }

    isSubmittingDispense = true;
    showPharmacyStatus("");

    try {
      let lookup = lastLookup?.data;
      if (!lookup) {
        const refreshed = await lookupPrescription();
        lookup = refreshed.data;
        renderLookup(lookup);
      }

      if (!lookup.prescription_id || !lookup.patient_id) {
        throw new Error(
          "This prescription cannot be dispensed because prescription_id or patient_id is missing from lookup."
        );
      }

      const items = Array.from(
        resultBox.querySelectorAll(".rx-select.selected")
      ).map((btn) => ({
        prescription_item_id: btn.dataset.pi,
        medication_id: btn.dataset.mid,
      }));

      if (!items.length) {
        throw new Error("Select at least one item to dispense.");
      }

      await ensureDispenserSession();

      const dispenserId = getDispenserId();
      if (!dispenserId) {
        throw new Error("Could not determine dispenser account for this dispensation.");
      }

      const resp = await RX.api.post("/dispensations/create", {
        dispenser_id: dispenserId,
        prescription_id: lookup.prescription_id,
        patient_id: lookup.patient_id,
        prescriber_unique_string: lookup.prescriber_unique_string,
        verified_first_name: lookup.first_name || "Unknown",
        verified_last_name: lookup.last_name || "Unknown",
        verified_date_of_birth: lastLookup?.dob || dobEl.value,
        items,
      });

      showMessage(resp.message || "Dispensation created successfully");
      setPharmacyBoxVisibility();
    } catch (err) {
      console.error(err);
      showMessage(err.message || "Dispense failed", true);
      showPharmacyStatus(err.message || "Dispense failed", true);
    } finally {
      isSubmittingDispense = false;
    }
  });

  setPharmacyBoxVisibility();
});