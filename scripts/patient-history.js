// scripts/patient-history.js
document.addEventListener("DOMContentLoaded", async function () {
  // const user = RX.requireAuth(["clinician", "clinic", "dispenser", "chobham"]);
  // if (!user) return;

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
function initHistoryShell(currentUser) {
  const menuButton = document.getElementById("menu-btn");
  const navMenu = document.getElementById("nav-menu");
  const reportsButton = document.getElementById("reportsBtn");
  const reportsWrap = document.getElementById("reportsDropdownWrap");
  const userButton = document.querySelector(".user-trigger");
  const userWrap = document.getElementById("userDropdownWrap");
  const usernameEl = document.getElementById("username");
  const logoutLink = document.getElementById("logoutLink");
  const footerForm = document.getElementById("footerMessageForm");
  const footerFeedback = document.getElementById("footerFormFeedback");

  if (usernameEl && currentUser) {
    usernameEl.textContent =
      currentUser.full_name ||
      currentUser.username ||
      currentUser.email ||
      "User";
  }

  if (menuButton && navMenu) {
    menuButton.addEventListener("click", function () {
      const isOpen = navMenu.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));

      const icon = menuButton.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !isOpen);
        icon.classList.toggle("fa-xmark", isOpen);
      }
    });
  }

  if (reportsButton && reportsWrap) {
    reportsButton.addEventListener("click", function (e) {
      e.preventDefault();
      const isOpen = reportsWrap.classList.toggle("is-open");
      reportsButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (userButton && userWrap) {
    userButton.addEventListener("click", function (e) {
      e.preventDefault();
      const isOpen = userWrap.classList.toggle("is-open");
      userButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", function () {
      try {
        if (window.RX && typeof RX.logout === "function") {
          RX.logout();
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("token");
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("token");
        }
      } catch (_) {}
    });
  }

  document.addEventListener("click", function (e) {
    if (reportsWrap && !reportsWrap.contains(e.target)) {
      reportsWrap.classList.remove("is-open");
      if (reportsButton) reportsButton.setAttribute("aria-expanded", "false");
    }

    if (userWrap && !userWrap.contains(e.target)) {
      userWrap.classList.remove("is-open");
      if (userButton) userButton.setAttribute("aria-expanded", "false");
    }

    if (
      navMenu &&
      menuButton &&
      navMenu.classList.contains("is-open") &&
      !navMenu.contains(e.target) &&
      !menuButton.contains(e.target)
    ) {
      navMenu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");

      const icon = menuButton.querySelector("i");
      if (icon) {
        icon.classList.add("fa-bars");
        icon.classList.remove("fa-xmark");
      }
    }
  });

  if (footerForm && footerFeedback) {
    footerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      footerFeedback.textContent =
        "Thank you. Your message has been received.";
    });
  }
}
  function injectEnhancements() {
  const container = document.querySelector(".history-section .w-container");
  if (!container) return;

  if (!document.getElementById("patientHistoryPrivateArea")) {
    const block = document.createElement("section");
    block.id = "patientHistoryPrivateArea";
    block.className = "card";

    block.innerHTML = `
      <div class="rx-private-grid">
        <div class="rx-private-card" id="privateNotesWrap">
          <span class="history-card-kicker">Clinician notes</span>
          <h4>Private Clinician Notes</h4>

          <form id="clinicianNoteForm" class="rx-private-form">
            <div
              id="clinicianNoteEditingLabel"
              class="rx-editing-label"
              style="display:none;"
            >
              Editing note
            </div>

            <textarea
              id="clinicianNoteInput"
              placeholder="Write a private note for this patient. Other clinicians cannot see this."
            ></textarea>

            <div class="rx-btn-row">
              <button
                type="submit"
                id="clinicianNoteSubmit"
                class="rx-pill-btn"
              >
                Save note
              </button>

              <button
                type="button"
                id="clinicianNoteCancel"
                class="rx-pill-btn ghost"
                style="display:none;"
              >
                Cancel edit
              </button>
            </div>
          </form>

          <div id="clinicianNotesList" class="rx-list"></div>
        </div>
      </div>
    `;

    container.appendChild(block);
  }

  const patientCardMeta = document.querySelector(".patient-card .patient-meta");
  if (patientCardMeta && !document.getElementById("patientCardActionRow")) {
    const actions = document.createElement("div");
    actions.id = "patientCardActionRow";
    actions.className = "rx-btn-row";
    actions.innerHTML = `
      <button
        type="button"
        id="savePatientBtn"
        class="rx-pill-btn secondary"
      >
        Save patient to my list
      </button>

      <button
        type="button"
        id="newPrescriptionBtn"
        class="rx-pill-btn"
      >
        New prescription
      </button>
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
