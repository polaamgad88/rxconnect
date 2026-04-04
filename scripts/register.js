// ./scripts/register.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const userTypeSelect = document.getElementById("userType");
  const associationTypeSelect = document.getElementById("associationType");
  const clinicAssociationFields = document.getElementById("clinicAssociationFields");
  const clinicSelect = document.getElementById("clinicSelect");
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusBox = document.getElementById("registerStatus");

  const sections = {
    chobham: document.getElementById("chobhamFields"),
    prescriber: document.getElementById("prescriberFields"),
  };

  const requiredFieldsByRole = {
    chobham: [],
    prescriber: ["licenseNumber"],
  };

  const fileFieldsByRole = {
    prescriber: document.getElementById("prescriberVerificationFiles"),
  };

  const API_BASE = String(window.RXCONNECT_API_BASE || "").replace(/\/+$/, "");

  function byId(id) {
    return document.getElementById(id);
  }

  function valueOf(id) {
    return (byId(id)?.value || "").trim();
  }

  function setStatus(message, type = "") {
    if (!statusBox) return;
    statusBox.textContent = message || "";
    statusBox.className = `register-status ${type}`.trim();
    statusBox.style.display = message ? "block" : "none";
  }

  function notify(type, title, message) {
    if (window.RxToast && typeof window.RxToast[type] === "function") {
      window.RxToast[type](title, message);
      return;
    }
    setStatus(message || title, type === "error" ? "error" : type === "success" ? "success" : "info");
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Submitting..." : "Register";
  }

  function clearDynamicRequirements() {
    Object.values(requiredFieldsByRole)
      .flat()
      .forEach((fieldId) => {
        const el = byId(fieldId);
        if (el) el.required = false;
      });

    if (clinicSelect) clinicSelect.required = false;
  }

  function toggleAssociationFields() {
    const associationType = associationTypeSelect?.value || "independent";
    const showClinic = associationType === "clinic";

    if (clinicAssociationFields) {
      clinicAssociationFields.classList.toggle("hidden", !showClinic);
    }

    if (clinicSelect) {
      clinicSelect.required = showClinic;
      if (!showClinic) clinicSelect.value = "";
    }
  }

  function toggleRoleFields() {
    const role = valueOf("userType");

    Object.values(sections).forEach((section) => {
      if (section) section.classList.add("hidden");
    });

    clearDynamicRequirements();

    const activeSection = sections[role];
    if (activeSection) activeSection.classList.remove("hidden");

    (requiredFieldsByRole[role] || []).forEach((fieldId) => {
      const el = byId(fieldId);
      if (el) el.required = true;
    });

    if (role === "prescriber") {
      toggleAssociationFields();
      setStatus(
        "This registration will be created in pending status until approved. If the doctor selects a clinic, that clinic admin will approve it. Otherwise management will approve it.",
        "info"
      );
      return;
    }

    if (role === "chobham") {
      setStatus("Chobham registration creates a direct Chobham login user.", "info");
      return;
    }

    setStatus("", "");
  }

  async function apiGet(path, options = {}) {
    const auth = options.auth !== false;

    if (window.RX?.api?.get) {
      return window.RX.api.get(path, { auth });
    }

    const headers = {};
    if (auth) {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token");

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error(data?.message || `Request failed (${response.status})`);
      err.data = data;
      throw err;
    }

    return data;
  }

  async function apiPostJSON(path, payload, options = {}) {
    const auth = options.auth !== false;

    if (window.RX?.api?.post) {
      return window.RX.api.post(path, payload, { auth });
    }

    const headers = {
      "Content-Type": "application/json",
    };

    if (auth) {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token");

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(data?.message || `Request failed (${response.status})`);
      err.data = data;
      throw err;
    }

    return data;
  }

  async function uploadVerificationFiles(fileList, docTypePrefix) {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return [];

    const uploaded = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", `${docTypePrefix}_${i + 1}`);

      const response = await fetch(`${API_BASE}/verification/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const err = new Error(data?.message || `File upload failed for ${file.name}`);
        err.data = data;
        throw err;
      }

      uploaded.push({
        filename: data.filename || file.name,
        url: data.url ? new URL(data.url, `${API_BASE}/`).toString() : null,
        doc_type: `${docTypePrefix}_${i + 1}`,
        original_name: file.name,
      });
    }

    return uploaded;
  }

  function buildRequestNotes(existingNotes, uploadedFiles, fallbackHeading) {
    const parts = [];
    const cleanExisting = (existingNotes || "").trim();

    if (cleanExisting) {
      parts.push(cleanExisting);
    }

    if (uploadedFiles?.length) {
      parts.push(fallbackHeading);
      uploadedFiles.forEach((file, index) => {
        const label = file.original_name || file.filename || `document_${index + 1}`;
        const target = file.url || file.filename || "";
        parts.push(`- ${label}: ${target}`);
      });
    }

    return parts.join("\n");
  }

  async function loadApprovedClinics() {
    if (!clinicSelect) return;

    try {
      clinicSelect.innerHTML = `<option value="">Loading approved clinics...</option>`;
      const resp = await apiGet("/clinics/public-approved", { auth: false });
      const clinics = Array.isArray(resp?.clinics) ? resp.clinics : [];

      clinicSelect.innerHTML = `<option value="">Select Approved Clinic</option>`;

      clinics.forEach((clinic) => {
        const option = document.createElement("option");
        option.value = String(clinic.clinic_id);
        option.textContent = clinic.clinic_name;
        clinicSelect.appendChild(option);
      });

      if (!clinics.length) {
        clinicSelect.innerHTML = `<option value="">No approved clinics found</option>`;
      }
    } catch (err) {
      clinicSelect.innerHTML = `<option value="">Failed to load clinics</option>`;
      notify("warn", "Clinics unavailable", "Could not load approved clinics right now.");
    }
  }

  userTypeSelect?.addEventListener("change", toggleRoleFields);
  associationTypeSelect?.addEventListener("change", toggleAssociationFields);

  toggleRoleFields();
  loadApprovedClinics();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setStatus("", "");

    const userType = valueOf("userType");
    const full_name = valueOf("fullName");
    const email = valueOf("email");
    const phone = valueOf("phone");
    const password = byId("password")?.value || "";

    if (!userType || !full_name || !email || !password) {
      notify("error", "Missing fields", "Please fill role, full name, email, and password.");
      return;
    }

    setSubmitting(true);

    try {
      if (userType === "chobham") {
        const payload = {
          email,
          username: email,
          full_name,
          phone: phone || null,
          password,
        };

        const resp = await apiPostJSON("/chobham/register", payload, { auth: false });

        notify("success", "Registration completed", `Chobham account created. User #${resp.user_id}. Redirecting to login...`);
        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);
        return;
      }

      if (userType === "prescriber") {
        const license_number = valueOf("licenseNumber");
        const specialty = valueOf("specialization");
        const association_type = associationTypeSelect?.value || "independent";
        const selectedClinicId = clinicSelect?.value || "";
        const uploadedFiles = await uploadVerificationFiles(
          fileFieldsByRole.prescriber?.files,
          "clinician_verification"
        );

        if (!license_number) {
          throw new Error("Medical license number is required.");
        }

        if (association_type === "clinic" && !selectedClinicId) {
          throw new Error("Please select an approved clinic.");
        }

        const requestLead =
          association_type === "clinic"
            ? `Requested clinic id: ${selectedClinicId}`
            : "Independent clinician registration";

        const payload = {
          email,
          username: email,
          full_name,
          phone: phone || null,
          password,
          professional_license_no: license_number,
          license_number,
          specialty: specialty || null,
          association_type,
          requested_clinic_id: association_type === "clinic" ? Number(selectedClinicId) : null,
          request_notes: buildRequestNotes(
            requestLead,
            uploadedFiles,
            "Clinician verification files:"
          ),
          verification_files: uploadedFiles,
        };

        const resp = await apiPostJSON("/clinicians/register", payload, { auth: false });

        notify(
          "success",
          "Registration submitted",
          `Doctor registration submitted successfully. Approval request #${resp.approval_request_id}. Redirecting to login...`
        );

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1400);
        return;
      }
    } catch (err) {
      const apiMessage = err?.data?.message || err?.message || "Registration failed";
      notify("error", "Registration failed", apiMessage);
    } finally {
      setSubmitting(false);
    }
  });
});