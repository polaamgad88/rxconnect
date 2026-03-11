// scripts/patients-rx.js
document.addEventListener("DOMContentLoaded", async function () {
  const user = RX.requireAuth(["clinician", "clinic"]);
  if (!user) return;

  const tbody = document.querySelector(".patients-table tbody");
  const theadRow = document.querySelector(".patients-table thead tr");
  const searchInput = document.getElementById("patientsSearchInput");
  const searchBtn = document.querySelector(".patients-search-btn");
  const clearBtn = document.getElementById("patientsClearBtn");
  const addBtn = document.querySelector(".patients-actions .patients-btn");

  if (!tbody || !theadRow) return;

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      window.location.href = "./create-patient.html";
    });
  }

  const isClinician = user.login_type === "clinician";

  let savedPatients = [];
  let allPatients = [];
  let currentRows = [];
  let savedIds = new Set();
  let currentMode = "saved";

  injectUi();

  function injectUi() {
    if (!document.getElementById("rxPatientsEnhancements")) {
      const style = document.createElement("style");
      style.id = "rxPatientsEnhancements";
      style.textContent = `
        .rx-patients-banner {
          margin: 14px 0 18px;
          padding: 14px 16px;
          border-radius: 10px;
          background: #f8fbff;
          border: 1px solid #d8efff;
          color: #0b5cab;
          font-size: 14px;
        }
        .rx-patients-banner strong {
          color: #0a3b75;
        }
        .rx-patients-empty {
          padding: 22px;
          text-align: center;
          color: #666;
        }
        .rx-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          background: #eef7ff;
          color: #0b5cab;
          border: 1px solid #d8efff;
        }
        .rx-tag.unsaved {
          background: #fff7e6;
          border-color: #ffe1a8;
          color: #ad6800;
        }
        .rx-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rx-btn-chip {
          border: 1px solid #d9d9d9;
          border-radius: 999px;
          background: #fff;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .rx-btn-chip.primary {
          border-color: #20baf8;
          color: #fff;
          background: #20baf8;
        }
        .rx-btn-chip.warn {
          border-color: #faad14;
          color: #ad6800;
          background: #fff7e6;
        }
      `;
      document.head.appendChild(style);
    }

    const wrapper = document.querySelector(".patients-wrapper");
    const searchRow = document.querySelector(".patients-search-row");
    if (
      wrapper &&
      searchRow &&
      !document.getElementById("patientsStatusBanner")
    ) {
      const banner = document.createElement("div");
      banner.id = "patientsStatusBanner";
      banner.className = "rx-patients-banner";
      searchRow.insertAdjacentElement("afterend", banner);
    }

    if (!document.querySelector(".patients-table thead .rx-scope-header")) {
      const scopeTh = document.createElement("th");
      scopeTh.className = "rx-scope-header";
      scopeTh.textContent = isClinician ? "MY LIST" : "TYPE";
      theadRow.appendChild(scopeTh);

      const actionTh = document.createElement("th");
      actionTh.className = "rx-scope-header";
      actionTh.textContent = "ACTIONS";
      theadRow.appendChild(actionTh);
    }
  }

  function setBanner(message) {
    const banner = document.getElementById("patientsStatusBanner");
    if (banner) banner.innerHTML = message;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDob(dobStr) {
    if (!dobStr) return "";
    const d = new Date(dobStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString();
    }
    const parts = String(dobStr).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dobStr;
  }

  function patientAddress(patient) {
    return String(patient.notes || "").replace(/^Address:\s*/i, "");
  }

  function rememberPatient(patientId) {
    sessionStorage.setItem("rx_selected_patient_id", String(patientId));
    sessionStorage.setItem("patient_history_patient_id", String(patientId));
  }

  function openHistory(patientId) {
    rememberPatient(patientId);
    window.location.href = `./patient-history.html?patient_id=${encodeURIComponent(patientId)}`;
  }

  function openPrescription(patientId) {
    rememberPatient(patientId);
    window.location.href = `./dr-form.html?patient_id=${encodeURIComponent(patientId)}`;
  }

  function render(list) {
    currentRows = Array.isArray(list) ? list.slice() : [];
    tbody.innerHTML = "";

    if (!currentRows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="rx-patients-empty">
            No patients found.
          </td>
        </tr>
      `;
      return;
    }

    currentRows.forEach(function (patient) {
      const name =
        `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
      const isSaved = savedIds.has(Number(patient.patient_id));

      const tr = document.createElement("tr");
      tr.dataset.patientId = String(patient.patient_id);
      tr.style.cursor = "pointer";
      tr.innerHTML = `
        <td>${escapeHtml(name || `Patient #${patient.patient_id}`)}</td>
        <td>${escapeHtml(patient.gender || "")}</td>
        <td>${escapeHtml(patient.email || patient.phone || "-")}</td>
        <td>${escapeHtml(formatDob(patient.date_of_birth))}</td>
        <td>${escapeHtml(patientAddress(patient) || "-")}</td>
        <td>
          ${
            isClinician
              ? `<span class="rx-tag ${isSaved ? "" : "unsaved"}">${isSaved ? "Saved to my list" : "Not saved yet"}</span>`
              : `<span class="rx-tag">Clinic patient</span>`
          }
        </td>
        <td>
          <div class="rx-actions">
            <button type="button" class="rx-btn-chip primary" data-action="history" data-patient-id="${escapeHtml(patient.patient_id)}">
              Open record
            </button>
            <button type="button" class="rx-btn-chip" data-action="prescribe" data-patient-id="${escapeHtml(patient.patient_id)}">
              New Rx
            </button>
            ${
              isClinician
                ? `<button type="button" class="rx-btn-chip ${isSaved ? "warn" : ""}" data-action="${isSaved ? "unsave" : "save"}" data-patient-id="${escapeHtml(patient.patient_id)}">
                    ${isSaved ? "Remove" : "Save"}
                  </button>`
                : ""
            }
          </div>
        </td>
      `;

      tr.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        openHistory(patient.patient_id);
      });

      tbody.appendChild(tr);
    });
  }

  async function loadSavedPatients() {
    if (!isClinician) {
      savedPatients = [];
      savedIds = new Set();
      return;
    }

    const resp = await RX.api.get("/clinicians/me/saved-patients");
    savedPatients = Array.isArray(resp.patients) ? resp.patients : [];
    savedIds = new Set(
      savedPatients.map((patient) => Number(patient.patient_id)),
    );
  }

  async function loadAllPatients(searchTerm = "") {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (searchTerm) params.set("search", searchTerm);
    const resp = await RX.api.get(`/patients?${params.toString()}`);
    allPatients = Array.isArray(resp.patients) ? resp.patients : [];
    return allPatients;
  }

  function renderDefaultView() {
    currentMode = isClinician ? "saved" : "all";
    const rows = isClinician ? savedPatients : allPatients;
    render(rows);

    if (isClinician) {
      setBanner(
        `<strong>Clinician patient list:</strong> showing <strong>${savedPatients.length}</strong> patient(s) saved to your own login. Search to find other patients and save them to your list.`,
      );
    } else {
      setBanner(
        `<strong>Clinic patient list:</strong> showing <strong>${allPatients.length}</strong> active patient(s).`,
      );
    }
  }

  async function runSearch() {
    const q = (searchInput?.value || "").trim();

    if (!q) {
      renderDefaultView();
      return;
    }

    const results = await loadAllPatients(q);
    currentMode = "search";
    render(results);

    if (isClinician) {
      setBanner(
        `<strong>Search results:</strong> found <strong>${results.length}</strong> patient(s). Use <strong>Save</strong> to keep a patient on your own clinician list.`,
      );
    } else {
      setBanner(
        `<strong>Search results:</strong> found <strong>${results.length}</strong> patient(s).`,
      );
    }
  }

  async function savePatient(patientId) {
    await RX.api.post("/clinicians/me/saved-patients", {
      patient_id: patientId,
    });
    await loadSavedPatients();

    if (currentMode === "search") {
      render(currentRows.map((p) => ({ ...p })));
      setBanner(
        `<strong>Patient saved.</strong> This patient is now attached to your clinician login and will appear in your main patient list.`,
      );
      return;
    }

    renderDefaultView();
  }

  async function unsavePatient(patientId) {
    await RX.api.del(`/clinicians/me/saved-patients/${patientId}`);
    await loadSavedPatients();

    if (currentMode === "search") {
      render(currentRows.map((p) => ({ ...p })));
      setBanner(
        `<strong>Patient removed.</strong> The patient is no longer on your clinician list, but still exists in the shared patient database.`,
      );
      return;
    }

    renderDefaultView();
  }

  tbody.addEventListener("click", async function (event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    const action = button.dataset.action;
    const patientId = Number(button.dataset.patientId);

    try {
      if (action === "history") {
        openHistory(patientId);
        return;
      }

      if (action === "prescribe") {
        openPrescription(patientId);
        return;
      }

      if (action === "save") {
        await savePatient(patientId);
        return;
      }

      if (action === "unsave") {
        await unsavePatient(patientId);
      }
    } catch (error) {
      alert(error.message || "Failed to update patient list.");
    }
  });

  if (searchInput) {
    searchInput.addEventListener("keydown", async function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        try {
          await runSearch();
        } catch (error) {
          alert(error.message || "Search failed.");
        }
      }
    });

    searchInput.addEventListener("input", function () {
      if (!searchInput.value.trim()) {
        renderDefaultView();
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", async function () {
      try {
        await runSearch();
      } catch (error) {
        alert(error.message || "Search failed.");
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) searchInput.value = "";
      renderDefaultView();
    });
  }

  try {
    await loadSavedPatients();
    await loadAllPatients();
    renderDefaultView();
  } catch (error) {
    setBanner(
      `<strong>Error:</strong> ${escapeHtml(error.message || "Failed to load patients.")}`,
    );
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="rx-patients-empty">
          Failed to load patients.
        </td>
      </tr>
    `;
  }
});
