document.addEventListener("DOMContentLoaded", async () => {
  // Frontend access guard (management only)
  const u = RX.getUser();
  if (!RX.getToken() || !u) {
    window.location.href = "./login.html";
    return;
  }
  if (u.login_type !== "managment" || !u.is_admin) {
    alert("Management Admin only.");
    window.location.href = "./login.html";
    return;
  }

  // API base editor
  
  const apiBaseElValue = "http://localhost:5000";
  // saveApiBtn.addEventListener("click", () => {
  //   RX.setApiBase(apiBaseElValue.trim());
  //   alert("API base saved.");
  // });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    RX.clearSession();
    window.location.href = "./login.html";
  });

  // UI elements
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const clearBtn = document.getElementById("clearBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const countPill = document.getElementById("countPill");
  const tableBody = document.getElementById("tableBody");
  const emptyState = document.getElementById("emptyState");

  // Drawer elements
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const drawer = document.getElementById("drawer");
  const drawerClose = document.getElementById("drawerClose");

  const dId = document.getElementById("dId");
  const dType = document.getElementById("dType");
  const dSubmitted = document.getElementById("dSubmitted");
  const dRequester = document.getElementById("dRequester");
  const dEmail = document.getElementById("dEmail");
  const dClinic = document.getElementById("dClinic");
  const dClinLic = document.getElementById("dClinLic");
  const dSpec = document.getElementById("dSpec");
  const dReqClinic = document.getElementById("dReqClinic");
  const dReqNotes = document.getElementById("dReqNotes");

  const reviewNotes = document.getElementById("reviewNotes");
  const clinicOverrideWrap = document.getElementById("clinicOverrideWrap");
  const overrideClinicId = document.getElementById("overrideClinicId");

  const approveBtn = document.getElementById("approveBtn");
  const rejectBtn = document.getElementById("rejectBtn");

  let currentType = "clinic";      // clinic | clinician | all
  let currentView = "pending";     // pending | approved
  let rows = [];
  let activeRow = null;

  function fmtDate(x) {
    if (!x) return "-";
    const d = new Date(x);
    return isNaN(d.getTime()) ? String(x) : d.toLocaleString();
  }

  function badge(type) {
    const cls = type === "clinician" ? "clinician" : "clinic";
    return `<span class="badge ${cls}">${type.toUpperCase()}</span>`;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function setCount(n) {
    countPill.textContent = `${n} ${currentView}`;
  }

  function setEmptyText() {
    emptyState.textContent =
      currentView === "approved" ? "No approved requests." : "No pending approvals.";
  }

  function applySearch(list) {
    const q = (searchInput.value || "").trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) => {
      const hay = [
        r.approval_request_id,
        r.request_type,
        r.requester_full_name,
        r.requester_email,
        r.requester_username,
        r.clinic_name,
        r.requested_clinic_name,
        r.clinician_license_number,
        r.clinic_license_number,
        r.status,
        r.review_notes,
      ]
        .map((v) => String(v ?? "").toLowerCase())
        .join(" ");

      return hay.includes(q);
    });
  }

  function render(list) {
    tableBody.innerHTML = "";
    setEmptyText();
    emptyState.classList.add("hidden");

    if (!list.length) {
      emptyState.classList.remove("hidden");
      setCount(0);
      return;
    }

    setCount(list.length);

    list.forEach((r) => {
      const requester = esc(r.requester_full_name || r.requester_username || "-");
      const reqSub = esc(r.requester_email || "-");

      const entity =
        r.request_type === "clinic"
          ? `<div class="cell-title">${esc(r.clinic_name || "Clinic")}</div>
             <div class="cell-sub">License: ${esc(r.clinic_license_number || "-")}</div>`
          : `<div class="cell-title">${esc(r.requester_full_name || "Clinician")}</div>
             <div class="cell-sub">License: ${esc(r.clinician_license_number || r.requester_username || "-")}</div>`;

      const clinicLine =
        r.request_type === "clinician"
          ? `<div class="cell-sub">Requested clinic: ${esc(r.requested_clinic_name || r.clinic_name || "-")}</div>`
          : "";

      const notesSource =
        currentView === "approved"
          ? (r.review_notes || r.request_notes || "")
          : (r.request_notes || "");

      const notesPreview =
        esc(notesSource.slice(0, 60)) + (notesSource.length > 60 ? "…" : "");

      const actionsHtml =
        currentView === "pending"
          ? `
            <button class="small-btn approve" data-approve="${r.approval_request_id}">Approve</button>
            <button class="small-btn reject" data-reject="${r.approval_request_id}">Reject</button>
          `
          : `
            <button class="small-btn" data-open="${r.approval_request_id}">View</button>
          `;

      const submittedOrReviewed =
        currentView === "approved" && r.reviewed_at
          ? `<div class="cell-title">${fmtDate(r.reviewed_at)}</div>
             <div class="cell-sub">Reviewed</div>`
          : `<div class="cell-title">${fmtDate(r.submitted_at)}</div>`;

      const el = document.createElement("div");
      el.className = "tr";
      el.innerHTML = `
        <div>
          ${badge(r.request_type)}
          <div class="cell-sub">#${r.approval_request_id}</div>
          <div class="cell-sub">${esc(r.status || r.requester_approval_status || "")}</div>
        </div>

        <div>
          <div class="cell-title">${requester}</div>
          <div class="cell-sub">${reqSub}</div>
          <div class="cell-sub">username: ${esc(r.requester_username || "-")}</div>
        </div>

        <div>
          ${entity}
          ${clinicLine}
        </div>

        <div>
          ${submittedOrReviewed}
        </div>

        <div>
          <div class="cell-sub">${notesPreview || "-"}</div>
          <div class="cell-sub"><span class="link" data-open="${r.approval_request_id}">View details</span></div>
        </div>

        <div class="actions">
          ${actionsHtml}
        </div>
      `;

      tableBody.appendChild(el);
    });
  }

  async function loadPending() {
    currentView = "pending";
    const typeParam =
      currentType === "all" ? "" : `?type=${encodeURIComponent(currentType)}`;

    const resp = await RX.api.get(`/approvals/pending${typeParam}`);
    rows = Array.isArray(resp.pending) ? resp.pending : [];
    render(applySearch(rows));
  }

  async function loadApproved() {
    currentView = "approved";
    const typeParam =
      currentType === "all" ? "" : `?type=${encodeURIComponent(currentType)}`;

    const resp = await RX.api.get(`/approvals/approved${typeParam}`);
    rows = Array.isArray(resp.approved) ? resp.approved : [];
    render(applySearch(rows));
  }

  async function load() {
    if (currentView === "approved") {
      await loadApproved();
    } else {
      await loadPending();
    }
  }

  function openDrawer(row) {
    activeRow = row;

    dId.textContent = row.approval_request_id || "-";
    dType.textContent = row.request_type || "-";
    dSubmitted.textContent =
      currentView === "approved" && row.reviewed_at
        ? fmtDate(row.reviewed_at)
        : fmtDate(row.submitted_at);

    dRequester.textContent = row.requester_full_name || row.requester_username || "-";
    dEmail.textContent = row.requester_email || "-";

    dClinic.textContent = row.clinic_name
      ? `${row.clinic_name} (id: ${row.clinic_id ?? "-"})`
      : (row.clinic_id ? `Clinic id: ${row.clinic_id}` : "-");

    dClinLic.textContent = row.clinician_license_number || "-";
    dSpec.textContent = row.clinician_specialty || "-";

    dReqClinic.textContent = row.requested_clinic_name
      ? `${row.requested_clinic_name} (id: ${row.requested_clinic_id ?? row.clinic_id ?? "-"})`
      : (row.requested_clinic_id || row.clinic_id
          ? `Clinic id: ${row.requested_clinic_id ?? row.clinic_id}`
          : "-");

    dReqNotes.textContent =
      currentView === "approved"
        ? (row.review_notes || row.request_notes || "-")
        : (row.request_notes || "-");

    reviewNotes.value = "";
    overrideClinicId.value = "";

    if (currentView === "approved") {
      approveBtn.classList.add("hidden");
      rejectBtn.classList.add("hidden");
      reviewNotes.disabled = true;
      clinicOverrideWrap.classList.add("hidden");
    } else {
      approveBtn.classList.remove("hidden");
      rejectBtn.classList.remove("hidden");
      reviewNotes.disabled = false;

      if (row.request_type === "clinician") {
        clinicOverrideWrap.classList.remove("hidden");
      } else {
        clinicOverrideWrap.classList.add("hidden");
      }
    }

    drawerBackdrop.classList.remove("hidden");
    drawer.classList.remove("hidden");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    drawerBackdrop.classList.add("hidden");
    drawer.classList.add("hidden");
    drawer.setAttribute("aria-hidden", "true");
    activeRow = null;
  }

  drawerClose.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  async function doApprove(id) {
    const payload = { review_notes: reviewNotes.value.trim() || null };

    if (activeRow?.request_type === "clinician") {
      const cid = overrideClinicId.value.trim();
      if (cid) payload.clinic_id = Number(cid);
    }

    await RX.api.post(`/approvals/${id}/approve`, payload);
  }

  async function doReject(id) {
    const payload = { review_notes: reviewNotes.value.trim() || null };
    await RX.api.post(`/approvals/${id}/reject`, payload);
  }

  approveBtn.addEventListener("click", async () => {
    if (!activeRow) return;
    if (!confirm("Approve this request?")) return;

    try {
      await doApprove(activeRow.approval_request_id);
      closeDrawer();
      await load();
    } catch (e) {
      alert(e.message || "Approve failed");
    }
  });

  rejectBtn.addEventListener("click", async () => {
    if (!activeRow) return;
    if (!confirm("Reject this request?")) return;

    try {
      await doReject(activeRow.approval_request_id);
      closeDrawer();
      await load();
    } catch (e) {
      alert(e.message || "Reject failed");
    }
  });

  // Tabs - only one handler block
  tabs.forEach((t) => {
    t.addEventListener("click", async () => {
      try {
        tabs.forEach((x) => x.classList.remove("active"));
        t.classList.add("active");

        const tabType = t.dataset.type;

        if (tabType === "approved_clinics") {
          currentType = "clinic";
          currentView = "approved";
          await loadApproved();
          return;
        }

        if (tabType === "approved_clinicians") {
          currentType = "clinician";
          currentView = "approved";
          await loadApproved();
          return;
        }

        currentType = tabType; // clinic | clinician | all
        currentView = "pending";
        await loadPending();
      } catch (e) {
        alert(e.message || "Failed to load tab");
      }
    });
  });

  // Search
  searchBtn.addEventListener("click", () => render(applySearch(rows)));
  searchInput.addEventListener("input", () => render(applySearch(rows)));
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    render(rows);
  });

  // Refresh
  refreshBtn.addEventListener("click", async () => {
    try {
      await load();
    } catch (e) {
      alert(e.message || "Refresh failed");
    }
  });

  // Row actions
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) {
      const id = Number(open.getAttribute("data-open"));
      const row = rows.find((r) => Number(r.approval_request_id) === id);
      if (row) openDrawer(row);
      return;
    }

    const ap = e.target.closest("[data-approve]");
    const rj = e.target.closest("[data-reject]");
    if (!ap && !rj) return;

    const id = Number((ap || rj).getAttribute(ap ? "data-approve" : "data-reject"));
    const row = rows.find((r) => Number(r.approval_request_id) === id);
    if (!row) return;

    openDrawer(row);
  });

  // Initial load
  await loadPending();
});