// scripts/prescriptions-rx.js
document.addEventListener("DOMContentLoaded", async function () {
  const user = RX.requireAuth(["clinician"]);
  if (!user) return;

  const tbody = document.querySelector(".pt-table tbody");
  const statusSelect = document.querySelector(".pt-filters select.pt-input");
  const dateInputs = document.querySelectorAll(".pt-date-range input[type='date']");
  const searchInput = document.querySelector(".pt-search");
  const searchBtn = document.querySelector(".pt-search-btn");
  const clearBtn = document.getElementById("pt-clear-btn");

  let all = [];
  const patientCache = new Map(); // patient_id -> {first_name,last_name,...}

  function statusPill(status) {
    const s = String(status || "").toLowerCase();
    let cls = "pt-status-issued";

    if (s === "fully_dispensed") cls = "pt-status-dispensed";
    else if (s === "partially_dispensed") cls = "pt-status-pending";
    else if (s === "cancelled" || s === "expired") cls = "pt-status-cancelled";
    else cls = "pt-status-issued";

    return `<span class="pt-status ${cls}">${status || "-"}</span>`;
  }

  function fmtDate(dt) {
    if (!dt) return "";
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt);
    return d.toLocaleString();
  }

  async function getPatientName(patient_id) {
    if (!patient_id) return `Patient #${patient_id}`;
    if (patientCache.has(patient_id)) {
      const p = patientCache.get(patient_id);
      return `${p.first_name || ""} ${p.last_name || ""}`.trim() || `Patient #${patient_id}`;
    }
    try {
      const p = await RX.api.get(`/patients/${patient_id}`, { auth: false });
      patientCache.set(patient_id, p);
      return `${p.first_name || ""} ${p.last_name || ""}`.trim() || `Patient #${patient_id}`;
    } catch {
      return `Patient #${patient_id}`;
    }
  }

  function normalizeStatusFilter(uiVal) {
    const v = String(uiVal || "").toLowerCase();
    if (v === "issued") return ["active", "partially_dispensed"];
    if (v === "dispensed") return ["fully_dispensed"];
    if (v === "cancelled") return ["cancelled", "expired"];
    return null; // no filter
  }

  function applyFilters(list) {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const statusUi = statusSelect?.value || "Status";
    const statusAllowed = normalizeStatusFilter(statusUi);

    const from = dateInputs?.[0]?.value || "";
    const to = dateInputs?.[1]?.value || "";
    const fromD = from ? new Date(from + "T00:00:00") : null;
    const toD = to ? new Date(to + "T23:59:59") : null;

    return list.filter((r) => {
      const statusOk = !statusAllowed || statusAllowed.includes(String(r.status || "").toLowerCase());

      let dateOk = true;
      const ref = r.updated_at || r.created_at || r.issue_date || null;
      if (ref && (fromD || toD)) {
        const d = new Date(ref);
        if (fromD && d < fromD) dateOk = false;
        if (toD && d > toD) dateOk = false;
      }

      let qOk = true;
      if (q) {
        const pid = String(r.prescription_number || "").toLowerCase();
        const pname = String(r._patient_name || "").toLowerCase();
        qOk = pid.includes(q) || pname.includes(q);
      }

      return statusOk && dateOk && qOk;
    });
  }

  async function render(list) {
    if (!tbody) return;
    tbody.innerHTML = "";

    for (const r of list) {
      const tr = document.createElement("tr");

      const patientName = await getPatientName(r.patient_id);
      r._patient_name = patientName;

      // Medication column: show pharmacy (where dispensed) if backend provides it
      const medText = r.medication_summary || r.medication || "";
      const where = r.last_dispensed_at_pharmacy || r.dispensed_at_pharmacy || "";
      const medHtml = `
        <div>${medText || "-"}</div>
        ${where ? `<small style="color:#6b7280;">Dispensed at: ${where}</small>` : ""}
      `;

      tr.innerHTML = `
        <td>${r.prescription_number || ""}</td>
        <td>${patientName}</td>
        <td>${medHtml}</td>
        <td>${fmtDate(r.updated_at || r.created_at || r.issue_date)}</td>
        <td>${statusPill(r.status)}</td>
        <td><button class="btn-chip" type="button" data-share="${r.prescription_id}">Send</button></td>
      `;
      tbody.appendChild(tr);
    }
  }

  async function load() {
    try {
      const resp = await RX.api.get("/clinicians/me/prescriptions");
      all = resp.prescriptions || [];
      await render(applyFilters(all));
    } catch (err) {
      alert(
        (err.message || "Failed to load prescriptions") +
          "\n\nExpected endpoint: GET /clinicians/me/prescriptions"
      );
    }
  }

  // Hook UI
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      await render(applyFilters(all));
    });
  }
  if (searchInput) searchInput.addEventListener("input", async () => await render(applyFilters(all)));
  if (statusSelect) statusSelect.addEventListener("change", async () => await render(applyFilters(all)));
  dateInputs?.forEach((inp) => inp.addEventListener("change", async () => await render(applyFilters(all))));

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      // Keep your existing clear script, but also rerender
      setTimeout(async () => await render(all), 0);
    });
  }

  // Send button action (tries backend share endpoint if available)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-share]");
    if (!btn) return;

    const id = btn.getAttribute("data-share");
    try {
      // Preferred if backend supports it:
      // POST /prescriptions/<id>/share  -> returns sms_text, code, etc.
      const resp = await RX.api.post(`/prescriptions/${id}/share`, { send_email: true, send_to_chobham: true });
      alert(resp.sms_text ? `Prepared message:\n\n${resp.sms_text}` : "Share prepared.");
    } catch (err) {
      alert(
        "Send action failed.\nIf your backend does not have /prescriptions/<id>/share yet, add it.\n\n" +
          (err.message || "")
      );
    }
  });

  await load();
});