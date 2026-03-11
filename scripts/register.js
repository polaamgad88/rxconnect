// ./scripts/register.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const userTypeSelect = document.getElementById("userType");
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusBox = document.getElementById("registerStatus");

  const sections = {
    chobham: document.getElementById("chobhamFields"),
    clinic: document.getElementById("clinicFields"),
    prescriber: document.getElementById("prescriberFields"),
    pharmacist: document.getElementById("pharmacistFields"),
  };

  const requiredFieldsByRole = {
    chobham: [],
    clinic: ["clinicRegisterName"],
    prescriber: ["licenseNumber"],
    pharmacist: ["pharmacyName"],
  };

  const fileFieldsByRole = {
    clinic: document.getElementById("clinicVerificationFiles"),
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

    if (role === "clinic" || role === "prescriber") {
      setStatus(
        "This registration will be created in pending status until approved. Please upload your verification files before submitting.",
        "info",
      );
      return;
    }

    if (role === "pharmacist") {
      setStatus(
        "Pharmacist registration creates a dispenser account and login user.",
        "info",
      );
      return;
    }

    if (role === "chobham") {
      setStatus(
        "Chobham registration creates a direct Chobham login user.",
        "info",
      );
      return;
    }

    setStatus("", "");
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
      const err = new Error(
        data?.message || `Request failed (${response.status})`,
      );
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
        const err = new Error(
          data?.message || `File upload failed for ${file.name}`,
        );
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
        const label =
          file.original_name || file.filename || `document_${index + 1}`;
        const target = file.url || file.filename || "";
        parts.push(`- ${label}: ${target}`);
      });
    }

    return parts.join("\n");
  }

  userTypeSelect?.addEventListener("change", toggleRoleFields);
  toggleRoleFields();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setStatus("", "");

    const userType = valueOf("userType");
    const full_name = valueOf("fullName");
    const email = valueOf("email");
    const phone = valueOf("phone");
    const password = byId("password")?.value || "";

    if (!userType || !full_name || !email || !password) {
      setStatus("Please fill role, full name, email, and password.", "error");
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

        const resp = await apiPostJSON("/chobham/register", payload, {
          auth: false,
        });

        setStatus(
          `Chobham account created successfully. User #${resp.user_id}. Redirecting to login...`,
          "success",
        );

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);

        return;
      }

      if (userType === "clinic") {
        const clinic_name = valueOf("clinicRegisterName");
        const license_number = valueOf("clinicLicense");
        const address = valueOf("clinicAddress");
        const uploadedFiles = await uploadVerificationFiles(
          fileFieldsByRole.clinic?.files,
          "clinic_verification",
        );

        if (!clinic_name) {
          throw new Error("Clinic name is required.");
        }

        const payload = {
          clinic_name,
          license_number: license_number || null,
          address: address || null,
          phone: phone || null,
          email,
          username: email,
          full_name,
          password,
          verification_files: uploadedFiles,
          request_notes: buildRequestNotes(
            null,
            uploadedFiles,
            "Clinic verification files:",
          ),
        };

        const resp = await apiPostJSON("/clinics/register", payload, {
          auth: false,
        });

        setStatus(
          `Clinic registration submitted successfully. Approval request #${resp.approval_request_id}. Redirecting to login...`,
          "success",
        );

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);

        return;
      }

      if (userType === "prescriber") {
        const license_number = valueOf("licenseNumber");
        const specialty = valueOf("specialization");
        const clinicName = valueOf("clinicName");
        const uploadedFiles = await uploadVerificationFiles(
          fileFieldsByRole.prescriber?.files,
          "clinician_verification",
        );

        if (!license_number) {
          throw new Error("Medical license number is required.");
        }

        const payload = {
          email,
          username: email,
          full_name,
          phone: phone || null,
          password,
          professional_license_no: license_number,
          license_number,
          specialty: specialty || null,
          request_notes: buildRequestNotes(
            clinicName ? `Requested clinic: ${clinicName}` : null,
            uploadedFiles,
            "Clinician verification files:",
          ),
          requested_clinic_name: clinicName || null,
          verification_files: uploadedFiles,
        };

        const resp = await apiPostJSON("/clinicians/register", payload, {
          auth: false,
        });

        setStatus(
          `Prescriber registration submitted successfully. Approval request #${resp.approval_request_id}. Redirecting to login...`,
          "success",
        );

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);

        return;
      }

      if (userType === "pharmacist") {
        const pharmacy_name = valueOf("pharmacyName");
        const license_number = valueOf("pharmacyLicense");
        const address = valueOf("pharmacyAddress");

        if (!pharmacy_name) {
          throw new Error("Pharmacy name is required.");
        }

        const payload = {
          pharmacy_name,
          license_number: license_number || null,
          address: address || null,
          phone: phone || null,
          email,
          username: email,
          full_name: full_name || pharmacy_name,
          password,
        };

        const resp = await apiPostJSON("/dispensers/register", payload, {
          auth: false,
        });

        setStatus(
          `Pharmacist registration completed successfully. Dispenser #${resp.dispenser_id}. Redirecting to login...`,
          "success",
        );

        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);

        return;
      }

      throw new Error("Unsupported user type.");
    } catch (err) {
      const apiMessage =
        err?.data?.message || err?.message || "Registration failed";
      setStatus(apiMessage, "error");
    } finally {
      setSubmitting(false);
    }
  });
});
