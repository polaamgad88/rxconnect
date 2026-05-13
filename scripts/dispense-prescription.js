document.addEventListener("DOMContentLoaded", function () {
  const form =
    document.getElementById("dispenseLookupForm") ||
    document.querySelector(".dispense-form") ||
    document.querySelector("form");

  const codeEl = document.getElementById("prescription-id");
  const dobDayEl = document.getElementById("dobDay");
  const dobMonthEl = document.getElementById("dobMonth");
  const dobYearEl = document.getElementById("dobYear");
  const resultBox = document.getElementById("rxResult");

  const modalEl = document.getElementById("pharmacyModal");
  const modalForm = document.getElementById("pharmacyModalForm");
  const modalCloseBtn = document.getElementById("closePharmacyModal");
  const modalCancelBtn = document.getElementById("cancelPharmacyModal");


  const successModalEl = document.getElementById("dispenseSuccessModal");
const successModalCloseBtn = document.getElementById("closeDispenseSuccessModal");
const successDownloadPdfBtn = document.getElementById("successDownloadPdf");
const successSendEmailBtn = document.getElementById("successSendEmail");
const successCloseBtn = document.getElementById("successCloseBtn");
const successStatusEl = document.getElementById("dispenseSuccessStatus");
const successCopyEl = document.getElementById("dispenseSuccessCopy");


  const pharmacyNameEl = document.getElementById("pharmacyName");
  const pharmacyPhoneEl = document.getElementById("pharmacyPhone");
  const pharmacyEmailEl = document.getElementById("pharmacyEmail");
  const pharmacyAddressEl = document.getElementById("pharmacyAddress");
  const pharmacyAcknowledgeEl = document.getElementById("pharmacyAcknowledge");
  const pharmacyStatusEl = document.getElementById("pharmacyRegistrationStatus");

  if (
    !form ||
    !codeEl ||
    !dobDayEl ||
    !dobMonthEl ||
    !dobYearEl ||
    !resultBox ||
    !modalEl ||
    !modalForm
  ) {
    return;
  }

  let lastLookup = null;
  let isSearching = false;
  let isSubmittingDispense = false;
  let respRegister = null;
  let lastPharmacyDetails = null;
  let lastDispenseResponse = null;
  function normalizeValue(value) {
    return String(value || "").trim();
  }

  function normalizeUpper(value) {
    return normalizeValue(value).toUpperCase();
  }

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function buildDobFromParts(dd, mm, yyyy) {
    const day = onlyDigits(dd).padStart(2, "0");
    const month = onlyDigits(mm).padStart(2, "0");
    const year = onlyDigits(yyyy);

    if (!day || !month || !year) return "";
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return "";

    const dayNum = Number(day);
    const monthNum = Number(month);
    const yearNum = Number(year);

    if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 31) return "";
    if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) return "";
    if (!Number.isFinite(yearNum) || yearNum < 1900) return "";

    const dob = `${year}-${month}-${day}`;
    const d = new Date(`${dob}T00:00:00`);

    if (
      Number.isNaN(d.getTime()) ||
      d.getFullYear() !== yearNum ||
      d.getMonth() + 1 !== monthNum ||
      d.getDate() !== dayNum
    ) {
      return "";
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (d > today) return "";

    return dob;
  }

  function getDobValue() {
    return buildDobFromParts(
      dobDayEl?.value,
      dobMonthEl?.value,
      dobYearEl?.value
    );
  }

  function getDobDisplayValue() {
    const day = onlyDigits(dobDayEl?.value).padStart(2, "0");
    const month = onlyDigits(dobMonthEl?.value).padStart(2, "0");
    const year = onlyDigits(dobYearEl?.value);

    if (!day || !month || !year) return "";
    return `${day}/${month}/${year}`;
  }

  function setupDobPartInputs() {
    const parts = [dobDayEl, dobMonthEl, dobYearEl].filter(Boolean);

    parts.forEach(function (input, index) {
      input.addEventListener("input", function () {
        input.value = onlyDigits(input.value);

        const max = Number(input.getAttribute("maxlength") || 0);
        if (max && input.value.length >= max && parts[index + 1]) {
          parts[index + 1].focus();
        }
      });

      input.addEventListener("keydown", function (event) {
        if (event.key === "Backspace" && !input.value && parts[index - 1]) {
          parts[index - 1].focus();
        }
      });
    });
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

  function readPath(obj, path) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => {
      if (acc == null) return undefined;
      return acc[key];
    }, obj);
  }

  function pickValue(source, paths, fallback = "") {
    for (const path of paths) {
      const value = readPath(source, path);
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return fallback;
  }

  function setResultContent(html) {
    resultBox.innerHTML = html;
  }

  function showMessage(title, message, type = "info") {
    setResultContent(`
      <div class="dispense-message ${type === "error" ? "is-error" : ""} ${
      type === "success" ? "is-success" : ""
    }">
        <p class="dispense-message-title">${escapeHtml(title)}</p>
        <p class="dispense-message-copy">${escapeHtml(message)}</p>
      </div>
    `);
  }

  function showPharmacyStatus(message, isError = false) {
    if (!pharmacyStatusEl) return;
    pharmacyStatusEl.style.display = message ? "block" : "none";
    pharmacyStatusEl.style.borderColor = isError
      ? "rgba(180, 35, 24, 0.15)"
      : "rgba(176, 115, 43, 0.14)";
    pharmacyStatusEl.style.background = isError ? "#fff8f7" : "#faf8f4";
    pharmacyStatusEl.style.color = isError ? "#b42318" : "#333333";
    pharmacyStatusEl.textContent = message || "";
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return formatDate(new Date().toISOString());
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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

  function hasSessionToken() {
    try {
      return !!localStorage.getItem("rxconnect_token");
    } catch {
      return false;
    }
  }

  function persistAuthFromResponse(response) {
    if (!response) return;

    const token = pickValue(response, [
      "token",
      "access_token",
      "data.token",
      "data.access_token",
      "user.token",
      "session.token",
    ]);

    const user =
      (typeof response?.user === "object" ? response.user : null) ||
      readPath(response, "data.user") ||
      readPath(response, "account.user") ||
      null;

    try {
      if (token) localStorage.setItem("rxconnect_token", token);

      if (user) {
        localStorage.setItem(
          "rxconnect_user",
          JSON.stringify({
            user_id: user.user_id ?? user.id ?? null,
            username: user.username || user.email || "",
            email: user.email || "",
            full_name: user.full_name || user.name || user.username || user.email || "",
            name: user.name || user.full_name || user.username || user.email || "",
            phone: user.phone || "",
            login_type: user.login_type || "",
            is_admin: Number(user.is_admin || 0),
            clinic_id: user.clinic_id ?? null,
            clinician_id: user.clinician_id ?? null,
            dispenser_id: user.dispenser_id ?? null,
            pharmacy_name: user.pharmacy_name || "",
          })
        );
      }
    } catch {
      // ignore storage errors
    }
  }

  function extractDispenserId(source) {
    return pickValue(source, [
      "dispenser_id",
      "id",
      "user.dispenser_id",
      "user.id",
      "data.dispenser_id",
      "data.id",
      "data.user.dispenser_id",
      "data.user.id",
      "dispenser.id",
      "account.dispenser_id",
    ]);
  }

  function getPharmacyFormData() {
    return {
      pharmacy_name: normalizeValue(pharmacyNameEl?.value),
      phone: normalizeValue(pharmacyPhoneEl?.value),
      email: normalizeValue(pharmacyEmailEl?.value),
      address: normalizeValue(pharmacyAddressEl?.value),
      acknowledged: !!pharmacyAcknowledgeEl?.checked,
    };
  }

  function validatePharmacyFormData(data) {
    if (!data.pharmacy_name) return "Pharmacy name is required.";
    if (!data.phone) return "Phone number is required.";
    if (!data.address) return "Address is required.";
    if (!data.acknowledged) {
      return "You must confirm that the prescription code is one-time use.";
    }
    return null;
  }

  function prefillPharmacyForm() {
    const user = getCurrentUser();
    const source = lastPharmacyDetails || user || {};

    if (pharmacyNameEl && !pharmacyNameEl.value) {
      pharmacyNameEl.value = pickValue(source, [
        "pharmacy_name",
        "full_name",
        "name",
        "company_name",
      ]);
    }

    if (pharmacyPhoneEl && !pharmacyPhoneEl.value) {
      pharmacyPhoneEl.value = pickValue(source, ["phone", "phone_number"]);
    }

    if (pharmacyEmailEl && !pharmacyEmailEl.value) {
      pharmacyEmailEl.value = pickValue(source, ["email"]);
    }

    if (pharmacyAddressEl && !pharmacyAddressEl.value) {
      pharmacyAddressEl.value = pickValue(source, ["address", "location"]);
    }
  }

  function openModal() {
    modalForm.reset();
    showPharmacyStatus("");
    modalEl.hidden = false;
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("dispense-modal-open");
    setTimeout(() => {
      pharmacyNameEl?.focus();
    }, 30);
  }

  function closeModal(force = false) {
    if (isSubmittingDispense && !force) return;
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("dispense-modal-open");
    showPharmacyStatus("");
  }
  function showSuccessStatus(message, isError = false) {
  if (!successStatusEl) return;
  successStatusEl.style.display = message ? "block" : "none";
  successStatusEl.style.borderColor = isError
    ? "rgba(180, 35, 24, 0.15)"
    : "rgba(6, 118, 71, 0.14)";
  successStatusEl.style.background = isError ? "#fff8f7" : "#f6fffb";
  successStatusEl.style.color = isError ? "#b42318" : "#067647";
  successStatusEl.textContent = message || "";
}

function openSuccessModal(message) {
  if (successCopyEl) {
    successCopyEl.textContent =
      message ||
      "The prescription has been dispensed and the one-time code is now consumed.";
  }
  showSuccessStatus("");
  if (!successModalEl) return;
  successModalEl.hidden = false;
  successModalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("dispense-modal-open");
}

function closeSuccessModal() {
  if (!successModalEl) return;
  successModalEl.hidden = true;
  successModalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("dispense-modal-open");
  showSuccessStatus("");
}

  function getLookupData() {
    return lastLookup?.data || null;
  }

  function getLookupItems(data) {
    return Array.isArray(data?.items) ? data.items : [];
  }

  function getRemainingItems(data) {
    return getLookupItems(data).filter((item) => {
      const prescribed = asNumber(item.quantity_prescribed, 0);
      const dispensed = asNumber(item.quantity_dispensed_total, 0);
      const remaining = Math.max(prescribed - dispensed, 0);
      return remaining > 0 || (!prescribed && !dispensed);
    });
  }

  function getPrescriptionCode(data) {
    return pickValue(data, ["code", "prescription_number", "rxc_code"], "-");
  }

  function getPrescriptionStatus(data) {
    return String(
      pickValue(data, ["status", "prescription_status"], "unknown")
    ).toLowerCase();
  }

  function getPatientName(data) {
    const combined = pickValue(data, [
      "patient_name",
      "full_name",
      "verified_full_name",
      "patient.full_name",
      "patient.name",
    ]);

    if (combined) return combined;

    const first = pickValue(data, [
      "first_name",
      "patient_first_name",
      "verified_first_name",
      "patient.first_name",
    ]);
    const last = pickValue(data, [
      "last_name",
      "patient_last_name",
      "verified_last_name",
      "patient.last_name",
    ]);

    return [first, last].filter(Boolean).join(" ") || "-";
  }

  function getPatientDob(data) {
    return (
      pickValue(data, [
        "date_of_birth",
        "patient_date_of_birth",
        "verified_date_of_birth",
        "patient.date_of_birth",
      ]) ||
      lastLookup?.dob ||
      getDobValue() ||
      getDobDisplayValue() ||
      "-"
    );
  }

  function parsePatientNotesAddress(notes) {
    const text = String(notes || "").trim();
    if (!text) return "-";

    const lines = text.split(/\r?\n/);
    const parts = [];

    lines.forEach(function (line) {
      const clean = line.trim();
      if (!clean) return;

      if (/^Address:\s*/i.test(clean)) {
        parts.push(clean.replace(/^Address:\s*/i, "").trim());
      } else if (/^Address Line 1:\s*/i.test(clean)) {
        parts.push(clean.replace(/^Address Line 1:\s*/i, "").trim());
      } else if (/^Address Line 2:\s*/i.test(clean)) {
        parts.push(clean.replace(/^Address Line 2:\s*/i, "").trim());
      } else if (/^Address Line 3:\s*/i.test(clean)) {
        parts.push(clean.replace(/^Address Line 3:\s*/i, "").trim());
      } else if (/^Postal Code:\s*/i.test(clean)) {
        parts.push(clean.replace(/^Postal Code:\s*/i, "").trim());
      } else if (/^Country:\s*/i.test(clean)) {
        parts.push(clean.replace(/^Country:\s*/i, "").trim());
      }
    });

    if (parts.length) return parts.filter(Boolean).join(", ");

    return text.replace(/^Address:\s*/i, "").trim() || "-";
  }

  function getPatientGender(data) {
    return pickValue(data, ["patient_gender", "gender", "patient.gender"], "-");
  }

  function getPatientPhone(data) {
    return pickValue(data, ["patient_phone", "phone", "patient.phone"], "-");
  }

  function getPatientEmail(data) {
    return pickValue(data, ["patient_email", "email", "patient.email"], "-");
  }

  function getPatientAddress(data) {
    const notes = pickValue(data, ["patient_notes", "notes", "patient.notes"], "");
    return parsePatientNotesAddress(notes);
  }

  function getPrescriberEmail(data) {
    return pickValue(data, ["prescriber_email", "doctor.email", "prescriber.email"], "-");
  }

  function getPrescriberPhone(data) {
    return pickValue(data, ["prescriber_phone", "doctor.phone", "prescriber.phone"], "-");
  }

  function getItemStrengthFormulation(item) {
    const notes = String(item?.notes || "").trim();

    if (/^Strength and formulation:\s*/i.test(notes)) {
      return notes.replace(/^Strength and formulation:\s*/i, "").trim();
    }

    return pickValue(item, ["strength", "dosage_form", "schedule"], "-");
  }

  function getPrescriberName(data) {
    return pickValue(
      data,
      [
        "prescriber_name",
        "prescriber_full_name",
        "doctor_name",
        "issuer_name",
        "clinician_name",
        "doctor.full_name",
        "prescriber.full_name",
      ],
      "-"
    );
  }

  function getPrescriberLicense(data) {
    return pickValue(
      data,
      [
        "prescriber_license_number",
        "clinician_license_number",
        "prescriber_professional_license_no",
        "professional_license_no",
        "doctor.license_number",
        "prescriber.license_number",
      ],
      "-"
    );
  }

  function getPrescriberSpecialty(data) {
    return pickValue(
      data,
      [
        "prescriber_specialty",
        "specialty",
        "doctor.specialty",
        "prescriber.specialty",
      ],
      "-"
    );
  }

  function getPrescriberClinic(data) {
    return pickValue(
      data,
      [
        "prescriber_clinic_name",
        "clinic_name",
        "doctor.clinic_name",
        "prescriber.clinic_name",
      ],
      "-"
    );
  }

  function getIssueDate(data) {
    return pickValue(data, ["issue_date", "issued_at", "created_at"], "-");
  }

  function getExpiryDate(data) {
    return pickValue(data, ["expires_at", "expiry_date", "expiry"], "-");
  }

  function getBlockerMessage(data) {
    const status = getPrescriptionStatus(data);

    if (["fully_dispensed", "dispensed"].includes(status)) {
      return "This prescription has already been dispensed.";
    }

    if (["cancelled", "canceled"].includes(status)) {
      return "This prescription has been cancelled and cannot be dispensed.";
    }

    if (["expired"].includes(status)) {
      return "This prescription has expired and cannot be dispensed.";
    }

    if (!getLookupItems(data).length) {
      return "No medicines were found on this prescription.";
    }

    if (!getRemainingItems(data).length) {
      return "This prescription has no remaining medicines available for dispensing.";
    }

    return "";
  }

  function describeLookupError(error) {
    const raw = String(error?.message || error || "Lookup failed");
    const msg = raw.toLowerCase();

    if (msg.includes("not found") || msg.includes("no prescription")) {
      return "No prescription found for this code and date of birth.";
    }

    if (
      msg.includes("already been used") ||
      msg.includes("already used") ||
      msg.includes("dispensed") ||
      msg.includes("one time")
    ) {
      return raw;
    }

    return raw;
  }

  async function safeApiPost(url, payload, options) {
    if (typeof RX === "undefined" || !RX.api || typeof RX.api.post !== "function") {
      throw new Error("rxconnect.js is required before this page script.");
    }
    return RX.api.post(url, payload, options);
  }

  async function lookupPrescription() {
    const enteredCode = normalizeUpper(codeEl.value);
    const dob = getDobValue();

    console.log("Looking up prescription with code:", enteredCode, "and DOB:", dob);

    if (!enteredCode) {
      throw new Error("Prescription code is required.");
    }

    if (!dob) {
      throw new Error("Enter a valid patient DOB as DD / MM / YYYY.");
    }

    const user = getCurrentUser();
    const canPortalLookup =
      user && ["dispenser", "chobham"].includes(user.login_type);

    const payload = {
      code: enteredCode,
      date_of_birth: dob,
    };

    const data = canPortalLookup
      ? await safeApiPost("/prescriptions/lookup", payload)
      : await safeApiPost("/prescriptions/public/lookup", payload, { auth: false });

    lastLookup = {
      inputCode: enteredCode,
      dob,
      canPortalLookup,
      data,
    };

    return data;
  }
  function buildGuestUsername(pharmacyData) {
    const base =
      (pharmacyData.pharmacy_name || "pharmacy")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 30) || "pharmacy";

    return `${base}-${Date.now()}`;
  }

  async function ensureDispenserReady(pharmacyData) {
    const currentUser = getCurrentUser();
    if (currentUser && ["dispenser", "chobham"].includes(currentUser.login_type)) {
      return currentUser;
    }

    showPharmacyStatus("Creating pharmacy account...");

    const registerPayload = {
      pharmacy_name: pharmacyData.pharmacy_name,
      phone: pharmacyData.phone || null,
      email: pharmacyData.email || null,
      address: pharmacyData.address || null,
      username: buildGuestUsername(pharmacyData),
      full_name: pharmacyData.pharmacy_name,
    };

    try {
      respRegister = await safeApiPost("/dispensers/register", registerPayload, {
        auth: false,
      });
    } catch (error) {
      const msg = String(error?.message || error || "").toLowerCase();
      const mightBeDuplicate =
        msg.includes("already") ||
        msg.includes("duplicate") ||
        msg.includes("exists") ||
        msg.includes("integrity");

      if (!mightBeDuplicate) {
        throw error;
      }

      respRegister = await safeApiPost(
        "/dispensers/register",
        {
          ...registerPayload,
          email: null,
          username: buildGuestUsername(pharmacyData),
        },
        { auth: false }
      );
    }

    persistAuthFromResponse(respRegister);

    const storedUser = getCurrentUser();
    if (storedUser && ["dispenser", "chobham"].includes(storedUser.login_type)) {
      return storedUser;
    }

    return respRegister || null;
  }

  function buildDispensationPayload(data, pharmacyData, dispenserId) {
    const remainingItems = getRemainingItems(data).map((item) => ({
      prescription_item_id: item.prescription_item_id,
      medication_id: item.medication_id,
    }));

    if (!remainingItems.length) {
      throw new Error("No medicines are available for dispensing.");
    }

    const patientName = getPatientName(data);
    const nameParts = patientName.split(" ").filter(Boolean);
    const verifiedFirstName = pickValue(
      data,
      ["first_name", "verified_first_name"],
      nameParts[0] || "Unknown"
    );
    const verifiedLastName = pickValue(
      data,
      ["last_name", "verified_last_name"],
      nameParts.slice(1).join(" ") || "Unknown"
    );

    const payload = {
      dispenser_id: dispenserId,
      prescription_id: pickValue(data, ["prescription_id", "id"]),
      patient_id: pickValue(data, ["patient_id", "patient.id"]),
      prescriber_unique_string: pickValue(data, [
        "prescriber_unique_string",
        "prescriber_id",
        "doctor_id",
      ]),
      verified_first_name: verifiedFirstName,
      verified_last_name: verifiedLastName,
      verified_date_of_birth: getPatientDob(data),
      items: remainingItems,
    };

    if (!payload.prescription_id || !payload.patient_id) {
      throw new Error(
        "This prescription is missing prescription_id or patient_id, so the dispensation request cannot be completed."
      );
    }

    lastPharmacyDetails = {
      pharmacy_name: pharmacyData.pharmacy_name,
      phone: pharmacyData.phone,
      email: pharmacyData.email,
      address: pharmacyData.address,
      dispenser_id: dispenserId,
    };

    return payload;
  }

  async function createDispensation(payload) {
    const tryDefault = () => safeApiPost("/dispensations/create", payload);
    const tryPublic = () => safeApiPost("/dispensations/create", payload, { auth: false });

    try {
      return await tryDefault();
    } catch (error) {
      const msg = String(error?.message || error || "").toLowerCase();
      const authRelated =
        msg.includes("unauthorized") ||
        msg.includes("forbidden") ||
        msg.includes("401") ||
        msg.includes("403");

      if (authRelated && !getCurrentUser() && !hasSessionToken()) {
        return tryPublic();
      }

      throw error;
    }
  }

  function renderPrescriptionDocument(data, pharmacyData, dispenseResponse) {
    const items = getLookupItems(data);
    const code = getPrescriptionCode(data);
    const patientName = getPatientName(data);
    const patientDob = getPatientDob(data);
    const prescriberName = getPrescriberName(data);
    const patientGender = getPatientGender(data);
    const patientPhone = getPatientPhone(data);
    const patientEmail = getPatientEmail(data);
    const patientAddress = getPatientAddress(data);
    const prescriberEmail = getPrescriberEmail(data);
    const prescriberPhone = getPrescriberPhone(data);
    const prescriberLicense = getPrescriberLicense(data);
    const prescriberSpecialty = getPrescriberSpecialty(data);
    const rawClinic = getPrescriberClinic(data);

    const prescriberClinic =
      !rawClinic || rawClinic.trim() === "-" || rawClinic.includes("- -")
        ? "Independent Doctor"
        : rawClinic;
    const issueDate = getIssueDate(data);
    const expiryDate = getExpiryDate(data);
    const dispensedAt =
      pickValue(dispenseResponse, [
        "dispensed_at",
        "created_at",
        "data.dispensed_at",
        "data.created_at",
      ]) || new Date().toISOString();

    const rxcLabel = code.startsWith("RXC") ? "RxC Code" : "Prescription Code";

    const rows = items
      .map((item, index) => {
        const prescribed = asNumber(item.quantity_prescribed, 0);
        const dispensedTotal = asNumber(item.quantity_dispensed_total, 0);
        const remainingBeforeDispense = Math.max(prescribed - dispensedTotal, 0);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(
              pickValue(item, ["medication_name", "name"], item.medication_id || "-")
            )}</td>
            <td>${escapeHtml(
              getItemStrengthFormulation(item)
            )}</td>
            <td>${escapeHtml(
              pickValue(item, ["dosage_instructions", "instructions"], "-")
            )}</td>
            <td>${escapeHtml(String(remainingBeforeDispense || prescribed || "-"))}</td>
          </tr>
        `;
      })
      .join("");

    setResultContent(`
      <div class="eprescription-shell">
        <div id="prescriptionDocument" class="eprescription-card">
          <div class="eprescription-top">
            <div>
              <span class="dispense-kicker">Formal e-prescription</span>
              <h3>Electronic Prescription</h3>
              <p class="eprescription-title-copy">
                This prescription has been dispensed successfully and the one-time code is now consumed.
              </p>
            </div>
            <div class="eprescription-status-pill is-success">
              <i class="fa-solid fa-check-circle" aria-hidden="true"></i>
              <span>Dispensed</span>
            </div>
          </div>

          <div class="eprescription-meta-grid">
            <div class="eprescription-stat">
              <p class="eprescription-stat-label">${escapeHtml(rxcLabel)}</p>
              <p class="eprescription-stat-value">${escapeHtml(code)}</p>
            </div>
            <div class="eprescription-stat">
              <p class="eprescription-stat-label">Dispensed at</p>
              <p class="eprescription-stat-value">${escapeHtml(
                formatDateTime(dispensedAt)
              )}</p>
            </div>
            <div class="eprescription-stat">
              <p class="eprescription-stat-label">Issue date</p>
              <p class="eprescription-stat-value">${escapeHtml(formatDate(issueDate))}</p>
            </div>
            <div class="eprescription-stat">
              <p class="eprescription-stat-label">Expires at</p>
              <p class="eprescription-stat-value">${escapeHtml(formatDate(expiryDate))}</p>
            </div>
          </div>

          <div class="eprescription-party-grid">
            <section class="eprescription-party">
              <h4>Patient details</h4>
              <p><strong>Name:</strong> ${escapeHtml(patientName)}</p>
              <p><strong>DOB:</strong> ${escapeHtml(formatDate(patientDob))}</p>
              <p><strong>Gender:</strong> ${escapeHtml(patientGender)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(patientPhone)}</p>
              <p><strong>Email:</strong> ${escapeHtml(patientEmail)}</p>
              <p><strong>Address:</strong> ${escapeHtml(patientAddress)}</p>
            </section>

            <section class="eprescription-party">
              <h4>Prescriber / Issuer</h4>
              <p><strong>Doctor:</strong> ${escapeHtml(prescriberName)}</p>
              <p><strong>License no:</strong> ${escapeHtml(prescriberLicense)}</p>
              <p><strong>Specialty:</strong> ${escapeHtml(prescriberSpecialty)}</p>
              <p><strong>Clinic:</strong> ${escapeHtml(prescriberClinic)}</p>
              <p><strong>Email:</strong> ${escapeHtml(prescriberEmail)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(prescriberPhone)}</p>
              <p><strong>Issuer ref:</strong> ${escapeHtml(
                pickValue(data, ["prescriber_unique_string"], "-")
              )}</p>
            </section>
          </div>

          <div class="eprescription-party-grid">
            <section class="eprescription-party">
              <h4>Dispensing pharmacy</h4>
              <p><strong>Pharmacy:</strong> ${escapeHtml(pharmacyData.pharmacy_name)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(pharmacyData.phone)}</p>
              <p><strong>Email:</strong> ${escapeHtml(pharmacyData.email || "-")}</p>
              <p><strong>Address:</strong> ${escapeHtml(pharmacyData.address)}</p>
            </section>

            <section class="eprescription-party">
              <h4>Status</h4>
              <p><strong>Prescription status:</strong> Dispensed</p>
              <p><strong>One-time code:</strong> Used</p>
              <p><strong>Dispensed by:</strong> ${escapeHtml(pharmacyData.pharmacy_name)}</p>
            </section>
          </div>

          <section class="eprescription-section">
            <h4>Medicines</h4>
            <div class="eprescription-table-wrap">
              <table class="eprescription-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Strength</th>
                    <th>Directions</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    rows ||
                    '<tr><td colspan="5"><div class="eprescription-empty">No medicine items available.</div></td></tr>'
                  }
                </tbody>
              </table>
            </div>
          </section>

          <div class="eprescription-footnote">
            This is a one-time-use e-prescription record generated after successful dispensing.
            The prescription code can no longer be reused.
          </div>
        </div>

        <div class="eprescription-actions">
          <button type="button" class="eprescription-btn is-primary" id="downloadPrescriptionPdf">
            <i class="fa-solid fa-file-pdf" aria-hidden="true"></i>
            <span>Download PDF</span>
          </button>
          <button type="button" class="eprescription-btn is-secondary" id="downloadPrescriptionImage">
            <i class="fa-solid fa-image" aria-hidden="true"></i>
            <span>Download Image</span>
          </button>
          <button type="button" class="eprescription-btn is-secondary" id="startNewLookup">
            <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
            <span>Search Another Prescription</span>
          </button>
        </div>
      </div>
    `);
  }


  function renderPrescriptionPreview(data) {
  const items = getLookupItems(data);
  const code = getPrescriptionCode(data);
  const patientName = getPatientName(data);
  const patientDob = getPatientDob(data);
  const patientGender = getPatientGender(data);
  const patientPhone = getPatientPhone(data);
  const patientEmail = getPatientEmail(data);
  const patientAddress = getPatientAddress(data);
  const prescriberEmail = getPrescriberEmail(data);
  const prescriberPhone = getPrescriberPhone(data);
  const prescriberName = getPrescriberName(data);
  const prescriberLicense = getPrescriberLicense(data);
  const prescriberSpecialty = getPrescriberSpecialty(data);
  const rawClinic = getPrescriberClinic(data);

  const prescriberClinic =
    !rawClinic || rawClinic.trim() === "-" || rawClinic.includes("- -")
      ? "Independent Doctor"
      : rawClinic;
  const issueDate = getIssueDate(data);
  const expiryDate = getExpiryDate(data);

  const rows = items
    .map((item, index) => {
      const prescribed = asNumber(item.quantity_prescribed, 0);
      const dispensedTotal = asNumber(item.quantity_dispensed_total, 0);
      const remaining = Math.max(prescribed - dispensedTotal, 0);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(
            pickValue(item, ["medication_name", "name"], item.medication_id || "-")
          )}</td>
          <td>${escapeHtml(
            getItemStrengthFormulation(item)
          )}</td>
          <td>${escapeHtml(
            pickValue(item, ["dosage_instructions", "instructions"], "-")
          )}</td>
          <td>${escapeHtml(String(remaining || prescribed || "-"))}</td>
        </tr>
      `;
    })
    .join("");

  setResultContent(`
    <div class="eprescription-shell">
      <div id="prescriptionDocument" class="eprescription-card is-preview">
        <div class="eprescription-top">
          <div>
            <span class="dispense-kicker">Prescription preview</span>
            <h3>Electronic Prescription</h3>
            <p class="eprescription-title-copy">
              Review this prescription first. It will only be marked as dispensed after the final dispense action is confirmed.
            </p>
          </div>
          <div class="eprescription-status-pill is-pending">
            <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
            <span>Ready to dispense</span>
          </div>
        </div>

        <div class="eprescription-meta-grid">
          <div class="eprescription-stat">
            <p class="eprescription-stat-label">RxC Code</p>
            <p class="eprescription-stat-value">${escapeHtml(code)}</p>
          </div>
          <div class="eprescription-stat">
            <p class="eprescription-stat-label">Current status</p>
            <p class="eprescription-stat-value">${escapeHtml(
              pickValue(data, ["status", "prescription_status"], "-")
            )}</p>
          </div>
          <div class="eprescription-stat">
            <p class="eprescription-stat-label">Issue date</p>
            <p class="eprescription-stat-value">${escapeHtml(formatDate(issueDate))}</p>
          </div>
          <div class="eprescription-stat">
            <p class="eprescription-stat-label">Expires at</p>
            <p class="eprescription-stat-value">${escapeHtml(formatDate(expiryDate))}</p>
          </div>
        </div>

        <div class="eprescription-party-grid">
          <section class="eprescription-party">
            <h4>Patient details</h4>
            <p><strong>Name:</strong> ${escapeHtml(patientName)}</p>
            <p><strong>DOB:</strong> ${escapeHtml(formatDate(patientDob))}</p>
            <p><strong>Gender:</strong> ${escapeHtml(patientGender)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(patientPhone)}</p>
            <p><strong>Email:</strong> ${escapeHtml(patientEmail)}</p>
            <p><strong>Address:</strong> ${escapeHtml(patientAddress)}</p>
          </section>

          <section class="eprescription-party">
            <h4>Prescriber / Issuer</h4>
            <p><strong>Doctor:</strong> ${escapeHtml(prescriberName)}</p>
            <p><strong>License no:</strong> ${escapeHtml(prescriberLicense)}</p>
            <p><strong>Specialty:</strong> ${escapeHtml(prescriberSpecialty)}</p>
            <p><strong>Clinic:</strong> ${escapeHtml(prescriberClinic)}</p>
            <p><strong>Email:</strong> ${escapeHtml(prescriberEmail)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(prescriberPhone)}</p>
            <p><strong>Issuer ref:</strong> ${escapeHtml(
              pickValue(data, ["prescriber_unique_string"], "-")
            )}</p>
          </section>
        </div>

        <section class="eprescription-section">
          <h4>Medicines</h4>
          <div class="eprescription-table-wrap">
            <table class="eprescription-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>Strength</th>
                  <th>Directions</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${
                  rows ||
                  '<tr><td colspan="5"><div class="eprescription-empty">No medicine items available.</div></td></tr>'
                }
              </tbody>
            </table>
          </div>
        </section>

        <div class="eprescription-footnote">
          This is a preview only. The one-time code will be consumed only after the final dispense action is completed.
        </div>
      </div>

      <div class="eprescription-actions">
        <button type="button" class="eprescription-btn is-primary" id="openDispenseFlow">
          <i class="fa-solid fa-prescription-bottle-medical" aria-hidden="true"></i>
          <span>Dispense Prescription</span>
        </button>
        <button type="button" class="eprescription-btn is-secondary" id="startNewLookup">
          <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
          <span>Search Another Prescription</span>
        </button>
      </div>
    </div>
  `);
}
  async function downloadPrescriptionAsImage() {
    const docEl = document.getElementById("prescriptionDocument");
    if (!docEl) return;
    if (typeof html2canvas !== "function") {
      throw new Error("html2canvas is missing.");
    }

    const canvas = await html2canvas(docEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${getPrescriptionCode(getLookupData()) || "prescription"}.png`;
    link.click();
  }

  async function downloadPrescriptionAsPdf() {
    const docEl = document.getElementById("prescriptionDocument");
    if (!docEl) return;
    if (typeof html2canvas !== "function") {
      window.print();
      return;
    }

    const canvas = await html2canvas(docEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    if (!window.jspdf || !window.jspdf.jsPDF) {
      window.print();
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 24;
    const usableWidth = pageWidth - margin * 2;
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pageUsableHeight = pageHeight - margin * 2;

    const imgData = canvas.toDataURL("image/png");
    let remainingHeight = imgHeight;
    let positionY = margin;
    let sourceY = 0;

    if (imgHeight <= pageUsableHeight) {
      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    } else {
      const pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d");
      const sliceHeightPx = Math.floor((pageUsableHeight * canvas.width) / imgWidth);
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;

      let pageIndex = 0;
      while (remainingHeight > 0) {
        if (pageIndex > 0) pdf.addPage();

        ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          pageCanvas.width,
          sliceHeightPx
        );

        const pageImgData = pageCanvas.toDataURL("image/png");
        const currentHeight = Math.min(pageUsableHeight, remainingHeight);
        pdf.addImage(pageImgData, "PNG", margin, positionY, imgWidth, currentHeight);

        remainingHeight -= pageUsableHeight;
        sourceY += sliceHeightPx;
        pageIndex += 1;
      }
    }

    pdf.save(`${getPrescriptionCode(getLookupData()) || "prescription"}.pdf`);
  }



  async function sendPrescriptionByEmail() {
  const data = getLookupData();
  const pharmacyData = lastPharmacyDetails || {};
  const emailTo = normalizeValue(pharmacyData.email);

  if (!emailTo) {
    throw new Error("No pharmacy email was entered for this dispensation.");
  }

  const code = getPrescriptionCode(data);
  const patientName = getPatientName(data);
  const patientDob = formatDate(getPatientDob(data));
  const prescriberName = getPrescriberName(data);
  const prescriberLicense = getPrescriberLicense(data);
  const prescriberSpecialty = getPrescriberSpecialty(data);
  const rawClinic = getPrescriberClinic(data);
  const prescriberClinic =
    !rawClinic || rawClinic.trim() === "-" || rawClinic.includes("- -")
      ? "Independent Doctor"
      : rawClinic;
  const dispensedAt = formatDateTime(
    pickValue(lastDispenseResponse, [
      "dispensed_at",
      "created_at",
      "data.dispensed_at",
      "data.created_at",
    ]) || new Date().toISOString()
  );

  const content = [
    `Prescription dispensed successfully.`,
    ``,
    `Code: ${code}`,
    `Patient: ${patientName}`,
    `DOB: ${patientDob}`,
    `Prescriber: ${prescriberName}`,
    `Prescriber license: ${prescriberLicense}`,
    `Prescriber specialty: ${prescriberSpecialty}`,
    `Prescriber clinic: ${prescriberClinic}`,
    `Dispensed at: ${dispensedAt}`,
    `Pharmacy: ${pharmacyData.pharmacy_name || "-"}`,
    `Phone: ${pharmacyData.phone || "-"}`,
    `Email: ${pharmacyData.email || "-"}`,
    `Address: ${pharmacyData.address || "-"}`,
  ].join("\n");

  const fd = new FormData();
  fd.append("email", emailTo);
  fd.append("content", content);
  fd.append("sender", "RxConnect");
  fd.append("number", pharmacyData.phone || "");

  const res = await fetch(`${RX.API_BASE}/send-mail`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to send the prescription email.");
  }

  return true;
}
setupDobPartInputs();
form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (isSearching) return;

  isSearching = true;
  showMessage("Searching prescription", "Checking the prescription code and patient DOB.");

  try {
    const data = await lookupPrescription();
    const blockerMessage = getBlockerMessage(data);

    if (blockerMessage) {
      showMessage("Prescription unavailable", blockerMessage, "error");
      return;
    }

    renderPrescriptionPreview(data);
  } catch (error) {
    console.error(error);
    showMessage("Lookup failed", describeLookupError(error), "error");
  } finally {
    isSearching = false;
  }
});

  modalForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (isSubmittingDispense) return;

    const pharmacyData = getPharmacyFormData();
    const validationError = validatePharmacyFormData(pharmacyData);

    if (validationError) {
      showPharmacyStatus(validationError, true);
      return;
    }

    const data = getLookupData();
    if (!data) {
      showPharmacyStatus("Search for a prescription first.", true);
      return;
    }

    isSubmittingDispense = true;
    showPharmacyStatus("Preparing dispensation...");

    try {
      const dispenserContext = await ensureDispenserReady(pharmacyData);
      const dispenserId =
        extractDispenserId(dispenserContext) ||
        extractDispenserId(respRegister) ||
        extractDispenserId(getCurrentUser());

      if (!dispenserId) {
        throw new Error("Could not determine the dispenser account for this pharmacy.");
      }

      const payload = buildDispensationPayload(data, pharmacyData, dispenserId);
      showPharmacyStatus("Submitting dispensation...");

     const dispenseResponse = await createDispensation(payload);
lastDispenseResponse = dispenseResponse || {};

closeModal(true);
renderPrescriptionDocument(data, pharmacyData, lastDispenseResponse);
openSuccessModal(
  `The prescription has been dispensed successfully by ${pharmacyData.pharmacy_name}. You can now download the PDF or send the prescription by email.`
);
    } catch (error) {
      console.error(error);
      showPharmacyStatus(error?.message || "Dispense failed.", true);
    } finally {
      isSubmittingDispense = false;
    }
  });

  resultBox.addEventListener("click", async function (event) {
const pdfBtn = event.target.closest("#downloadPrescriptionPdf");
const imageBtn = event.target.closest("#downloadPrescriptionImage");
const resetBtn = event.target.closest("#startNewLookup");
const openDispenseBtn = event.target.closest("#openDispenseFlow");

    if (pdfBtn) {
      try {
        await downloadPrescriptionAsPdf();
      } catch (error) {
        console.error(error);
        showMessage("PDF download failed", error?.message || "Could not generate the PDF.", "error");
      }
      return;
    }

    if (imageBtn) {
      try {
        await downloadPrescriptionAsImage();
      } catch (error) {
        console.error(error);
        showMessage(
          "Image download failed",
          error?.message || "Could not generate the image.",
          "error"
        );
      }
      return;
    }

if (openDispenseBtn) {
  openModal();
  return;
}

if (resetBtn) {
  form.reset();
  modalForm.reset();
  lastLookup = null;
  lastDispenseResponse = null;
  respRegister = null;
  resultBox.innerHTML = "";
  showPharmacyStatus("");
  showSuccessStatus("");
  closeSuccessModal();
  codeEl.focus();
}
  });

  modalCloseBtn?.addEventListener("click", closeModal);
  modalCancelBtn?.addEventListener("click", closeModal);
successModalCloseBtn?.addEventListener("click", closeSuccessModal);
successCloseBtn?.addEventListener("click", closeSuccessModal);

successDownloadPdfBtn?.addEventListener("click", async function () {
  try {
    await downloadPrescriptionAsPdf();
    showSuccessStatus("PDF downloaded successfully.");
  } catch (error) {
    console.error(error);
    showSuccessStatus(error?.message || "Could not generate the PDF.", true);
  }
});

successSendEmailBtn?.addEventListener("click", async function () {
  try {
    showSuccessStatus("Sending email...");
    await sendPrescriptionByEmail();
    showSuccessStatus("Prescription email sent successfully.");
  } catch (error) {
    console.error(error);
    showSuccessStatus(error?.message || "Failed to send the prescription email.", true);
  }
});
modalEl.addEventListener("click", function (event) {
  const closeTarget = event.target.closest("[data-close-modal='true']");
  if (closeTarget) closeModal();
});

successModalEl?.addEventListener("click", function (event) {
  const closeTarget = event.target.closest("[data-close-success-modal='true']");
  if (closeTarget) closeSuccessModal();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape" && successModalEl && !successModalEl.hidden) {
    closeSuccessModal();
    return;
  }

  if (event.key === "Escape" && !modalEl.hidden) {
    closeModal();
  }
});
});