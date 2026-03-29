
// scripts/dr-form.js
document.addEventListener("DOMContentLoaded", async function () {
  // const user = RX.requireAuth(["clinician"]);
  // if (!user) return;

  const user =
    (window.RX && typeof RX.getUser === "function" && RX.getUser()) || {};
  const isClinician =
    String(user?.login_type || "").toLowerCase() === "clinician";

  const patientSearchInput = document.querySelector(
    ".cnp-card-patient .cnp-input-icon input",
  );
  const patientSummary = document.querySelector(".cnp-patient-summary");
  const addPatientLink = document.querySelector(".js-add-patient-link");

  const modal = document.getElementById("cnp-add-patient-modal");
  const modalClose = document.getElementById("cnp-add-patient-close");
  const modalSubmit = document.querySelector(".cnp-ap-submit");

  const notesEl = document.getElementById("prescription-notes");
  const issueBtn = document.querySelector(
    ".cnp-card-actions .cnp-actions-right .cnp-btn-primary",
  );
  const dropBtn = document.querySelector(
    ".cnp-card-actions .cnp-actions-right .cnp-btn-dropdown",
  );

  const historyPatientNameEl = document.getElementById("historyPatientName");
  const historyPatientMrnEl = document.getElementById("historyPatientMrn");
  const historyPatientDobEl = document.getElementById("historyPatientDob");
  const historyPatientAvatarEl = document.getElementById("historyPatientAvatar");
  const historyPatientExtraEl = document.getElementById("historyPatientExtra");

  const fromDateEl = document.getElementById("fromDate");
  const toDateEl = document.getElementById("toDate");
  const statusFilterEl = document.getElementById("statusFilter");
  const filtersForm = document.getElementById("filtersForm");
  const resetFiltersBtn = document.getElementById("resetFilters");

  const historyStateEl = document.getElementById("historyState");
  const historyTableBody = document.querySelector("#rxTable tbody");
  const rxModalBackdrop = document.getElementById("rxModalBackdrop");
  const rxModalClose = document.getElementById("rxModalClose");

  const m_rxId = document.getElementById("m_rxId");
  const m_date = document.getElementById("m_date");
  const m_status = document.getElementById("m_status");
  const m_diagnosis = document.getElementById("m_diagnosis");
  const m_code = document.getElementById("m_code");
  const m_unique = document.getElementById("m_unique");
  const m_notes = document.getElementById("m_notes");
  const m_itemsBody = document.querySelector("#m_items tbody");

  let savedPatients = [];
  let allPatients = [];
  let savedPatientIds = new Set();
  let selectedPatient = null;

  let medIndexLoaded = false;
  const medNameToId = new Map();

  let historyPrescriptions = [];
  let historyChart = null;
  let activeHistoryPatientId = null;
  let historyLoadSeq = 0;

  injectUiEnhancements();

  (function () {
  const stack = document.createElement("div");
  stack.className = "rx-toast-stack";
  document.body.appendChild(stack);

  const icons  = { success: "✓", error: "✕", warn: "!", info: "i" };
  const labels = { success: "Success", error: "Error", warn: "Warning", info: "Info" };

  function showToast(type, title, msg) {
    const t = document.createElement("div");
    t.className = `rx-toast rx-toast--${type}`;
    t.innerHTML = `
      <div class="rx-toast-icon">${icons[type]}</div>
      <div class="rx-toast-body">
        <p class="rx-toast-title">${title || labels[type]}</p>
        ${msg ? `<p class="rx-toast-msg">${msg}</p>` : ""}
      </div>
      <button class="rx-toast-close" aria-label="Dismiss">×</button>
      <div class="rx-toast-bar"></div>
    `;
    stack.appendChild(t);
    requestAnimationFrame(() => { t.offsetHeight; t.classList.add("rx-toast--in"); });
    function dismiss() {
      t.classList.add("rx-toast--out");
      setTimeout(() => t.remove(), 340);
    }
    t.querySelector(".rx-toast-close").addEventListener("click", dismiss);
    setTimeout(dismiss, 4200);
  }

  window.RxToast = {
    success: (title, msg) => showToast("success", title, msg),
    error:   (title, msg) => showToast("error",   title, msg),
    warn:    (title, msg) => showToast("warn",     title, msg),
    info:    (title, msg) => showToast("info",     title, msg),
  };
})();

  function injectUiEnhancements() {
    if (!document.getElementById("rxDrFormEnhancements")) {
      const style = document.createElement("style");
      style.id = "rxDrFormEnhancements";
      style.textContent = `
        .rx-patient-dd-item {
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f2f4f7;
        }
        .rx-patient-dd-item:last-child {
          border-bottom: 0;
        }
        .rx-patient-dd-item:hover {
          background: #f8fbff;
        }
        .rx-patient-dd-item .rx-patient-dd-name {
          font-weight: 700;
          color: #1f2937;
        }
        .rx-patient-dd-item .rx-patient-dd-meta {
          color: #6b7280;
          font-size: 12px;
          margin-top: 2px;
        }
        .rx-patient-state {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rx-mini-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid #d8efff;
          background: #eef7ff;
          color: #0b5cab;
        }
        .rx-mini-chip.unsaved {
          border-color: #ffd591;
          background: #fff7e6;
          color: #ad6800;
          cursor: pointer;
        }
        .rx-patient-hint {
          margin-top: 10px;
          color: #667085;
          font-size: 13px;
        }
      `;
      document.head.appendChild(style);
    }

    if (patientSummary && !document.getElementById("rxPatientStateWrap")) {
      const stateWrap = document.createElement("div");
      stateWrap.id = "rxPatientStateWrap";
      stateWrap.className = "rx-patient-state";
      patientSummary.insertAdjacentElement("afterend", stateWrap);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getSelectedPatientIdFromContext() {
    const qs = new URLSearchParams(window.location.search);
    const fromQuery =
      qs.get("patient_id") || qs.get("patientId") || qs.get("id");
    const fromSession = sessionStorage.getItem("rx_selected_patient_id");
    const raw = fromQuery || fromSession;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  function calcAge(dobStr) {
    try {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) return "";
      const diff = Date.now() - d.getTime();
      return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    } catch {
      return "";
    }
  }

  function patientAddress(patient) {
    return String(patient?.notes || "").replace(/^Address:\s*/i, "");
  }

  function fmtDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString();
  }

  function fmtDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function initials(first, last) {
    const a = (first || "").trim().charAt(0);
    const b = (last || "").trim().charAt(0);
    return (a + b || "--").toUpperCase();
  }

  function badgeClass(status) {
    const s = String(status || "").toLowerCase();
    if (["fully_dispensed", "dispensed"].includes(s)) return "status-dispensed";
    if (["expired", "cancelled"].includes(s)) return "status-expired";
    return "status-issued";
  }

  function getHistoryPointColor(status) {
    const s = String(status || "").toLowerCase();
    if (["fully_dispensed", "dispensed"].includes(s)) return "#3d9d6c";
    if (["expired", "cancelled"].includes(s)) return "#b13f3f";
    return "#b0732b";
  }

  function normalizeFilterStatus(value) {
    const v = String(value || "")
      .toLowerCase()
      .trim();
    if (!v) return null;
    if (v === "dispensed") return ["dispensed", "fully_dispensed"];
    if (v === "issued") return ["issued", "active", "partially_dispensed"];
    return [v];
  }

  function getReferenceDate(rx) {
    return rx.issue_date || rx.created_at || rx.last_dispensed_at || null;
  }

  function setHistoryState(type, text) {
    if (!historyStateEl) return;
    historyStateEl.innerHTML = `<div class="cnp-history-${type}">${escapeHtml(text)}</div>`;
  }

  function clearHistoryState() {
    if (!historyStateEl) return;
    historyStateEl.innerHTML = "";
  }

  function resetHistoryTable(message) {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="cnp-history-table-empty">${escapeHtml(message)}</td>
      </tr>
    `;
  }

  function destroyHistoryChart() {
    if (historyChart) {
      historyChart.destroy();
      historyChart = null;
    }
  }

  function renderHistoryChart(list) {
    const canvas = document.getElementById("timelineChart");
    if (!canvas) return;

    destroyHistoryChart();

    if (!window.Chart) {
      return;
    }

    const sorted = [...list].sort(function (a, b) {
      const da = new Date(getReferenceDate(a) || 0).getTime();
      const db = new Date(getReferenceDate(b) || 0).getTime();
      return da - db;
    });

    historyChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: sorted.map(function (rx) {
          return fmtDate(getReferenceDate(rx));
        }),
        datasets: [
          {
            label: "Prescriptions",
            data: sorted.map(function (_, index) {
              return index + 1;
            }),
            borderColor: "#b0732b",
            backgroundColor: "rgba(176, 115, 43, 0.12)",
            pointBackgroundColor: sorted.map(function (rx) {
              return getHistoryPointColor(rx.status);
            }),
            pointBorderColor: sorted.map(function (rx) {
              return getHistoryPointColor(rx.status);
            }),
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: async function (_, elements) {
          if (!elements.length) return;
          const index = elements[0].index;
          const rx = sorted[index];
          if (rx) await openHistoryPrescriptionModal(rx.prescription_id);
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            ticks: {
              precision: 0,
              stepSize: 1,
            },
          },
        },
      },
    });
  }

  function renderHistoryPatientCard(patient) {
    if (historyPatientNameEl) {
      historyPatientNameEl.textContent = patient
        ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
          "Unknown Patient"
        : "No patient selected";
    }

    if (historyPatientMrnEl) {
      historyPatientMrnEl.textContent = patient?.patient_id || "--";
    }

    if (historyPatientDobEl) {
      historyPatientDobEl.textContent = patient?.date_of_birth || "--";
    }

    if (historyPatientAvatarEl) {
      historyPatientAvatarEl.textContent = patient
        ? initials(patient.first_name, patient.last_name)
        : "--";
    }

    if (historyPatientExtraEl) {
      historyPatientExtraEl.innerHTML = patient
        ? `
            Email: ${escapeHtml(patient.email || "-")} •
            Phone: ${escapeHtml(patient.phone || "-")} •
            Gender: ${escapeHtml(patient.gender || "-")} •
            NHS/National ID: ${escapeHtml(patient.national_id || "-")}
          `
        : `
            Select a patient above to load previous prescriptions, filters, and prescription details.
          `;
    }
  }

  function applyHistoryFilters(list) {
    const from = fromDateEl?.value || "";
    const to = toDateEl?.value || "";
    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;
    const allowedStatuses = normalizeFilterStatus(statusFilterEl?.value);

    return list.filter(function (rx) {
      const status = String(rx.status || "").toLowerCase();

      let statusOk = true;
      if (allowedStatuses) {
        statusOk = allowedStatuses.includes(status);
      }

      let dateOk = true;
      const ref = getReferenceDate(rx);
      if (ref && (fromD || toD)) {
        const d = new Date(ref);
        if (!Number.isNaN(d.getTime())) {
          if (fromD && d < fromD) dateOk = false;
          if (toD && d > toD) dateOk = false;
        }
      }

      return statusOk && dateOk;
    });
  }

  function renderHistoryTable(list) {
    if (!historyTableBody) return;

    if (!list.length) {
      resetHistoryTable("No prescriptions found for this patient.");
      return;
    }

    historyTableBody.innerHTML = "";

    list.forEach(function (rx) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(rx.prescription_number || rx.code || rx.prescription_id || "-")}</td>
        <td>${escapeHtml(fmtDate(rx.issue_date || rx.created_at))}</td>
        <td>
          <span class="cnp-history-status-badge ${badgeClass(rx.status)}">
            ${escapeHtml(rx.status || "-")}
          </span>
        </td>
        <td>${escapeHtml(rx.diagnosis || "-")}</td>
        <td>${escapeHtml(fmtDateTime(rx.last_dispensed_at))}</td>
        <td>${escapeHtml(rx.pharmacy_name || "-")}</td>
      `;
      tr.addEventListener("click", async function () {
        await openHistoryPrescriptionModal(rx.prescription_id);
      });
      historyTableBody.appendChild(tr);
    });
  }
  function rerenderHistory() {
    const filtered = applyHistoryFilters(historyPrescriptions);
    renderHistoryTable(filtered);
    renderHistoryChart(filtered);

    clearHistoryState();

    if (!activeHistoryPatientId) {
      setHistoryState("empty", "Select a patient to load history on this page.");
      return;
    }

    if (!historyPrescriptions.length) {
      setHistoryState(
        "empty",
        "This patient has no prescriptions yet for this prescriber.",
      );
      return;
    }

    if (!filtered.length) {
      setHistoryState("empty", "No prescriptions match the selected filters.");
    }
  }

  function resetHistoryUi(message) {
    activeHistoryPatientId = null;
    historyPrescriptions = [];
    renderHistoryPatientCard(null);
    destroyHistoryChart();
    resetHistoryTable(message || "Select a patient to load history on this page.");
    setHistoryState("empty", message || "Select a patient to load history on this page.");
  }

  async function openHistoryPrescriptionModal(prescriptionId) {
    try {
      const resp = await RX.api.get(`/prescriptions/${prescriptionId}`);
      const rx = resp.prescription || {};
      const items = Array.isArray(resp.items) ? resp.items : [];

      if (m_rxId) m_rxId.textContent = rx.prescription_id || "-";
      if (m_date) m_date.textContent = fmtDateTime(rx.issue_date || rx.created_at);
      if (m_status) {
        m_status.innerHTML = `
          <span class="cnp-history-status-badge ${badgeClass(rx.status)}">
            ${escapeHtml(rx.status || "-")}
          </span>
        `;
      }
      if (m_diagnosis) m_diagnosis.textContent = rx.diagnosis || "-";
      if (m_code) m_code.textContent = rx.prescription_number || "-";
      if (m_unique) m_unique.textContent = rx.prescriber_unique_string || "-";
      if (m_notes) m_notes.textContent = rx.notes || "";

      if (m_itemsBody) {
        m_itemsBody.innerHTML = "";
        if (!items.length) {
          m_itemsBody.innerHTML = `
            <tr>
              <td colspan="7" class="cnp-history-table-empty">No prescription items found.</td>
            </tr>
          `;
        } else {
          items.forEach(function (item) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${escapeHtml(item.medication_name || `Medication #${item.medication_id || "-"}`)}</td>
              <td>${escapeHtml(item.strength || "-")}</td>
              <td>${escapeHtml(item.dosage_form || "-")}</td>
              <td>${escapeHtml(item.dosage_instructions || "-")}</td>
              <td>${escapeHtml(item.quantity_prescribed ?? "-")}</td>
              <td>${escapeHtml(item.quantity_dispensed_total ?? "-")}</td>
              <td>${escapeHtml(item.item_status || "-")}</td>
            `;
            m_itemsBody.appendChild(tr);
          });
        }
      }

      if (rxModalBackdrop) {
        rxModalBackdrop.classList.add("open");
        rxModalBackdrop.setAttribute("aria-hidden", "false");
      }
    } catch (error) {
      RxToast.error("Failed", error.message || "Failed to load prescription.");
    }
  }

  function closeHistoryPrescriptionModal() {
    if (!rxModalBackdrop) return;
    rxModalBackdrop.classList.remove("open");
    rxModalBackdrop.setAttribute("aria-hidden", "true");
  }

  async function loadSelectedPatientHistory(patientId) {
    const id = Number(patientId);
    if (!Number.isFinite(id) || id <= 0) {
      resetHistoryUi();
      return;
    }

    activeHistoryPatientId = id;
    const requestId = ++historyLoadSeq;

    clearHistoryState();
    renderHistoryPatientCard(selectedPatient);
    setHistoryState("loading", "Loading patient history...");
    resetHistoryTable("Loading prescription history...");

    try {
      let resp = { prescriptions: [] };

      if (isClinician) {
        resp = await RX.api.get(`/clinicians/me/patients/${id}/prescriptions`);
      }

      if (requestId !== historyLoadSeq) return;

      historyPrescriptions = Array.isArray(resp.prescriptions)
        ? resp.prescriptions
        : [];

      renderHistoryPatientCard(selectedPatient);
      rerenderHistory();
    } catch (error) {
      if (requestId !== historyLoadSeq) return;
      historyPrescriptions = [];
      destroyHistoryChart();
      resetHistoryTable("Failed to load patient history.");
      setHistoryState("error", error.message || "Failed to load patient history.");
    }
  }

  function renderPatientSummary(patient) {
    if (!patientSummary) return;

    if (!patient) {
      patientSummary.innerHTML = `
        <p class="cnp-patient-name">No patient selected</p>
        <p class="rx-muted">Search, save, or create a patient before issuing a prescription.</p>
      `;
      renderHistoryPatientCard(null);
      syncPatientStateUi();
      return;
    }

    const name =
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
    const age = calcAge(patient.date_of_birth);
    const addr = patientAddress(patient);

    patientSummary.innerHTML = `
      <p class="cnp-patient-name">${escapeHtml(name)}</p>
      <p>${escapeHtml(age ? `${age} years – ` : "")}${escapeHtml(patient.date_of_birth || "")}</p>
      <p>Gender: ${escapeHtml(patient.gender || "-")}</p>
      <p><strong>Address:</strong> ${escapeHtml(addr || "-")}</p>
      <p><strong>Contact:</strong> ${escapeHtml(patient.phone || "-")}</p>
      <p><strong>Email:</strong> ${escapeHtml(patient.email || "-")}</p>
    `;
    renderHistoryPatientCard(patient);
    syncPatientStateUi();
  }

  function syncPatientStateUi() {
    const wrap = document.getElementById("rxPatientStateWrap");
    if (!wrap) return;

    if (!selectedPatient) {
      wrap.innerHTML = `
        <div class="rx-patient-hint">
          Tip: clinicians should save patients to their own login so private notes, PMR entries, and prescriptions stay scoped to that clinician.
        </div>
      `;
      return;
    }

    const isSaved = savedPatientIds.has(Number(selectedPatient.patient_id));
    wrap.innerHTML = `
      <span class="rx-mini-chip ${isSaved ? "" : "unsaved"}" id="rxSavePatientBtn">
        ${isSaved ? "Saved to my patient list" : "Save patient to my list"}
      </span>
      <span class="rx-mini-chip">Prescriptions save to the current prescriber login</span>
    `;

    const saveBtn = document.getElementById("rxSavePatientBtn");
    if (saveBtn && !isSaved) {
      saveBtn.addEventListener("click", async function () {
        try {
          await savePatientForCurrentClinician(selectedPatient.patient_id);
          RxToast.success("Patient saved to your clinician list.");
        } catch (error) {
          RxToast.error("Failed to save patient.", error.message || "Failed to save patient.");
        }
      });
    }
  }

  async function loadSavedPatients() {
    const resp = await RX.api.get("/clinicians/me/saved-patients");
    savedPatients = Array.isArray(resp.patients) ? resp.patients : [];
    savedPatientIds = new Set(
      savedPatients.map((patient) => Number(patient.patient_id)),
    );
  }

  async function loadAllPatients(searchTerm = "") {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (searchTerm) params.set("search", searchTerm);
    const resp = await RX.api.get(`/patients?${params.toString()}`);
    allPatients = Array.isArray(resp.patients) ? resp.patients : [];
  }

  function uniquePatients(list) {
    const byId = new Map();
    list.forEach(function (patient) {
      if (!patient || !patient.patient_id) return;
      byId.set(Number(patient.patient_id), patient);
    });
    return Array.from(byId.values());
  }

  async function reloadPatientSources() {
    await loadSavedPatients();
    await loadAllPatients();
  }

  async function findPatientById(patientId) {
    const wanted = String(patientId);
    const combined = uniquePatients([].concat(savedPatients, allPatients));
    let found =
      combined.find((patient) => String(patient.patient_id) === wanted) || null;

    if (!found) {
      const resp = await RX.api.get(`/patients/${wanted}`);
      found = resp.patient || resp || null;
      if (found?.patient_id) {
        allPatients = uniquePatients(allPatients.concat(found));
      }
    }

    return found;
  }

  function ensureDropdown() {
    if (!patientSearchInput) return null;

    let dropdown =
      patientSearchInput.parentElement.querySelector(".rx-patient-dd");
    if (dropdown) return dropdown;

    dropdown = document.createElement("div");
    dropdown.className = "rx-patient-dd";
    dropdown.style.position = "absolute";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.top = "44px";
    dropdown.style.background = "#fff";
    dropdown.style.border = "1px solid #e5e7eb";
    dropdown.style.borderRadius = "8px";
    dropdown.style.boxShadow = "0 10px 20px rgba(0,0,0,.08)";
    dropdown.style.zIndex = "9999";
    dropdown.style.maxHeight = "280px";
    dropdown.style.overflow = "auto";
    dropdown.style.display = "none";

    patientSearchInput.parentElement.style.position = "relative";
    patientSearchInput.parentElement.appendChild(dropdown);
    return dropdown;
  }

  function hideDropdown() {
    const dropdown =
      patientSearchInput?.parentElement?.querySelector(".rx-patient-dd");
    if (dropdown) dropdown.style.display = "none";
  }

  function selectPatient(patient) {
    selectedPatient = patient;
    sessionStorage.setItem(
      "rx_selected_patient_id",
      String(patient.patient_id),
    );

    if (patientSearchInput) {
      patientSearchInput.value =
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
    }

    renderPatientSummary(patient);
    rememberPatientForHistory();
    hideDropdown();

    loadSelectedPatientHistory(patient.patient_id).catch(function (error) {
      console.error(error);
      setHistoryState("error", error.message || "Failed to load patient history.");
    });
  }

  function buildPatientMeta(patient) {
    const saved = savedPatientIds.has(Number(patient.patient_id));
    const bits = [
      patient.date_of_birth || "",
      patient.email || patient.phone || "",
      saved ? "Saved to my list" : "Not saved yet",
    ].filter(Boolean);
    return bits.join(" • ");
  }

  function showDropdown(list) {
    const dropdown = ensureDropdown();
    if (!dropdown) return;

    dropdown.innerHTML = "";

    if (!list.length) {
      dropdown.innerHTML = `
        <div class="rx-patient-dd-item">
          <div class="rx-patient-dd-name">No matches</div>
          <div class="rx-patient-dd-meta">Try another search or add a new patient.</div>
        </div>
      `;
      dropdown.style.display = "block";
      return;
    }

    list.forEach(function (patient) {
      const name =
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
      const item = document.createElement("div");
      item.className = "rx-patient-dd-item";
      item.innerHTML = `
        <div class="rx-patient-dd-name">${escapeHtml(name)}</div>
        <div class="rx-patient-dd-meta">${escapeHtml(buildPatientMeta(patient))}</div>
      `;
      item.addEventListener("click", function () {
        selectPatient(patient);
      });
      dropdown.appendChild(item);
    });

    dropdown.style.display = "block";
  }

  function filterPatients(query) {
    const q = String(query || "")
      .trim()
      .toLowerCase();
    const combined = uniquePatients([].concat(savedPatients, allPatients));

    if (!q) {
      return savedPatients.slice(0, 12);
    }

    return combined
      .filter(function (patient) {
        const name =
          `${patient.first_name || ""} ${patient.last_name || ""}`.toLowerCase();
        return (
          name.includes(q) ||
          (patient.email || "").toLowerCase().includes(q) ||
          (patient.phone || "").toLowerCase().includes(q) ||
          (patient.national_id || "").toLowerCase().includes(q) ||
          String(patient.patient_id || "").includes(q)
        );
      })
      .sort(function (a, b) {
        const aSaved = savedPatientIds.has(Number(a.patient_id)) ? 1 : 0;
        const bSaved = savedPatientIds.has(Number(b.patient_id)) ? 1 : 0;
        return bSaved - aSaved;
      })
      .slice(0, 12);
  }

  async function savePatientForCurrentClinician(patientId) {
    await RX.api.post("/clinicians/me/saved-patients", {
      patient_id: patientId,
    });
    await loadSavedPatients();

    if (
      selectedPatient &&
      Number(selectedPatient.patient_id) === Number(patientId)
    ) {
      syncPatientStateUi();
    }
  }
function openModal() {
  if (!modal) return;
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  if (!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

  function modalInputs() {
    const grid = modal?.querySelector(".cnp-ap-grid");
    if (!grid) return { inputs: [], selects: [] };
    return {
      inputs: Array.from(grid.querySelectorAll("input")),
      selects: Array.from(grid.querySelectorAll("select")),
    };
  }

  function buildDob(dd, mm, yy) {
    if (!dd || !mm || !yy) return "";
    const d = String(dd).padStart(2, "0");
    const m = String(mm).padStart(2, "0");
    return `${yy}-${m}-${d}`;
  }

  async function loadMedicationIndexOnce(forceReload = false) {
    if (medIndexLoaded && !forceReload) return;

    const resp = await RX.api.get("/medications");
    const list = resp.medications || resp.meds || [];
    medNameToId.clear();

    list.forEach(function (medication) {
      const name = String(medication.medication_name || "")
        .trim()
        .toLowerCase();
      if (name && medication.medication_id && !medNameToId.has(name)) {
        medNameToId.set(name, Number(medication.medication_id));
      }
    });

    medIndexLoaded = true;
  }

  async function resolveMedicationIdByName(name) {
    const cleanName = String(name || "").trim();
    const key = cleanName.toLowerCase();
    if (!key) return null;

    await loadMedicationIndexOnce();
    if (medNameToId.has(key)) return medNameToId.get(key);

    const created = await RX.api.post(
      "/medications/create",
      { medication_name: cleanName },
      { auth: false },
    );

    const createdId = Number(created.medication_id || 0) || null;
    if (!createdId) {
      throw new Error(`Could not create medication for: ${cleanName}`);
    }

    medNameToId.set(key, createdId);
    return createdId;
  }

  function collectItemsFromTable() {
    const tbody = document.getElementById("meds-body");
    if (!tbody) return [];

    const rows = Array.from(tbody.querySelectorAll("tr"));
    const items = [];

    for (const tr of rows) {
      const inputs = Array.from(tr.querySelectorAll("input"));
      if (!inputs.length) continue;

      const nameInput =
        tr.querySelector("input.med-input-medicine-search") ||
        inputs.find(function (el) {
          const ph = String(el.getAttribute("placeholder") || "").toLowerCase();
          return ph.includes("item name") || ph.includes("search or select");
        });

      const qtyInput =
        tr.querySelector("input.med-input-qty") ||
        inputs.find(function (el) {
          const ph = String(el.getAttribute("placeholder") || "").toLowerCase();
          return ph === "qty" || ph.includes("qty") || ph.includes("quantity");
        });

      const dosageInput =
        tr.querySelector("input.med-input-dosage") ||
        tr.querySelector("select.med-input-dosage-select") ||
        inputs.find(function (el) {
          if (el === nameInput || el === qtyInput) return false;
          const ph = String(el.getAttribute("placeholder") || "").toLowerCase();
          return ph.includes("dosage");
        });

      const name = (nameInput?.value || "").trim();
      const qty = Number((qtyInput?.value || "").trim() || 0);
      const dosage = (dosageInput?.value || "").trim();

      if (!name || !qty || qty <= 0) continue;

      items.push({
        medication_name: name,
        dosage_instructions: dosage || null,
        quantity_prescribed: qty,
        unit: "unit",
        duration_days: null,
        refills_allowed: 0,
        notes: null,
      });
    }

    return items;
  }

  async function sendMail({
    toEmail,
    content,
    sender = "RxConnect",
    number = "",
  }) {
    const fd = new FormData();
    fd.append("email", toEmail);
    fd.append("content", content);
    fd.append("sender", sender);
    fd.append("number", number);

    const res = await fetch(`${RX.API_BASE}/send-mail`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to send email");
    }

    return true;
  }

  function buildPatientMessage(code) {
    const publicUrl = window.RXCONNECT_PUBLIC_URL || "https://RxConnect.co.uk";
    const first = selectedPatient?.first_name || "";
    return (
      `Dear ${first}, here is your unique prescription Code: ${code}. ` +
      `You can have it delivered fast and discreet: ${publicUrl}/chobham (enter code + DOB). ` +
      `Or you can collect: show the code to any pharmacy. They will go to RxConnect.co.uk and enter the code + your DOB.`
    );
  }

  async function savePrescriptionToPrivatePmr(createdPrescription, items) {
    const noteText = (notesEl?.value || "").trim();
    if (!noteText || !selectedPatient?.patient_id) return;

    await RX.api.post(
      `/clinicians/me/patients/${selectedPatient.patient_id}/pmr`,
      {
        title: `Prescription ${createdPrescription.prescription_number || createdPrescription.code || createdPrescription.prescription_id}`,
        record_type: "consultation_prescription",
        notes: noteText,
        record_data: {
          prescription_id: createdPrescription.prescription_id,
          prescription_number:
            createdPrescription.prescription_number ||
            createdPrescription.code ||
            null,
          items: items.map(function (item) {
            return {
              medication_name: item.medication_name,
              dosage_instructions: item.dosage_instructions,
              quantity_prescribed: item.quantity_prescribed,
            };
          }),
        },
      },
    );
  }

  async function createPrescriptionAndMaybeSend(sendMode) {
    if (!selectedPatient) {
      RxToast.info("Select a patient first.");
      return;
    }

    await savePatientForCurrentClinician(selectedPatient.patient_id);

    const rawItems = collectItemsFromTable();
    if (!rawItems.length) {
      RxToast.info("Add at least one medicine row (name + quantity).");
      return;
    }

    const items = [];
    for (const item of rawItems) {
      const medicationId = await resolveMedicationIdByName(
        item.medication_name,
      );
      if (!medicationId) {
        RxToast.error(`Could not resolve medication id for: ${item.medication_name}`);
        return;
      }

      items.push({
        medication_id: medicationId,
        medication_name: item.medication_name,
        dosage_instructions: item.dosage_instructions,
        quantity_prescribed: item.quantity_prescribed,
        unit: item.unit,
        duration_days: item.duration_days,
        refills_allowed: item.refills_allowed,
        notes: item.notes,
      });
    }

    const payload = {
      patient_id: selectedPatient.patient_id,
      diagnosis: null,
      notes: (notesEl?.value || "").trim() || null,
      items: items,
    };

    let created = null;
    let pmrSaved = true;

    try {
      created = await RX.api.post("/prescriptions/create", payload);

      try {
        await savePrescriptionToPrivatePmr(created, items);
      } catch (pmrError) {
        pmrSaved = false;
        console.error("Failed to save prescription note to PMR:", pmrError);
      }

      const code =
        created.code || created.prescription_number || "(code not returned)";
      const msg = buildPatientMessage(code);

      RxToast.info(
        pmrSaved
          ? `Prescription saved.\n\nCode: ${code}`
          : `Prescription saved.\n\nCode: ${code}\n\nWarning: the prescription note was not copied into the private PMR.`,
      );

      if (sendMode === "patient") {
        if (!selectedPatient.email) {
          RxToast.warn("Patient has no email. Copy this message manually:", msg);
        } else {
          await sendMail({
            toEmail: selectedPatient.email,
            content: msg,
            sender: "RxConnect",
            number: selectedPatient.phone || "",
          });
          RxToast.info("Email sent to patient.", msg);
        }
      }

      if (sendMode === "chobham") {
        let chobhamEmail = localStorage.getItem("RX_CHOBHAM_EMAIL") || "";
        if (!chobhamEmail) {
          chobhamEmail =
            prompt("Enter Chobham Pharmacy email (saved for next time):") || "";
          if (chobhamEmail) {
            localStorage.setItem("RX_CHOBHAM_EMAIL", chobhamEmail);
          }
        }

        if (!chobhamEmail) {
          RxToast.info("No Chobham email provided. Code is:", code);
        } else {
          await sendMail({
            toEmail: chobhamEmail,
            content: `New prescription issued.\nCode: ${code}\nPatient DOB: ${selectedPatient.date_of_birth || ""}`,
            sender: "RxConnect",
            number: selectedPatient.phone || "",
          });
          RxToast.info("Sent to Chobham Pharmacy.", `Code: ${code}`);
        }
      }

      rememberPatientForHistory();
      window.location.href = `./prescriptions.html`;
    } catch (error) {
      console.error(error);
      RxToast.error("Failed to create prescription.", error.message || "Failed to create prescription");
    }
  }

  function rememberPatientForHistory() {
    if (!selectedPatient?.patient_id) return;
    sessionStorage.setItem(
      "rx_selected_patient_id",
      String(selectedPatient.patient_id),
    );
    sessionStorage.setItem(
      "patient_history_patient_id",
      String(selectedPatient.patient_id),
    );
  }

  function ensureIssueMenu() {
    if (!dropBtn) return null;

    let menu = document.getElementById("rxIssueMenu");
    if (menu) return menu;

    menu = document.createElement("div");
    menu.id = "rxIssueMenu";
    menu.style.position = "absolute";
    menu.style.right = "0";
    menu.style.top = "42px";
    menu.style.background = "#fff";
    menu.style.border = "1px solid #e5e7eb";
    menu.style.borderRadius = "8px";
    menu.style.boxShadow = "0 10px 20px rgba(0,0,0,.08)";
    menu.style.padding = "6px";
    menu.style.display = "none";
    menu.style.zIndex = "9999";

    menu.innerHTML = `
      <button type="button" data-mode="patient" style="display:block;width:100%;text-align:left;padding:10px;border:0;background:transparent;cursor:pointer;">
        Save + Email patient
      </button>
      <button type="button" data-mode="chobham" style="display:block;width:100%;text-align:left;padding:10px;border:0;background:transparent;cursor:pointer;">
        Save + Send to Chobham
      </button>
      <button type="button" data-mode="none" style="display:block;width:100%;text-align:left;padding:10px;border:0;background:transparent;cursor:pointer;">
        Save only
      </button>
    `;

    const holder = dropBtn.parentElement;
    holder.style.position = "relative";
    holder.appendChild(menu);

    menu.addEventListener("click", async function (event) {
      const button = event.target.closest("button[data-mode]");
      if (!button) return;
      menu.style.display = "none";
      await createPrescriptionAndMaybeSend(button.dataset.mode);
    });

    document.addEventListener("click", function (event) {
      if (
        !event.target.closest("#rxIssueMenu") &&
        !event.target.closest(".cnp-btn-dropdown")
      ) {
        menu.style.display = "none";
      }
    });

    return menu;
  }

  resetHistoryUi("Select a patient to load history on this page.");

  if (filtersForm) {
    filtersForm.addEventListener("submit", function (event) {
      event.preventDefault();
      rerenderHistory();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", function () {
      if (fromDateEl) fromDateEl.value = "";
      if (toDateEl) toDateEl.value = "";
      if (statusFilterEl) statusFilterEl.value = "";
      rerenderHistory();
    });
  }

  if (rxModalClose) {
    rxModalClose.addEventListener("click", closeHistoryPrescriptionModal);
  }

  if (rxModalBackdrop) {
    rxModalBackdrop.addEventListener("click", function (event) {
      if (event.target === rxModalBackdrop) {
        closeHistoryPrescriptionModal();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeHistoryPrescriptionModal();
    }
  });

  if (patientSearchInput) {
    patientSearchInput.addEventListener("input", function () {
      showDropdown(filterPatients(patientSearchInput.value));
    });

    patientSearchInput.addEventListener("focus", function () {
      showDropdown(filterPatients(patientSearchInput.value));
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".cnp-card-patient")) hideDropdown();
    });
  }

  if (addPatientLink) {
    addPatientLink.addEventListener("click", function (event) {
      event.preventDefault();
      openModal();
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);

  if (modalSubmit) {
    modalSubmit.addEventListener("click", async function () {
      const { inputs, selects } = modalInputs();

      const first_name = (inputs[0]?.value || "").trim();
      const last_name = (inputs[1]?.value || "").trim();
      const gender = selects[0]?.value || null;
      const phone = (inputs[2]?.value || "").trim();
      //const national_id = (inputs[4]?.value || "").trim();
      
      const dd = (inputs[3]?.value || "").trim();
      const mm = (inputs[4]?.value || "").trim();
      const yy = (inputs[5]?.value || "").trim();
      const date_of_birth = buildDob(dd, mm, yy);
      const email = (inputs[6]?.value || "").trim();

      const addr1 = (inputs[7]?.value || "").trim();
      //const city = (inputs[10]?.value || "").trim();
      // const country = selects[1]?.value || "";

      if (!first_name || !last_name || !date_of_birth) {
        RxToast.error("First name, last name, and date of birth are required.");
        return;
      }

      const notesParts = [];
      if (addr1) notesParts.push(addr1);
      // if (addr2) notesParts.push(addr2);
      // if (city) notesParts.push(city);
      // if (country) notesParts.push(country);
      const notes = notesParts.length
        ? `Address: ${notesParts.join(", ")}`
        : null;
      try {
        const resp = await RX.api.post("/patients/create", {
          first_name,
          last_name,
          date_of_birth,
          gender: gender ? gender.toLowerCase() : null,
          phone,
          email,
          notes,
        });

        const patientId = Number(resp.patient_id);
        if (!patientId)
          throw new Error("Patient created but no patient_id returned.");

        await savePatientForCurrentClinician(patientId);
        await loadAllPatients();

        const fresh = await findPatientById(patientId);
        if (fresh) {
          selectPatient(fresh);
        }

        closeModal();
        RxToast.success("Patient created and saved to your clinician list.");
      } catch (error) {
        RxToast.error("Failed to create patient.", error.message || "Failed to create patient");
      }
    });
  }

  try {
    await reloadPatientSources();

    const preselectedPatientId = getSelectedPatientIdFromContext();
    if (preselectedPatientId) {
      const preselectedPatient = await findPatientById(preselectedPatientId);
      if (preselectedPatient) {
        selectPatient(preselectedPatient);
      }
    }

    if (!selectedPatient) {
      renderPatientSummary(null);
    }
  } catch (error) {
    console.error(error);
    renderPatientSummary(null);
  }

  if (issueBtn) {
    issueBtn.textContent = "SAVE / ISSUE PRESCRIPTION";
    issueBtn.addEventListener("click", async function (event) {
      event.preventDefault();
      await createPrescriptionAndMaybeSend("none");
    });
  }

  if (dropBtn) {
    const menu = ensureIssueMenu();
    dropBtn.addEventListener("click", function (event) {
      event.preventDefault();
      if (!menu) return;
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });
  }

  let medicationsCache = [];
const medicationSearchCache = new Map();
let medicationSearchAbortController = null;

function normalizeMedicationText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function escapeMedicationSearchToken(value) {
  return normalizeMedicationText(value)
    .replace(/[\:+\-!(){}\[\]^"~*?:\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMedicationSearchPattern(query) {
  const clean = escapeMedicationSearchToken(query);
  if (!clean) return "";
  return `*${clean.split(" ").filter(Boolean).join("*")}*`;
}

function extractMedicationStrength(product) {
  const ingredients = Array.isArray(product?.active_ingredients)
    ? product.active_ingredients
    : [];

  const parts = ingredients
    .map(function (ingredient) {
      return normalizeMedicationText(ingredient?.strength);
    })
    .filter(Boolean);

  return parts.join(" + ");
}

function buildMedicationDosageLabel(product) {
  const strength = extractMedicationStrength(product);
  const dosageForm = normalizeMedicationText(product?.dosage_form);
  const route = normalizeMedicationText(product?.route);

  return [strength, dosageForm, route].filter(Boolean).join(" · ");
}

function dedupeMedicationGroups(results) {
  const byName = new Map();

  (results || []).forEach(function (application) {
    (application.products || []).forEach(function (product) {
      const medicationName = normalizeMedicationText(product?.brand_name);
      if (!medicationName) return;

      const key = medicationName.toLowerCase();
      const dosageLabel = buildMedicationDosageLabel(product);
      const strength = extractMedicationStrength(product);
      const dosageForm = normalizeMedicationText(product?.dosage_form);
      const route = normalizeMedicationText(product?.route);

      if (!byName.has(key)) {
        byName.set(key, {
          medication_name: medicationName,
          dosage_options: [],
          strength_preview: strength,
          dosage_form_preview: dosageForm,
          route_preview: route,
        });
      }

      const entry = byName.get(key);
      if (
        dosageLabel &&
        !entry.dosage_options.some(function (option) {
          return option.value === dosageLabel;
        })
      ) {
        entry.dosage_options.push({
          value: dosageLabel,
          strength: strength,
          dosage_form: dosageForm,
          route: route,
        });
      }

      if (!entry.strength_preview && strength) entry.strength_preview = strength;
      if (!entry.dosage_form_preview && dosageForm) {
        entry.dosage_form_preview = dosageForm;
      }
      if (!entry.route_preview && route) entry.route_preview = route;
    });
  });

  return Array.from(byName.values()).sort(function (a, b) {
    return a.medication_name.localeCompare(b.medication_name);
  });
}

function rankMedicationMatches(list, query) {
  const q = normalizeMedicationText(query).toLowerCase();
  const startsWithMatches = [];
  const containsMatches = [];

  list.forEach(function (medication) {
    const name = String(medication.medication_name || "").toLowerCase();
    if (!name.includes(q)) return;

    if (name.startsWith(q)) {
      startsWithMatches.push(medication);
    } else {
      containsMatches.push(medication);
    }
  });

  return startsWithMatches.concat(containsMatches);
}

async function searchMedicationsFromApi(query) {
  const normalizedQuery = normalizeMedicationText(query);
  if (!normalizedQuery) return [];

  const cacheKey = normalizedQuery.toLowerCase();
  if (medicationSearchCache.has(cacheKey)) {
    return medicationSearchCache.get(cacheKey);
  }

  if (medicationSearchAbortController) {
    medicationSearchAbortController.abort();
  }

  medicationSearchAbortController = new AbortController();

  const pattern = buildMedicationSearchPattern(normalizedQuery);
  const url =
    "https://api.fda.gov/drug/drugsfda.json?search=" +
    encodeURIComponent(`products.brand_name:${pattern}`) +
    "&limit=100";

  const response = await fetch(url, {
    signal: medicationSearchAbortController.signal,
  });

  if (!response.ok) {
    if (response.status === 404) {
      medicationSearchCache.set(cacheKey, []);
      return [];
    }
    throw new Error(`openFDA request failed with status ${response.status}`);
  }

  const data = await response.json();
  const grouped = dedupeMedicationGroups(data.results || []);
  const ranked = rankMedicationMatches(grouped, normalizedQuery);

  medicationsCache = ranked;
  medicationSearchCache.set(cacheKey, ranked);
  return ranked;
}

async function loadMedicationsForSearch() {
  medicationsCache = [];
}

function getMedicationRow(input) {
  return input.closest("tr");
}

function getDosageFieldWrap(row) {
  return (
    row?.querySelector(".med-dosage-field") ||
    row?.children?.[2]?.querySelector(".med-field") ||
    null
  );
}

function createDosageInput(value, readOnly) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = `med-input med-input-dosage${readOnly ? " is-readonly" : ""}`;
  input.placeholder = "Dosage";
  input.value = value || "";
  input.readOnly = !!readOnly;
  if (readOnly) {
    input.setAttribute("aria-readonly", "true");
  }
  return input;
}

function createDosageSelect(options) {
  const select = document.createElement("select");
  select.className = "med-input med-input-dosage med-input-dosage-select";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select dosage";
  select.appendChild(placeholder);

  options.forEach(function (option) {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.value;
    select.appendChild(opt);
  });

  return select;
}

function renderDosageField(row, medication) {
  const wrap = getDosageFieldWrap(row);
  if (!wrap) return;

  wrap.classList.add("med-dosage-field");
  wrap.innerHTML = "";

  const dosageOptions = Array.isArray(medication?.dosage_options)
    ? medication.dosage_options.filter(function (option) {
        return option && option.value;
      })
    : [];
  wrap.dataset.mode = "empty";

  if (!dosageOptions.length) {
    wrap.appendChild(createDosageInput("", false));
    return;
  }

  if (dosageOptions.length === 1) {
    wrap.dataset.mode = "readonly";
    wrap.appendChild(createDosageInput(dosageOptions[0].value, true));
    return;
  }
  wrap.dataset.mode = "select";
  wrap.appendChild(createDosageSelect(dosageOptions));
}

function getMedicationMetaText(medication) {
  if (medication.dosage_options.length <= 1) {
    return (
      medication.dosage_options[0]?.value ||
      [
        medication.strength_preview,
        medication.dosage_form_preview,
        medication.route_preview,
      ]
        .filter(Boolean)
        .join(" · ")
    );
  }
}

function openMedicationDropdown(dropdown) {
  dropdown.style.display = "block";
  dropdown.classList.add("is-open");
}

function closeMedicationDropdown(dropdown) {
  dropdown.style.display = "none";
  dropdown.classList.remove("is-open");
}

function clearMedicationSelection(row) {
  if (!row) return;

  const medicineInput = row.querySelector(".med-input-medicine-search");
  if (medicineInput) {
    delete medicineInput.dataset.selectedMedication;
  }

  renderDosageField(row, { dosage_options: [] });
}

function applyMedicationSelection(input, medication) {
  const row = getMedicationRow(input);
  if (!row || !medication) return;

  input.value = medication.medication_name || "";
  input.dataset.selectedMedication = medication.medication_name || "";
  renderDosageField(row, medication);
}

async function syncTypedMedicineToDosage(input) {
  const typedName = normalizeMedicationText(input.value);
  const row = getMedicationRow(input);

  if (!typedName) {
    clearMedicationSelection(row);
    return;
  }

  let match = medicationsCache.find(function (medication) {
    return medication.medication_name.toLowerCase() === typedName.toLowerCase();
  });

  if (!match) {
        try {
      const list = await searchMedicationsFromApi(typedName);
      match = list.find(function (medication) {
        return medication.medication_name.toLowerCase() === typedName.toLowerCase();
      });
    } catch (error) {
      console.error("Failed to sync dosage from typed medicine", error);
      return;
    }
  }

  if (match) {
    applyMedicationSelection(input, match);
  }
}

function renderMedicationDropdown(dropdown, input, matches) {
  dropdown.innerHTML = "";

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "rx-med-dd-empty";
    empty.innerHTML = `
      <span class="rx-med-dd-empty-title">No medicines found</span>
      <span class="rx-med-dd-empty-copy">Try a different name or keep typing.</span>
    `;
    dropdown.appendChild(empty);
    openMedicationDropdown(dropdown);
    return;
  }

  matches.slice(0, 12).forEach(function (medication) {
    const dosageCount = medication.dosage_options.length;
    const item = document.createElement("button");
    item.type = "button";
    item.className = `rx-med-dd-item ${dosageCount > 1 ? "is-multiple" : "is-single"}`;

    const badgeText =
      dosageCount > 1 ? `${dosageCount} dosage choices` : "1 dosage";

    item.innerHTML = `
      <div class="rx-med-dd-item-name">${medication.medication_name}</div>
    `;

    item.addEventListener("click", function () {
      applyMedicationSelection(input, medication);
      closeMedicationDropdown(dropdown);
    });

    dropdown.appendChild(item);
  });

  openMedicationDropdown(dropdown);
}

function attachMedicationAutocomplete(input) {
  const dropdown = document.createElement("div");
  dropdown.className = "rx-med-dd";

  // dropdown.style.position = "relative";
  // dropdown.style.left = "0";
  // dropdown.style.right = "0";
  // dropdown.style.top = "42px";
  // dropdown.style.background = "#fff";
  // dropdown.style.border = "1px solid #e5e7eb";
  // dropdown.style.borderRadius = "6px";
  // dropdown.style.boxShadow = "0 10px 20px rgba(0,0,0,.08)";
  // dropdown.style.maxHeight = "220px";
  // dropdown.style.overflowY = "auto";
  // dropdown.style.zIndex = "9999";
  // dropdown.style.display = "none";

  input.parentElement.style.position = "relative";
  input.parentElement.appendChild(dropdown);

  let typingTimer = null;

  input.addEventListener("input", function () {
    const row = getMedicationRow(input);
    const currentValue = normalizeMedicationText(input.value);

    if (!currentValue) {
      closeMedicationDropdown(dropdown);
      clearMedicationSelection(row);
      return;
    }

    clearTimeout(typingTimer);
    typingTimer = setTimeout(async function () {
      try {
        const matches = await searchMedicationsFromApi(currentValue);
        renderMedicationDropdown(dropdown, input, matches);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Medication search failed", error);
        closeMedicationDropdown(dropdown);
      }
    }, 250);
  });

  input.addEventListener("blur", function () {
    setTimeout(function () {
      syncTypedMedicineToDosage(input);
    }, 150);
  });

  input.addEventListener("focus", async function () {
    const currentValue = normalizeMedicationText(input.value);
    if (!currentValue) return;

    try {
      const matches = await searchMedicationsFromApi(currentValue);
      renderMedicationDropdown(dropdown, input, matches);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Medication search failed", error);
      }
    }
  });

  document.addEventListener("click", function (event) {
    if (!input.contains(event.target) && !dropdown.contains(event.target)) {
      closeMedicationDropdown(dropdown);
    }
  });
}

function initMedicationInputs() {
  const inputs = document.querySelectorAll(".med-input-medicine-search");

  inputs.forEach(function (input) {
    if (!input.dataset.autocompleteAttached) {
      attachMedicationAutocomplete(input);
      input.dataset.autocompleteAttached = "1";
    }

    syncTypedMedicineToDosage(input);
  });
}

try {
  await loadMedicationsForSearch();
  initMedicationInputs();
  initMedicineRowActions();
} catch (error) {
  console.error(error);
}
function attachRemoveHandler(row) {
  const removeBtn = row.querySelector(".med-remove-btn");
  if (!removeBtn) return;

  removeBtn.addEventListener("click", function () {
    row.remove();
  });
}

function createMedicineRow() {
  const tr = document.createElement("tr");
  tr.className = "med-row";

  tr.innerHTML = `
    <td class="med-icon-cell">
      <button type="button" class="med-remove-btn">
        <span class="circle-minus"></span>
      </button>
    </td>
    <td>
      <div class="med-field">
        <input
          type="text"
          class="med-input med-input-medicine-search"
          placeholder="Item name (search or select from list)"
        />
      </div>
    </td>
    <td class="med-dosage-cell">
      <div class="med-field med-dosage-field">
        <input
          type="text"
          class="med-input med-input-dosage"
          placeholder="Dosage"
        />
      </div>
    </td>
    <td>
      <div class="med-field">
        <input
          type="text"
          class="med-input med-input-qty"
          placeholder="Qty"
        />
      </div>
    </td>
  `;

  attachRemoveHandler(tr);

  const medInput = tr.querySelector(".med-input-medicine-search");
  if (medInput) {
    attachMedicationAutocomplete(medInput);
    medInput.dataset.autocompleteAttached = "1";
  }

  return tr;
}

function initMedicineRowActions() {
  document.querySelectorAll("#meds-body .med-row").forEach(function (row) {
    if (!row.dataset.removeAttached) {
      attachRemoveHandler(row);
      row.dataset.removeAttached = "1";
    }
  });

  const addBtn = document.getElementById("add-med-btn");
  const addRow = document.getElementById("add-med-row");
  const medsBody = document.getElementById("meds-body");

  if (addBtn && addRow && medsBody && !addBtn.dataset.bound) {
    addBtn.dataset.bound = "1";

    addBtn.addEventListener("click", function (event) {
      event.preventDefault();

      const newRow = createMedicineRow();
      medsBody.insertBefore(newRow, addRow);
    });
  }
}
});