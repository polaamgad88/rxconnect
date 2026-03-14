// scripts/prescriptions-rx.js
document.addEventListener("DOMContentLoaded", async function () {
  const user = RX.requireAuth(["clinician"]);
  if (!user) return;

  const tbody = document.getElementById("rxTbody");
  const statusSelect = document.getElementById("statusFilter");
  const dateFromInput = document.getElementById("dateFrom");
  const dateToInput = document.getElementById("dateTo");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("pt-search-btn");
  const clearBtn = document.getElementById("pt-clear-btn");
  const loadingBox = document.getElementById("ptLoading");
  const emptyBox = document.getElementById("noRows");

  const modalBackdrop = document.getElementById("rxModalBackdrop");
  const modalBody = document.getElementById("rxModalBody");
  const modalClose = document.getElementById("rxModalClose");

  let allPrescriptions = [];
  const detailsCache = new Map();
  const medSummaryCache = new Map();

  function showLoading(show, text = "Loading prescriptions...") {
    if (!loadingBox) return;
    loadingBox.style.display = show ? "block" : "none";
    loadingBox.textContent = text;
  }

  function showEmpty(show, text = "No prescriptions found.") {
    if (!emptyBox) return;
    emptyBox.style.display = show ? "block" : "none";
    emptyBox.textContent = text;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function fmtDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function fmtDateShort(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
  }

  function statusPill(status) {
    const s = String(status || "").toLowerCase();
    let cls = "pt-status-issued";

    if (s === "fully_dispensed" || s === "dispensed")
      cls = "pt-status-dispensed";
    else if (s === "cancelled") cls = "pt-status-cancelled";
    else if (s === "expired") cls = "pt-status-expired";
    else if (s === "active" || s === "issued" || s === "partially_dispensed") {
      cls = "pt-status-issued";
    }

    return `<span class="pt-status ${cls}">${escapeHtml(status || "-")}</span>`;
  }

  function normalizeStatusFilter(uiVal) {
    const v = String(uiVal || "")
      .trim()
      .toLowerCase();
    if (!v) return null;
    if (v === "issued") return ["active", "partially_dispensed", "issued"];
    if (v === "dispensed") return ["fully_dispensed", "dispensed"];
    return [v];
  }

  function getReferenceDate(rx) {
    return rx.last_dispensed_at || rx.created_at || rx.issue_date || null;
  }

  function getDispensedWhere(rx) {
    return rx.last_dispensed_at_pharmacy || rx.pharmacy_name || "-";
  }

  function applyFilters(list) {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const statusAllowed = normalizeStatusFilter(statusSelect?.value || "");
    const from = dateFromInput?.value || "";
    const to = dateToInput?.value || "";

    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;

    return list.filter(function (rx) {
      const currentStatus = String(rx.status || "").toLowerCase();
      const statusOk = !statusAllowed || statusAllowed.includes(currentStatus);

      let dateOk = true;
      const ref = getReferenceDate(rx);
      if (ref && (fromD || toD)) {
        const d = new Date(ref);
        if (!Number.isNaN(d.getTime())) {
          if (fromD && d < fromD) dateOk = false;
          if (toD && d > toD) dateOk = false;
        }
      }

      let qOk = true;
      if (q) {
        const code = String(
          rx.prescription_number || rx.code || "",
        ).toLowerCase();
        const uniq = String(rx.prescriber_unique_string || "").toLowerCase();
        const patient = String(rx.patient_name || "").toLowerCase();
        const diag = String(rx.diagnosis || "").toLowerCase();
        const status = String(rx.status || "").toLowerCase();
        const where = String(getDispensedWhere(rx) || "").toLowerCase();
        const meds = String(
          medSummaryCache.get(rx.prescription_id) || "",
        ).toLowerCase();

        qOk =
          code.includes(q) ||
          uniq.includes(q) ||
          patient.includes(q) ||
          diag.includes(q) ||
          status.includes(q) ||
          where.includes(q) ||
          meds.includes(q);
      }

      return statusOk && dateOk && qOk;
    });
  }

  async function getPrescriptionDetails(prescriptionId) {
    if (detailsCache.has(String(prescriptionId))) {
      return detailsCache.get(String(prescriptionId));
    }

    const resp = await RX.api.get(`/prescriptions/${prescriptionId}`);
    detailsCache.set(String(prescriptionId), resp);
    return resp;
  }

  async function getMedicationSummary(prescriptionId) {
    if (medSummaryCache.has(String(prescriptionId))) {
      return medSummaryCache.get(String(prescriptionId));
    }

    try {
      const resp = await getPrescriptionDetails(prescriptionId);
      const items = Array.isArray(resp.items) ? resp.items : [];

      const names = items
        .map(function (item) {
          return item.medication_name || `Medication #${item.medication_id}`;
        })
        .filter(Boolean);

      const summary = names.length ? names.join(", ") : "-";
      medSummaryCache.set(String(prescriptionId), summary);
      return summary;
    } catch (error) {
      medSummaryCache.set(String(prescriptionId), "-");
      return "-";
    }
  }

  function buildRowHtml(rx, medicationSummary) {
    return `
      <td>
        <button
          type="button"
          class="btn-chip rx-open-details"
          data-rxid="${escapeHtml(rx.prescription_id)}"
        >
          ${escapeHtml(rx.prescription_number || rx.code || "-")}
        </button>
      </td>
      <td>${escapeHtml(rx.patient_name || `Patient #${rx.patient_id || "-"}`)}</td>
      <td>${escapeHtml(medicationSummary || "-")}</td>
      <td>${escapeHtml(fmtDateShort(rx.issue_date || rx.created_at))}</td>
      <td>${statusPill(rx.status)}</td>
      <td>${escapeHtml(getDispensedWhere(rx))}</td>
      <td>
        <button class="btn-chip" type="button" data-share="${escapeHtml(rx.prescription_id)}">
          Send
        </button>
      </td>
    `;
  }

  async function render(list) {
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!list.length) {
      showEmpty(true);
      return;
    }

    showEmpty(false);

    for (const rx of list) {
      const tr = document.createElement("tr");
      tr.setAttribute("data-rxid", String(rx.prescription_id));
      tr.style.cursor = "pointer";
      tr.innerHTML = buildRowHtml(
        rx,
        medSummaryCache.get(String(rx.prescription_id)) || "Loading...",
      );
      tbody.appendChild(tr);
    }

    for (const rx of list) {
      const summary = await getMedicationSummary(rx.prescription_id);
      const row = tbody.querySelector(
        `tr[data-rxid="${CSS.escape(String(rx.prescription_id))}"]`,
      );
      if (row && row.children[2]) {
        row.children[2].textContent = summary || "-";
      }
    }
  }

  function renderDetailsModal(data) {
    const rx = data.prescription || {};
    const items = Array.isArray(data.items) ? data.items : [];
    const dispensations = Array.isArray(data.dispensations)
      ? data.dispensations
      : [];

    const itemsRows = items.length
      ? items
          .map(function (item, index) {
            return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(item.medication_name || `Medication #${item.medication_id || "-"}`)}</td>
                  <td>${escapeHtml(item.dosage_instructions || "-")}</td>
                  <td>${escapeHtml(item.quantity_prescribed ?? "-")}</td>
                  <td>${escapeHtml(item.quantity_dispensed_total ?? "-")}</td>
                  <td>${escapeHtml(item.unit || "-")}</td>
                  <td>${escapeHtml(item.item_status || "-")}</td>
                </tr>
              `;
          })
          .join("")
      : `<tr><td colspan="7">No items found.</td></tr>`;

    const dispRows = dispensations.length
      ? `
        <table class="rx-items-table" style="margin-top:18px;">
          <thead>
            <tr>
              <th>#</th>
              <th>Dispensation ID</th>
              <th>Dispensed At</th>
              <th>Pharmacy</th>
            </tr>
          </thead>
          <tbody>
            ${dispensations
              .map(function (disp, index) {
                return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${escapeHtml(disp.dispensation_id || "-")}</td>
                      <td>${escapeHtml(fmtDate(disp.dispensed_at))}</td>
                      <td>${escapeHtml(disp.pharmacy_name || "-")}</td>
                    </tr>
                  `;
              })
              .join("")}
          </tbody>
        </table>
      `
      : `<div style="margin-top:18px;color:#666;">No dispensations yet.</div>`;

    modalBody.innerHTML = `
      <div class="rx-grid">
        <div>Prescription ID</div><div>${escapeHtml(rx.prescription_id || "-")}</div>
        <div>Prescription Code</div><div>${escapeHtml(rx.prescription_number || rx.code || "-")}</div>
        <div>Unique String</div><div>${escapeHtml(rx.prescriber_unique_string || "-")}</div>
        <div>Status</div><div>${statusPill(rx.status)}</div>
        <div>Patient ID</div><div>${escapeHtml(rx.patient_id || "-")}</div>
        <div>Clinician ID</div><div>${escapeHtml(rx.clinician_id || "-")}</div>
        <div>Clinic ID</div><div>${escapeHtml(rx.clinic_id || "-")}</div>
        <div>Issue Date</div><div>${escapeHtml(fmtDate(rx.issue_date))}</div>
        <div>Expires At</div><div>${escapeHtml(fmtDate(rx.expires_at))}</div>
        <div>Diagnosis</div><div>${escapeHtml(rx.diagnosis || "-")}</div>
        <div>Notes</div><div>${escapeHtml(rx.notes || "-")}</div>
      </div>

      <h4 style="margin:18px 0 10px;">Items</h4>
      <table class="rx-items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Prescribed</th>
            <th>Dispensed</th>
            <th>Unit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <h4 style="margin:20px 0 10px;">Dispensations</h4>
      ${dispRows}
    `;

    if (modalBackdrop) modalBackdrop.style.display = "flex";
  }

  function closeModal() {
    if (modalBackdrop) modalBackdrop.style.display = "none";
  }

  async function openPrescriptionDetails(prescriptionId) {
    try {
      showLoading(true, "Loading prescription details...");
      const data = await getPrescriptionDetails(prescriptionId);
      showLoading(false);
      renderDetailsModal(data);
    } catch (error) {
      showLoading(false);
      alert(error.message || "Failed to load prescription details");
    }
  }

  async function copyShareFallback(prescriptionId) {
    try {
      const detail = await getPrescriptionDetails(prescriptionId);
      const rx = detail.prescription || {};
      const code = rx.prescription_number || "";
      const unique = rx.prescriber_unique_string || "";

      const text = `Prescription code: ${code}\n`;
      try {
        await navigator.clipboard.writeText(text);
        alert("Prescription code copied.\n\n" + text);
      } catch (_) {
        alert("Copy this manually:\n\n" + text);
      }
    } catch (error) {
      alert(error.message || "Failed to prepare prescription code");
    }
  }

  async function handleShare(prescriptionId) {
    try {
      const resp = await RX.api.post(`/prescriptions/${prescriptionId}/share`, {
        send_email: true,
        send_to_chobham: true,
      });

      alert(resp.sms_text || resp.message || "Share prepared successfully.");
    } catch (_) {
      await copyShareFallback(prescriptionId);
    }
  }

  async function load() {
    showLoading(true);
    showEmpty(false);

    try {
      const resp = await RX.api.get("/clinicians/me/prescriptions");
      allPrescriptions = Array.isArray(resp.prescriptions)
        ? resp.prescriptions
        : [];
      showLoading(false);
      await render(applyFilters(allPrescriptions));
    } catch (error) {
      showLoading(false);
      showEmpty(true, "Failed to load prescriptions.");
      alert(
        (error.message || "Failed to load prescriptions") +
          "\n\nExpected endpoint: GET /clinicians/me/prescriptions",
      );
    }
  }

  async function rerender() {
    await render(applyFilters(allPrescriptions));
  }

  function bindFilters() {
    if (searchBtn) {
      searchBtn.addEventListener("click", async function () {
        await rerender();
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", async function () {
        await rerender();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener("change", async function () {
        await rerender();
      });
    }

    if (dateFromInput) {
      dateFromInput.addEventListener("change", async function () {
        await rerender();
      });
    }

    if (dateToInput) {
      dateToInput.addEventListener("change", async function () {
        await rerender();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", async function () {
        if (statusSelect) statusSelect.value = "";
        if (dateFromInput) dateFromInput.value = "";
        if (dateToInput) dateToInput.value = "";
        if (searchInput) searchInput.value = "";
        await rerender();
      });
    }
  }

  function bindModal() {
    if (modalClose) {
      modalClose.addEventListener("click", closeModal);
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", function (event) {
        if (event.target === modalBackdrop) closeModal();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });
  }

  function bindTableActions() {
    document.addEventListener("click", async function (event) {
      const shareBtn = event.target.closest("button[data-share]");
      if (shareBtn) {
        event.preventDefault();
        event.stopPropagation();
        const id = shareBtn.getAttribute("data-share");
        if (id) await handleShare(id);
        return;
      }

      const openBtn = event.target.closest(".rx-open-details");
      if (openBtn) {
        event.preventDefault();
        event.stopPropagation();
        const id = openBtn.getAttribute("data-rxid");
        if (id) await openPrescriptionDetails(id);
        return;
      }

      const row = event.target.closest("tr[data-rxid]");
      if (row && !event.target.closest("button")) {
        const id = row.getAttribute("data-rxid");
        if (id) await openPrescriptionDetails(id);
      }
    });
  }

  async function openPrescriptionFromQueryIfNeeded() {
    const params = new URLSearchParams(window.location.search);
    const openId = params.get("open");
    if (!openId) return;

    const found = allPrescriptions.find(function (rx) {
      return String(rx.prescription_id) === String(openId);
    });

    if (!found) return;

    await openPrescriptionDetails(openId);
  }

  bindFilters();
  bindModal();
  bindTableActions();

  await load();
  await openPrescriptionFromQueryIfNeeded();
});
