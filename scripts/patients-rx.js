// scripts/patients-rx.js
document.addEventListener("DOMContentLoaded", async function () {
  const user = RX.requireAuth(["clinician", "clinic"]);
  if (!user) return;

  const tbody = document.querySelector(".patients-table tbody");
  const searchInput = document.getElementById("patientsSearchInput");
  const clearBtn = document.getElementById("patientsClearBtn");
  const addBtn = document.querySelector(".patients-actions button.patients-btn"); // first button: ADD PATIENT

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "./create-patient.html";
    });
  }

  let allPatients = [];

  function formatDob(dobStr) {
    if (!dobStr) return "";
    const parts = String(dobStr).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dobStr;
  }

  function render(list) {
    if (!tbody) return;
    tbody.innerHTML = "";

    list.forEach((p) => {
      const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${name}</td>
        <td>${p.gender || ""}</td>
        <td>${p.email || ""}</td>
        <td>${formatDob(p.date_of_birth)}</td>
        <td>${(p.notes || "").replace(/^Address:\\s*/i, "")}</td>
      `;
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        sessionStorage.setItem("rx_selected_patient_id", String(p.patient_id));
        window.location.href = "./patient-history.html";
      });
      tbody.appendChild(tr);
    });
  }

  function applyFilter() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) return render(allPatients);

    const filtered = allPatients.filter((p) => {
      const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.national_id || "").toLowerCase().includes(q) ||
        String(p.patient_id || "").includes(q)
      );
    });
    render(filtered);
  }

  if (searchInput) searchInput.addEventListener("input", applyFilter);
  if (clearBtn) clearBtn.addEventListener("click", () => { if (searchInput) searchInput.value = ""; render(allPatients); });

  try {
    const resp = await RX.api.get("/patients");
    allPatients = resp.patients || [];
    render(allPatients);
  } catch (err) {
    alert(err.message || "Failed to load patients");
  }
});