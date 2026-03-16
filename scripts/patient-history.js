// scripts/patient-history.js
document.addEventListener("DOMContentLoaded", async function () {
  const user = RX.requireAuth(["clinician", "clinic", "dispenser", "chobham"]);
  if (!user) return;

  const isClinician = user.login_type === "clinician";

  const patientNameEl = document.getElementById("patientName");
  const patientMrnEl = document.getElementById("patientMrn");
  const patientDobEl = document.getElementById("patientDob");
  const patientAvatarEl = document.getElementById("patientAvatar");

  const fromDateEl = document.getElementById("fromDate");
  const toDateEl = document.getElementById("toDate");
  const statusFilterEl = document.getElementById("statusFilter");
  const filtersForm = document.getElementById("filtersForm");
  const resetBtn = document.getElementById("resetFilters");

  const historyStateEl = document.getElementById("historyState");
  const tableBody = document.querySelector("#rxTable tbody");

  const modalBackdrop = document.getElementById("rxModalBackdrop");
  const modalClose = document.getElementById("rxModalClose");

  const m_rxId = document.getElementById("m_rxId");
  const m_date = document.getElementById("m_date");
  const m_status = document.getElementById("m_status");
  const m_diagnosis = document.getElementById("m_diagnosis");
  const m_code = document.getElementById("m_code");
  const m_unique = document.getElementById("m_unique");
  const m_notes = document.getElementById("m_notes");
  const m_itemsBody = document.querySelector("#m_items tbody");

  let patientId = null;
  let patient = null;
  let prescriptions = [];
  let chart = null;
  let savedPatientIds = new Set();

  let editingNoteId = null;
  let editingPmrId = null;

  injectEnhancements();

  const savePatientBtn = document.getElementById("savePatientBtn");
  const newRxBtn = document.getElementById("newPrescriptionBtn");

  const privateNotesWrap = document.getElementById("privateNotesWrap");
  const privatePmrWrap = document.getElementById("privatePmrWrap");

  const clinicianNoteForm = document.getElementById("clinicianNoteForm");
  const clinicianNoteInput = document.getElementById("clinicianNoteInput");
  const clinicianNoteSubmit = document.getElementById("clinicianNoteSubmit");
  const clinicianNoteCancel = document.getElementById("clinicianNoteCancel");
  const clinicianNotesList = document.getElementById("clinicianNotesList");

  const clinicianPmrForm = document.getElementById("clinicianPmrForm");
  const clinicianPmrTitle = document.getElementById("clinicianPmrTitle");
  const clinicianPmrType = document.getElementById("clinicianPmrType");
  const clinicianPmrNotes = document.getElementById("clinicianPmrNotes");
  const clinicianPmrSubmit = document.getElementById("clinicianPmrSubmit");
  const clinicianPmrCancel = document.getElementById("clinicianPmrCancel");
  const clinicianPmrList = document.getElementById("clinicianPmrList");

  function injectEnhancements() {
    if (!document.getElementById("patientHistoryEnhancementStyles")) {
      const style = document.createElement("style");
      style.id = "patientHistoryEnhancementStyles";
      style.textContent = `
        .success-state, .error-state, .loading-state, .empty-state {
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 14px;
        }
        .success-state {
          background: #f6ffed;
          color: #389e0d;
          border: 1px solid #b7eb8f;
        }
        .error-state {
          background: #fff1f0;
          color: #cf1322;
          border: 1px solid #ffa39e;
        }
        .loading-state {
          background: #e6f7ff;
          color: #096dd9;
          border: 1px solid #91d5ff;
        }
        .empty-state {
          background: #fafafa;
          color: #595959;
          border: 1px solid #d9d9d9;
        }
        .muted {
          color: #777;
        }
        .rx-private-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
          margin-top: 24px;
        }
        .rx-private-card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          padding: 20px;
        }
        .rx-private-card h4 {
          margin-top: 0;
          margin-bottom: 14px;
          font-family: "Montserrat", sans-serif;
        }
        .rx-private-form input,
        .rx-private-form select,
        .rx-private-form textarea {
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 10px;
          padding: 10px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          background: #fff;
        }
        .rx-private-form textarea {
          min-height: 110px;
          resize: vertical;
        }
        .rx-btn-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .rx-pill-btn {
          border: none;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: #20baf8;
          color: #fff;
        }
        .rx-pill-btn.secondary {
          background: #fff;
          color: #096dd9;
          border: 1px solid #91d5ff;
        }
        .rx-pill-btn.warn {
          background: #fff7e6;
          color: #ad6800;
          border: 1px solid #ffd591;
        }
        .rx-pill-btn.ghost {
          background: #fff;
          color: #595959;
          border: 1px solid #d9d9d9;
        }
        .rx-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        .rx-list-item {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 14px;
          background: #fff;
        }
        .rx-list-item .title {
          font-weight: 700;
          margin-bottom: 6px;
          color: #1f2937;
        }
        .rx-list-item .body {
          color: #4b5563;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        .rx-list-item .meta {
          color: #777;
          font-size: 12px;
          margin-top: 8px;
        }
        .rx-list-item .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .rx-item-btn {
          border: 1px solid #d9d9d9;
          background: #fff;
          color: #444;
          border-radius: 999px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .rx-item-btn.edit {
          color: #096dd9;
          border-color: #91d5ff;
          background: #f0faff;
        }
        .rx-item-btn.delete {
          color: #cf1322;
          border-color: #ffa39e;
          background: #fff1f0;
        }
        .rx-empty-box {
          border: 1px dashed #d9d9d9;
          border-radius: 8px;
          padding: 14px;
          color: #666;
          text-align: center;
          background: #fafafa;
        }
        .rx-patient-extra {
          margin-top: 8px;
          color: #666;
          font-size: 14px;
        }
        .rx-editing-label {
          display: inline-block;
          margin-bottom: 10px;
          padding: 6px 10px;
          border-radius: 999px;
          background: #fff7e6;
          color: #ad6800;
          border: 1px solid #ffd591;
          font-size: 12px;
          font-weight: 700;
        }
        @media (max-width: 980px) {
          .rx-private-grid {
            grid-template-columns: 1fr;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const container = document.querySelector(".history-section .w-container");
    if (!container) return;

 if (!document.getElementById("patientHistoryPrivateArea")) {
  const block = document.createElement("div");
  block.id = "patientHistoryPrivateArea";
  block.innerHTML = `
    <style>
      #patientHistoryPrivateArea {
        width: 100%;
        display: flex;
        justify-content: center;
        margin: 32px 0;
      }

      #patientHistoryPrivateArea .rx-private-grid {
        width: 100%;
        display: flex;
        justify-content: center;
      }

      #patientHistoryPrivateArea .rx-private-card {
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        background: #fff;
        border-radius: 18px;
        padding: 24px;
        box-sizing: border-box;
      }

      #patientHistoryPrivateArea .rx-private-card h4 {
        text-align: center;
        margin-bottom: 18px;
      }

      #patientHistoryPrivateArea .rx-private-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      #patientHistoryPrivateArea .rx-editing-label {
        font-size: 14px;
        font-weight: 600;
        color: #1f4e8c;
      }

      #patientHistoryPrivateArea #clinicianNoteInput {
        width: 100%;
        min-height: 150px;
        padding: 14px 16px;
        border: 1px solid #d8deea;
        border-radius: 14px;
        resize: vertical;
        font-size: 15px;
        line-height: 1.5;
        box-sizing: border-box;
      }

      #patientHistoryPrivateArea .rx-btn-row {
        display: flex;
        justify-content: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      #patientHistoryPrivateArea #clinicianNotesList {
        margin-top: 18px;
      }
    </style>

    <div class="rx-private-grid">
      <div class="rx-private-card" id="privateNotesWrap">
        <h4>Private Clinician Notes</h4>
        <form id="clinicianNoteForm" class="rx-private-form">
          <div id="clinicianNoteEditingLabel" class="rx-editing-label" style="display:none;">Editing note</div>
          <textarea id="clinicianNoteInput" placeholder="Write a private note for this patient. Other clinicians cannot see this."></textarea>
          <div class="rx-btn-row">
            <button type="submit" id="clinicianNoteSubmit" class="rx-pill-btn">Save note</button>
            <button type="button" id="clinicianNoteCancel" class="rx-pill-btn ghost" style="display:none;">Cancel edit</button>
          </div>
        </form>
        <div id="clinicianNotesList" class="rx-list"></div>
      </div>
    </div>
  `;
  container.appendChild(block);
}

    const patientCardMeta = document.querySelector(
      ".patient-card .patient-meta",
    );
    if (patientCardMeta && !document.getElementById("patientCardActionRow")) {
      const actions = document.createElement("div");
      actions.id = "patientCardActionRow";
      actions.className = "rx-btn-row";
      actions.innerHTML = `
        <button type="button" id="savePatientBtn" class="rx-pill-btn secondary">Save patient to my list</button>
        <button type="button" id="newPrescriptionBtn" class="rx-pill-btn">New prescription</button>
      `;
      patientCardMeta.appendChild(actions);
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

  function getPatientIdFromContext() {
    const qs = new URLSearchParams(window.location.search);
    const fromQuery =
      qs.get("patient_id") || qs.get("id") || qs.get("patientId");
    const fromSession =
      sessionStorage.getItem("patient_history_patient_id") ||
      sessionStorage.getItem("selected_patient_id") ||
      sessionStorage.getItem("rx_selected_patient_id");

    const raw = fromQuery || fromSession;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
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

  function stateHtml(type, text) {
    return `<div class="${type}-state">${escapeHtml(text)}</div>`;
  }

  function setState(type, text) {
    if (!historyStateEl) return;
    historyStateEl.innerHTML = stateHtml(type, text);
  }

  function clearState() {
    if (!historyStateEl) return;
    historyStateEl.innerHTML = "";
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

  function applyFilters(list) {
    const from = fromDateEl?.value || "";
    const to = toDateEl?.value || "";
    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;
    const allowedStatuses = normalizeFilterStatus(statusFilterEl?.value);

    return list.filter((rx) => {
      const s = String(rx.status || "").toLowerCase();

      let statusOk = true;
      if (allowedStatuses) statusOk = allowedStatuses.includes(s);

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

  function fillPatientCard(p) {
    if (patientNameEl) {
      patientNameEl.textContent =
        `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
        "Unknown Patient";
    }
    if (patientMrnEl) patientMrnEl.textContent = p.patient_id || "--";
    if (patientDobEl) patientDobEl.textContent = p.date_of_birth || "--";
    if (patientAvatarEl)
      patientAvatarEl.textContent = initials(p.first_name, p.last_name);

    const meta = document.querySelector(".patient-card .patient-meta");
    if (!meta) return;

    const oldExtra = document.getElementById("patientExtraInfo");
    if (oldExtra) oldExtra.remove();

    const extra = document.createElement("div");
    extra.id = "patientExtraInfo";
    extra.className = "rx-patient-extra";
    extra.innerHTML = `
      Email: ${escapeHtml(p.email || "-")} •
      Phone: ${escapeHtml(p.phone || "-")} •
      Gender: ${escapeHtml(p.gender || "-")} •
      NHS/National ID: ${escapeHtml(p.national_id || "-")}
    `;
    meta.appendChild(extra);
  }

  function renderTable(list) {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!list.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="muted">No prescriptions found for this patient.</td>
        </tr>
      `;
      return;
    }

    list.forEach((rx) => {
      const tr = document.createElement("tr");
      tr.dataset.rxid = String(rx.prescription_id);

      tr.innerHTML = `
        <td>${escapeHtml(rx.prescription_number || rx.code || rx.prescription_id || "-")}</td>
        <td>${escapeHtml(fmtDate(rx.issue_date || rx.created_at))}</td>
        <td>
          <span class="status-badge ${badgeClass(rx.status)}">
            ${escapeHtml(rx.status || "-")}
          </span>
        </td>
        <td>${escapeHtml(rx.diagnosis || "-")}</td>
        <td>${escapeHtml(fmtDateTime(rx.last_dispensed_at))}</td>
        <td>${escapeHtml(rx.pharmacy_name || "-")}</td>
      `;

      tr.addEventListener("click", async function () {
        await openPrescriptionModal(rx.prescription_id);
      });

      tableBody.appendChild(tr);
    });
  }

  function getStatusColor(status) {
    const s = String(status || "").toLowerCase();
    if (["fully_dispensed", "dispensed"].includes(s)) return "#52c41a";
    if (["expired", "cancelled"].includes(s)) return "#f5222d";
    return "#1890ff";
  }

  function renderChart(list) {
    const canvas = document.getElementById("timelineChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (chart) {
      chart.destroy();
      chart = null;
    }

    const sorted = [...list].sort((a, b) => {
      const da = new Date(getReferenceDate(a) || 0).getTime();
      const db = new Date(getReferenceDate(b) || 0).getTime();
      return da - db;
    });

    const labels = sorted.map((rx) => fmtDate(getReferenceDate(rx)));
    const data = sorted.map((_, idx) => idx + 1);
    const pointColors = sorted.map((rx) => getStatusColor(rx.status));

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Prescriptions",
            data,
            borderColor: "#20baf8",
            backgroundColor: "rgba(32,186,248,0.15)",
            pointBackgroundColor: pointColors,
            pointBorderColor: pointColors,
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
          if (rx) await openPrescriptionModal(rx.prescription_id);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                const idx = items[0]?.dataIndex ?? 0;
                const rx = sorted[idx];
                return rx
                  ? `Rx ${rx.prescription_number || rx.prescription_id}`
                  : "";
              },
              label: function (ctx) {
                const rx = sorted[ctx.dataIndex];
                if (!rx) return "";
                return [
                  `Status: ${rx.status || "-"}`,
                  `Diagnosis: ${rx.diagnosis || "-"}`,
                  `Date: ${fmtDate(getReferenceDate(rx))}`,
                ];
              },
            },
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

  function setNoteEditMode(note) {
    editingNoteId = Number(note.note_id);
    if (clinicianNoteInput)
      clinicianNoteInput.value = note.note_text || note.note || "";
    if (clinicianNoteSubmit) clinicianNoteSubmit.textContent = "Update note";
    if (clinicianNoteCancel) clinicianNoteCancel.style.display = "inline-block";
    const label = document.getElementById("clinicianNoteEditingLabel");
    if (label) label.style.display = "inline-block";
    clinicianNoteInput?.focus();
  }

  function clearNoteEditMode() {
    editingNoteId = null;
    if (clinicianNoteInput) clinicianNoteInput.value = "";
    if (clinicianNoteSubmit) clinicianNoteSubmit.textContent = "Save note";
    if (clinicianNoteCancel) clinicianNoteCancel.style.display = "none";
    const label = document.getElementById("clinicianNoteEditingLabel");
    if (label) label.style.display = "none";
  }

  function setPmrEditMode(record) {
    editingPmrId = Number(record.medical_record_id);
    if (clinicianPmrTitle) clinicianPmrTitle.value = record.title || "";
    if (clinicianPmrType)
      clinicianPmrType.value = record.record_type || "consultation_note";
    if (clinicianPmrNotes) clinicianPmrNotes.value = record.notes || "";
    if (clinicianPmrSubmit)
      clinicianPmrSubmit.textContent = "Update PMR record";
    if (clinicianPmrCancel) clinicianPmrCancel.style.display = "inline-block";
    const label = document.getElementById("clinicianPmrEditingLabel");
    if (label) label.style.display = "inline-block";
    clinicianPmrTitle?.focus();
  }

  function clearPmrEditMode() {
    editingPmrId = null;
    if (clinicianPmrTitle) clinicianPmrTitle.value = "";
    if (clinicianPmrType) clinicianPmrType.value = "consultation_note";
    if (clinicianPmrNotes) clinicianPmrNotes.value = "";
    if (clinicianPmrSubmit) clinicianPmrSubmit.textContent = "Save PMR record";
    if (clinicianPmrCancel) clinicianPmrCancel.style.display = "none";
    const label = document.getElementById("clinicianPmrEditingLabel");
    if (label) label.style.display = "none";
  }

  function renderNotes(list) {
    if (!clinicianNotesList) return;

    if (!list.length) {
      clinicianNotesList.innerHTML =
        '<div class="rx-empty-box">No private clinician notes saved yet.</div>';
      return;
    }

    clinicianNotesList.innerHTML = list
      .map(
        (note) => `
          <div class="rx-list-item">
            <div class="body">${escapeHtml(note.note_text || note.note || "")}</div>
            <div class="meta">Saved ${escapeHtml(fmtDateTime(note.updated_at || note.created_at))}</div>
            <div class="actions">
              <button type="button" class="rx-item-btn edit" data-edit-note="${escapeHtml(note.note_id)}">Edit</button>
              <button type="button" class="rx-item-btn delete" data-delete-note="${escapeHtml(note.note_id)}">Delete</button>
            </div>
          </div>
        `,
      )
      .join("");
  }

  function renderPmr(list) {
    if (!clinicianPmrList) return;

    if (!list.length) {
      clinicianPmrList.innerHTML =
        '<div class="rx-empty-box">No private PMR records saved yet.</div>';
      return;
    }

    clinicianPmrList.innerHTML = list
      .map(
        (record) => `
          <div class="rx-list-item">
            <div class="title">${escapeHtml(record.title || "Untitled record")}</div>
            <div class="body">${escapeHtml(record.notes || "-")}</div>
            <div class="meta">
              Type: ${escapeHtml(record.record_type || "-")} •
              Date: ${escapeHtml(fmtDateTime(record.record_date || record.updated_at || record.created_at))}
            </div>
            <div class="actions">
              <button type="button" class="rx-item-btn edit" data-edit-pmr="${escapeHtml(record.medical_record_id)}">Edit</button>
              <button type="button" class="rx-item-btn delete" data-delete-pmr="${escapeHtml(record.medical_record_id)}">Delete</button>
            </div>
          </div>
        `,
      )
      .join("");
  }

  async function loadSavedPatients() {
    if (!isClinician) return;
    const resp = await RX.api.get("/clinicians/me/saved-patients");
    const list = Array.isArray(resp.patients) ? resp.patients : [];
    savedPatientIds = new Set(list.map((p) => Number(p.patient_id)));
    syncSavePatientButton();
  }

  function syncSavePatientButton() {
    if (!savePatientBtn) return;

    if (!isClinician) {
      savePatientBtn.style.display = "none";
      return;
    }

    const saved = savedPatientIds.has(Number(patientId));
    savePatientBtn.textContent = saved
      ? "Remove patient from my list"
      : "Save patient to my list";
    savePatientBtn.className = saved
      ? "rx-pill-btn warn"
      : "rx-pill-btn secondary";
  }

  async function loadPatient() {
    const resp = await RX.api.get(`/patients/${patientId}`);
    patient = resp.patient || resp;
    fillPatientCard(patient);
  }

  async function loadPrescriptions() {
    if (isClinician) {
      const resp = await RX.api.get(
        `/clinicians/me/patients/${patientId}/prescriptions`,
      );
      prescriptions = Array.isArray(resp.prescriptions)
        ? resp.prescriptions
        : [];
      return;
    }
    prescriptions = [];
  }

  async function loadPrivateNotes() {
    if (!isClinician || !clinicianNotesList) return [];
    const resp = await RX.api.get(`/clinicians/me/patients/${patientId}/notes`);
    const notes = Array.isArray(resp.notes) ? resp.notes : [];
    renderNotes(notes);
    return notes;
  }

  async function loadPrivatePmr() {
    if (!isClinician || !clinicianPmrList) return [];
    const resp = await RX.api.get(`/clinicians/me/patients/${patientId}/pmr`);
    const records = Array.isArray(resp.records) ? resp.records : [];
    renderPmr(records);
    return records;
  }

  async function openPrescriptionModal(prescriptionId) {
    try {
      const resp = await RX.api.get(`/prescriptions/${prescriptionId}`);
      const rx = resp.prescription || {};
      const items = Array.isArray(resp.items) ? resp.items : [];

      if (m_rxId) m_rxId.textContent = rx.prescription_id || "-";
      if (m_date)
        m_date.textContent = fmtDateTime(rx.issue_date || rx.created_at);
      if (m_status) {
        m_status.innerHTML = `<span class="status-badge ${badgeClass(rx.status)}">${escapeHtml(rx.status || "-")}</span>`;
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
              <td colspan="7" class="muted">No prescription items found.</td>
            </tr>
          `;
        } else {
          items.forEach((item) => {
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

      if (modalBackdrop) {
        modalBackdrop.classList.add("open");
        modalBackdrop.setAttribute("aria-hidden", "false");
      }
    } catch (err) {
      alert(err.message || "Failed to load prescription details");
    }
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("open");
    modalBackdrop.setAttribute("aria-hidden", "true");
  }

  function rerender() {
    const filtered = applyFilters(prescriptions);
    renderTable(filtered);
    renderChart(filtered);
  }

  if (savePatientBtn) {
    savePatientBtn.addEventListener("click", async function () {
      if (!isClinician) return;

      try {
        const saved = savedPatientIds.has(Number(patientId));

        if (saved) {
          await RX.api.del(`/clinicians/me/saved-patients/${patientId}`);
          setState("success", "Patient removed from your clinician list.");
        } else {
          await RX.api.post("/clinicians/me/saved-patients", {
            patient_id: Number(patientId),
          });
          setState("success", "Patient saved to your clinician list.");
        }

        await loadSavedPatients();
      } catch (err) {
        setState("error", err.message || "Failed to update saved patient.");
      }
    });
  }

  if (newRxBtn) {
    newRxBtn.addEventListener("click", function () {
      sessionStorage.setItem("patient_history_patient_id", String(patientId));
      sessionStorage.setItem("rx_selected_patient_id", String(patientId));
      window.location.href = `./dr-form.html?patient_id=${encodeURIComponent(patientId)}`;
    });
  }

  if (clinicianNoteCancel) {
    clinicianNoteCancel.addEventListener("click", function () {
      clearNoteEditMode();
    });
  }

  if (clinicianPmrCancel) {
    clinicianPmrCancel.addEventListener("click", function () {
      clearPmrEditMode();
    });
  }

  if (clinicianNoteForm) {
    clinicianNoteForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const noteText = (clinicianNoteInput?.value || "").trim();
      if (!noteText) {
        alert("Please write a note first.");
        return;
      }

      try {
        if (editingNoteId) {
          await RX.api.put(
            `/clinicians/me/patients/${patientId}/notes/${editingNoteId}`,
            { note_text: noteText },
          );
          setState("success", "Private clinician note updated.");
        } else {
          await RX.api.post(`/clinicians/me/patients/${patientId}/notes`, {
            note_text: noteText,
          });
          setState("success", "Private clinician note saved.");
        }

        clearNoteEditMode();
        await loadSavedPatients();
        await loadPrivateNotes();
      } catch (err) {
        setState("error", err.message || "Failed to save note.");
      }
    });
  }

  if (clinicianPmrForm) {
    clinicianPmrForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const title = (clinicianPmrTitle?.value || "").trim();
      const record_type = clinicianPmrType?.value || "consultation_note";
      const notes = (clinicianPmrNotes?.value || "").trim();

      if (!notes) {
        alert("Please enter the PMR details first.");
        return;
      }

      try {
        const payload = {
          title: title || "Consultation record",
          record_type,
          notes,
        };

        if (editingPmrId) {
          await RX.api.put(
            `/clinicians/me/patients/${patientId}/pmr/${editingPmrId}`,
            payload,
          );
          setState("success", "Private PMR record updated.");
        } else {
          await RX.api.post(`/clinicians/me/patients/${patientId}/pmr`, {
            ...payload,
            record_data: null,
          });
          setState("success", "Private PMR record saved.");
        }

        clearPmrEditMode();
        await loadSavedPatients();
        await loadPrivatePmr();
      } catch (err) {
        setState("error", err.message || "Failed to save PMR record.");
      }
    });
  }

  if (clinicianNotesList) {
    clinicianNotesList.addEventListener("click", async function (e) {
      const editBtn = e.target.closest("[data-edit-note]");
      const deleteBtn = e.target.closest("[data-delete-note]");

      try {
        if (editBtn) {
          const noteId = Number(editBtn.getAttribute("data-edit-note"));
          const resp = await RX.api.get(
            `/clinicians/me/patients/${patientId}/notes`,
          );
          const notes = Array.isArray(resp.notes) ? resp.notes : [];
          const note = notes.find((n) => Number(n.note_id) === noteId);
          if (!note) {
            alert("Note not found.");
            return;
          }
          setNoteEditMode(note);
          return;
        }

        if (deleteBtn) {
          const noteId = Number(deleteBtn.getAttribute("data-delete-note"));
          const ok = window.confirm("Delete this private note?");
          if (!ok) return;

          await RX.api.del(
            `/clinicians/me/patients/${patientId}/notes/${noteId}`,
          );
          if (editingNoteId === noteId) clearNoteEditMode();
          await loadPrivateNotes();
          setState("success", "Private clinician note deleted.");
        }
      } catch (err) {
        setState("error", err.message || "Failed to update note.");
      }
    });
  }

  if (clinicianPmrList) {
    clinicianPmrList.addEventListener("click", async function (e) {
      const editBtn = e.target.closest("[data-edit-pmr]");
      const deleteBtn = e.target.closest("[data-delete-pmr]");

      try {
        if (editBtn) {
          const pmrId = Number(editBtn.getAttribute("data-edit-pmr"));
          const resp = await RX.api.get(
            `/clinicians/me/patients/${patientId}/pmr`,
          );
          const records = Array.isArray(resp.records) ? resp.records : [];
          const record = records.find(
            (r) => Number(r.medical_record_id) === pmrId,
          );
          if (!record) {
            alert("PMR record not found.");
            return;
          }
          setPmrEditMode(record);
          return;
        }

        if (deleteBtn) {
          const pmrId = Number(deleteBtn.getAttribute("data-delete-pmr"));
          const ok = window.confirm("Delete this PMR record?");
          if (!ok) return;

          await RX.api.del(`/clinicians/me/patients/${patientId}/pmr/${pmrId}`);
          if (editingPmrId === pmrId) clearPmrEditMode();
          await loadPrivatePmr();
          setState("success", "Private PMR record deleted.");
        }
      } catch (err) {
        setState("error", err.message || "Failed to update PMR record.");
      }
    });
  }

  patientId = getPatientIdFromContext();
  if (!patientId) {
    setState(
      "error",
      "No patient selected. Open this page with ?patient_id=ID or select a patient first.",
    );
    return;
  }

  sessionStorage.setItem("patient_history_patient_id", String(patientId));
  sessionStorage.setItem("rx_selected_patient_id", String(patientId));

  if (!isClinician) {
    if (privateNotesWrap) privateNotesWrap.style.display = "none";
    if (privatePmrWrap) privatePmrWrap.style.display = "none";
  }

  setState("loading", "Loading patient history...");

  try {
    if (isClinician) {
      await loadSavedPatients();
    }

    await loadPatient();
    await loadPrescriptions();
    rerender();

    if (isClinician) {
      await loadPrivateNotes();
      await loadPrivatePmr();
    }

    clearState();

    if (!prescriptions.length) {
      setState(
        "empty",
        "This patient has no prescriptions yet for this prescriber.",
      );
    }
  } catch (err) {
    setState("error", err.message || "Failed to load patient history.");
    return;
  }

  if (filtersForm) {
    filtersForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearState();
      rerender();
      if (!applyFilters(prescriptions).length) {
        setState("empty", "No prescriptions match the selected filters.");
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (fromDateEl) fromDateEl.value = "";
      if (toDateEl) toDateEl.value = "";
      if (statusFilterEl) statusFilterEl.value = "";
      clearState();
      rerender();
      if (!prescriptions.length) {
        setState("empty", "This patient has no prescriptions yet.");
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) closeModal();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeModal();
  });
});
