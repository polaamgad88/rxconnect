document.addEventListener("DOMContentLoaded", function () {
  const form =
    document.getElementById("dispenseLookupForm") ||
    document.querySelector(".dispense-form") ||
    document.querySelector("form");

  const codeEl = document.getElementById("prescription-id");
  const dobEl = document.getElementById("dob");
  const resultBox = document.getElementById("rxResult");

  const modalEl = document.getElementById("pharmacyModal");
  const modalForm = document.getElementById("pharmacyModalForm");
  const modalCloseBtn = document.getElementById("closePharmacyModal");
  const modalCancelBtn = document.getElementById("cancelPharmacyModal");

  const pharmacyNameEl = document.getElementById("pharmacyName");
  const pharmacyPhoneEl = document.getElementById("pharmacyPhone");
  const pharmacyEmailEl = document.getElementById("pharmacyEmail");
  const pharmacyAddressEl = document.getElementById("pharmacyAddress");
  const pharmacyAcknowledgeEl = document.getElementById("pharmacyAcknowledge");
  const pharmacyStatusEl = document.getElementById("pharmacyRegistrationStatus");

  if (!form || !codeEl || !dobEl || !resultBox || !modalEl || !modalForm) return;

  let lastLookup = null;
  let isSearching = false;
  let isSubmittingDispense = false;
  let respRegister = null;
  let lastPharmacyDetails = null;

  function normalizeValue(value) {
    return String(value || "").trim();
  }

  function normalizeUpper(value) {
    return normalizeValue(value).toUpperCase();
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
      if (user) localStorage.setItem("rxconnect_user", JSON.stringify(user));
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
    prefillPharmacyForm();
    showPharmacyStatus("");
    modalEl.hidden = false;
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("dispense-modal-open");
    setTimeout(() => {
      pharmacyNameEl?.focus();
    }, 30);
  }

  function closeModal() {
    if (isSubmittingDispense) return;
    modalEl.hidden = true;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("dispense-modal-open");
    showPharmacyStatus("");
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
      dobEl.value ||
      "-"
    );
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
        "prescriber_unique_string",
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

    if (msg.includes("dispensed") || msg.includes("one time")) {
      return "This prescription has already been dispensed or the one-time code was already used.";
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
    const dob = dobEl.value;

    if (!enteredCode || !dob) {
      throw new Error("Prescription code and patient DOB are required.");
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
              pickValue(item, ["strength", "dose", "schedule"], "-")
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
            </section>

            <section class="eprescription-party">
              <h4>Prescriber / Issuer</h4>
              <p><strong>Doctor:</strong> ${escapeHtml(prescriberName)}</p>
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

      showMessage(
        "Prescription found",
        "Complete the pharmacy popup to confirm dispensing and display the formal e-prescription.",
        "success"
      );
      openModal();
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

      closeModal();
      renderPrescriptionDocument(data, pharmacyData, dispenseResponse || {});
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

    if (resetBtn) {
      form.reset();
      modalForm.reset();
      lastLookup = null;
      respRegister = null;
      resultBox.innerHTML = "";
      showPharmacyStatus("");
      codeEl.focus();
    }
  });

  modalCloseBtn?.addEventListener("click", closeModal);
  modalCancelBtn?.addEventListener("click", closeModal);

  modalEl.addEventListener("click", function (event) {
    const closeTarget = event.target.closest("[data-close-modal='true']");
    if (closeTarget) closeModal();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modalEl.hidden) {
      closeModal();
    }
  });
});