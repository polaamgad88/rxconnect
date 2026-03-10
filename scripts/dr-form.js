// scripts/dr-form-rx.js
document.addEventListener("DOMContentLoaded", async function () {
  const user = RX.requireAuth(["clinician"]);
  if (!user) return;

  // ---------- Patient selection ----------
  const patientSearchInput = document.querySelector(".cnp-card-patient .cnp-input-icon input");
  const patientSummary = document.querySelector(".cnp-patient-summary");
  const addPatientLink = document.querySelector(".js-add-patient-link");

  const modal = document.getElementById("cnp-add-patient-modal");
  const modalClose = document.getElementById("cnp-add-patient-close");
  const modalSubmit = document.querySelector(".cnp-ap-submit");

  let patients = [];
  let selectedPatient = null;

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

  function renderPatientSummary(p) {
    if (!patientSummary) return;
    if (!p) {
      patientSummary.innerHTML = `
        <p class="cnp-patient-name">No patient selected</p>
        <p class="rx-muted">Search and select a patient</p>
      `;
      return;
    }

    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    const age = calcAge(p.date_of_birth);
    const addr = (p.notes || "").replace(/^Address:\s*/i, "");

    patientSummary.innerHTML = `
      <p class="cnp-patient-name">${name}</p>
      <p>${age ? `${age} years – ` : ""}${p.date_of_birth || ""}</p>
      <p>Gender: ${p.gender || "-"}</p>

      <p><strong>Address:</strong> ${addr || "-"}</p>
      <p><strong>Contact:</strong> ${p.phone || "-"}</p>
      <p><strong>Phone:</strong> ${p.phone || "-"}</p>
      <p><strong>Email:</strong> ${p.email || "-"}</p>
      <p><strong>NHS Number:</strong> ${p.national_id || "-"}</p>
    `;
  }

  async function loadPatients() {
    const resp = await RX.api.get("/patients");
    patients = resp.patients || [];
  }

  // Dropdown under patient search
  function ensureDropdown() {
    if (!patientSearchInput) return null;
    let dd = patientSearchInput.parentElement.querySelector(".rx-patient-dd");
    if (dd) return dd;

    dd = document.createElement("div");
    dd.className = "rx-patient-dd";
    dd.style.position = "absolute";
    dd.style.left = "0";
    dd.style.right = "0";
    dd.style.top = "44px";
    dd.style.background = "#fff";
    dd.style.border = "1px solid #e5e7eb";
    dd.style.borderRadius = "8px";
    dd.style.boxShadow = "0 10px 20px rgba(0,0,0,.08)";
    dd.style.zIndex = "9999";
    dd.style.maxHeight = "260px";
    dd.style.overflow = "auto";
    dd.style.display = "none";

    patientSearchInput.parentElement.style.position = "relative";
    patientSearchInput.parentElement.appendChild(dd);
    return dd;
  }

  function hideDropdown() {
    const dd = patientSearchInput?.parentElement?.querySelector(".rx-patient-dd");
    if (dd) dd.style.display = "none";
  }

  function showDropdown(list) {
    const dd = ensureDropdown();
    if (!dd) return;

    dd.innerHTML = "";
    if (!list.length) {
      const item = document.createElement("div");
      item.style.padding = "10px 12px";
      item.textContent = "No matches";
      dd.appendChild(item);
      dd.style.display = "block";
      return;
    }

    list.forEach((p) => {
      const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      const item = document.createElement("div");
      item.style.padding = "10px 12px";
      item.style.cursor = "pointer";
      item.innerHTML = `<strong>${name}</strong><br><small>${p.date_of_birth || ""} • ${p.email || ""}</small>`;
      item.addEventListener("click", () => {
        selectedPatient = p;
        sessionStorage.setItem("rx_selected_patient_id", String(p.patient_id));
        patientSearchInput.value = name;
        renderPatientSummary(p);
        dd.style.display = "none";
      });
      dd.appendChild(item);
    });

    dd.style.display = "block";
  }

  function filterPatients(q) {
    const s = (q || "").trim().toLowerCase();
    if (!s) return patients.slice(0, 12);
    return patients
      .filter((p) => {
        const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
        return (
          name.includes(s) ||
          (p.email || "").toLowerCase().includes(s) ||
          (p.national_id || "").toLowerCase().includes(s) ||
          String(p.patient_id || "").includes(s)
        );
      })
      .slice(0, 12);
  }

  // Init patients + preselect
  try {
    await loadPatients();
    const preId = sessionStorage.getItem("rx_selected_patient_id");
    if (preId) {
      selectedPatient = patients.find((p) => String(p.patient_id) === String(preId)) || null;
      if (selectedPatient && patientSearchInput) {
        patientSearchInput.value = `${selectedPatient.first_name} ${selectedPatient.last_name}`.trim();
      }
    }
  } catch {}
  renderPatientSummary(selectedPatient);

  if (patientSearchInput) {
    patientSearchInput.addEventListener("input", () => {
      showDropdown(filterPatients(patientSearchInput.value));
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".cnp-card-patient")) hideDropdown();
    });
  }

  // ---------- Add Patient modal ----------
  function openModal() {
    if (!modal) return;
    modal.style.display = "block";
  }
  function closeModal() {
    if (!modal) return;
    modal.style.display = "none";
  }

  if (addPatientLink) {
    addPatientLink.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }
  if (modalClose) modalClose.addEventListener("click", closeModal);

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

  if (modalSubmit) {
    modalSubmit.addEventListener("click", async () => {
      const { inputs, selects } = modalInputs();
      // Based on current modal layout order in your HTML
      const first_name = (inputs[0]?.value || "").trim();
      const last_name = (inputs[1]?.value || "").trim();
      const gender = selects[0]?.value || null;
      const phone = (inputs[2]?.value || "").trim();
      const email = (inputs[3]?.value || "").trim();
      const national_id = (inputs[4]?.value || "").trim();

      const dd = (inputs[5]?.value || "").trim();
      const mm = (inputs[6]?.value || "").trim();
      const yy = (inputs[7]?.value || "").trim();
      const date_of_birth = buildDob(dd, mm, yy);

      const addr1 = (inputs[8]?.value || "").trim();
      const addr2 = (inputs[9]?.value || "").trim();
      const city = (inputs[10]?.value || "").trim();
      const postcode = (inputs[11]?.value || "").trim();
      const country = selects[1]?.value || "";

      if (!first_name || !last_name || !date_of_birth) {
        alert("First name, last name, and date of birth are required.");
        return;
      }

      const notesParts = [];
      if (addr1) notesParts.push(addr1);
      if (addr2) notesParts.push(addr2);
      if (city) notesParts.push(city);
      if (postcode) notesParts.push(postcode);
      if (country) notesParts.push(country);
      const notes = notesParts.length ? `Address: ${notesParts.join(", ")}` : null;

      try {
        const resp = await RX.api.post("/patients/create", {
          first_name,
          last_name,
          date_of_birth,
          gender: gender ? gender.toLowerCase() : null,
          phone,
          email,
          national_id,
          notes,
        });

        await loadPatients();
        selectedPatient = patients.find((p) => String(p.patient_id) === String(resp.patient_id)) || null;

        if (selectedPatient && patientSearchInput) {
          patientSearchInput.value = `${selectedPatient.first_name} ${selectedPatient.last_name}`.trim();
          sessionStorage.setItem("rx_selected_patient_id", String(selectedPatient.patient_id));
        }
        renderPatientSummary(selectedPatient);
        closeModal();
        alert("Patient created and selected.");
      } catch (err) {
        alert(err.message || "Failed to create patient");
      }
    });
  }

  // ---------- Medicines -> prescription create ----------
  const notesEl = document.getElementById("prescription-notes");
  const issueBtn = document.querySelector(".cnp-card-actions .cnp-actions-right .cnp-btn-primary");
  const dropBtn = document.querySelector(".cnp-card-actions .cnp-actions-right .cnp-btn-dropdown");

  // Medication cache
  let medIndexLoaded = false;
  const medNameToId = new Map();

  async function loadMedicationIndexOnce() {
    if (medIndexLoaded) return;
    medIndexLoaded = true;

    try {
      const resp = await RX.api.get("/medications", { auth: false }); // if your endpoint requires auth, remove auth:false
      const list = resp.medications || resp.meds || [];
      list.forEach((m) => {
        const name = String(m.medication_name || "").trim().toLowerCase();
        if (name && m.medication_id && !medNameToId.has(name)) {
          medNameToId.set(name, m.medication_id);
        }
      });
    } catch {
      // ok if it fails, we'll create meds on demand
    }
  }

  // async function resolveMedicationIdByName(name) {
  //   const key = String(name || "").trim().toLowerCase();
  //   if (!key) return null;

  //   await loadMedicationIndexOnce();
  //   if (medNameToId.has(key)) return medNameToId.get(key);

  //   // Create dummy medication
  //   const created = await RX.api.post("/medications/create", { medication_name: name }, { auth: false });
  //   const id = created.medication_id;
  //   if (id) medNameToId.set(key, id);
  //   return id;
  // }

  function collectItemsFromTable() {
    const tbody = document.getElementById("meds-body");
    if (!tbody) return [];

    // Find all medicine-name inputs and use their row to find dosage + qty
    const nameInputs = Array.from(tbody.querySelectorAll("input.med-input-medicine-search"));

    const items = [];
    for (const nameInput of nameInputs) {
      const tr = nameInput.closest("tr") || nameInput.parentElement;
      const name = (nameInput.value || "").trim();
      if (!name) continue;

      const qtyInput =
        tr?.querySelector("input.med-input-qty") ||
        tr?.querySelector("input[placeholder='Qty']");

      const dosageInput =
        tr?.querySelector("input.med-input:not(.med-input-medicine-search):not(.med-input-qty)") ||
        tr?.querySelector("input[placeholder='Dosage Instruction']");

      const qty = Number((qtyInput?.value || "").trim() || 0);
      if (!qty || qty <= 0) continue;

      items.push({
        medication_name: name,
        dosage_instructions: (dosageInput?.value || "").trim() || null,
        quantity_prescribed: qty,
        unit: "unit",
        duration_days: null,
        refills_allowed: 0,
        notes: null,
      });
    }
    return items;
  }

  async function sendMail({ toEmail, content, sender = "RxConnect", number = "" }) {
    const fd = new FormData();
    fd.append("email", toEmail);
    fd.append("content", content);
    fd.append("sender", sender);
    fd.append("number", number);

    const res = await fetch(`${RX.API_BASE}/send-mail`, { method: "POST", body: fd });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Failed to send email");
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

  async function createPrescriptionAndMaybeSend(sendMode) {
    if (!selectedPatient) {
      alert("Select a patient first.");
      return;
    }

    const rawItems = collectItemsFromTable();
    if (!rawItems.length) {
      alert("Add at least one medicine row (name + quantity).");
      return;
    }

    // Convert medication_name -> medication_id
    const items = [];
    // for (const it of rawItems) {
    //   const medication_id = await resolveMedicationIdByName(it.medication_name);
    //   if (!medication_id) {
    //     alert(`Could not resolve medication id for: ${it.medication_name}`);
    //     return;
    //   }
    //   items.push({
    //     medication_id,
    //     dosage_instructions: it.dosage_instructions,
    //     quantity_prescribed: it.quantity_prescribed,
    //     unit: it.unit,
    //     duration_days: it.duration_days,
    //     refills_allowed: it.refills_allowed,
    //     notes: it.notes,
    //   });
    // }

    const payload = {
      patient_id: selectedPatient.patient_id,
      diagnosis: null,
      notes: (notesEl?.value || "").trim() || null,
      items,
    };

    try {
      const created = await RX.api.post("/prescriptions/create", payload);
      const code = created.code || "(code not returned)";
      const msg = buildPatientMessage(code);

      // Default: show message always
      alert(`Prescription created.\n\nCode: ${code}`);

      if (sendMode === "patient") {
        if (!selectedPatient.email) {
          alert("Patient has no email. Copy this message manually:\n\n" + msg);
        } else {
          await sendMail({
            toEmail: selectedPatient.email,
            content: msg,
            sender: "RxConnect",
            number: selectedPatient.phone || "",
          });
          alert("Email sent to patient.\n\n" + msg);
        }
      }

      if (sendMode === "chobham") {
        let chobhamEmail = localStorage.getItem("RX_CHOBHAM_EMAIL") || "";
        if (!chobhamEmail) {
          chobhamEmail = prompt("Enter Chobham Pharmacy email (saved for next time):") || "";
          if (chobhamEmail) localStorage.setItem("RX_CHOBHAM_EMAIL", chobhamEmail);
        }
        if (!chobhamEmail) {
          alert("No Chobham email provided. Code is:\n\n" + code);
        } else {
          await sendMail({
            toEmail: chobhamEmail,
            content: `New prescription issued.\nCode: ${code}\nPatient DOB: ${selectedPatient.date_of_birth || ""}`,
            sender: "RxConnect",
            number: selectedPatient.phone || "",
          });
          alert("Sent to Chobham Pharmacy.\n\nCode: " + code);
        }
      }

      // Go to tracker
      window.location.href = "./prescriptions.html";
    } catch (err) {
      alert(err.message || "Failed to create prescription");
    }
  }

  // Dropdown menu for send mode
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
        Issue + Email Patient
      </button>
      <button type="button" data-mode="chobham" style="display:block;width:100%;text-align:left;padding:10px;border:0;background:transparent;cursor:pointer;">
        Issue + Send to Chobham
      </button>
      <button type="button" data-mode="none" style="display:block;width:100%;text-align:left;padding:10px;border:0;background:transparent;cursor:pointer;">
        Issue Only (no send)
      </button>
    `;

    const holder = dropBtn.parentElement;
    holder.style.position = "relative";
    holder.appendChild(menu);

    menu.addEventListener("click", async (e) => {
      const b = e.target.closest("button[data-mode]");
      if (!b) return;
      menu.style.display = "none";
      await createPrescriptionAndMaybeSend(b.dataset.mode);
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#rxIssueMenu") && !e.target.closest(".cnp-btn-dropdown")) {
        menu.style.display = "none";
      }
    });

    return menu;
  }

  if (issueBtn) {
    issueBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Default behaviour: issue only
      await createPrescriptionAndMaybeSend("none");
    });
  }

  if (dropBtn) {
    const menu = ensureIssueMenu();
    dropBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!menu) return;
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    });
  }
});