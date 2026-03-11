// ./scripts/myprofile.js
document.addEventListener("DOMContentLoaded", () => {
  const RX = window.RX;

  function byId(id) {
    return document.getElementById(id);
  }

  function setValue(id, value) {
    const el = byId(id);
    if (!el) return;
    el.value = value == null ? "" : String(value);
  }

  function setReadOnly(id, readOnly = true, placeholder = "") {
    const el = byId(id);
    if (!el) return;
    el.readOnly = readOnly;
    el.disabled = readOnly && el.tagName === "SELECT";
    if (readOnly) {
      el.style.backgroundColor = "#f5f5f5";
      el.style.cursor = "not-allowed";
      if (placeholder && !el.value) el.placeholder = placeholder;
    }
  }

  function splitName(fullName) {
    const clean = String(fullName || "").trim();
    if (!clean) return { firstName: "", lastName: "" };

    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "" };
    }

    return {
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts.slice(-1).join(""),
    };
  }

  function joinName(firstName, lastName) {
    return [String(firstName || "").trim(), String(lastName || "").trim()]
      .filter(Boolean)
      .join(" ");
  }

  function splitAddress(address) {
    const raw = String(address || "").trim();
    if (!raw) {
      return { line1: "", line2: "", city: "", postcode: "" };
    }

    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 1) {
      return { line1: parts[0], line2: "", city: "", postcode: "" };
    }

    if (parts.length === 2) {
      return { line1: parts[0], line2: "", city: parts[1], postcode: "" };
    }

    if (parts.length === 3) {
      return { line1: parts[0], line2: "", city: parts[1], postcode: parts[2] };
    }

    return {
      line1: parts[0],
      line2: parts.slice(1, -2).join(", "),
      city: parts[parts.length - 2],
      postcode: parts[parts.length - 1],
    };
  }

  function buildAddress({ line1, line2, city, postcode }) {
    return [line1, line2, city, postcode]
      .map((v) => String(v || "").trim())
      .filter(Boolean)
      .join(", ");
  }

  function inferTitle(fullName) {
    const clean = String(fullName || "")
      .trim()
      .toLowerCase();
    if (clean.startsWith("dr ")) return "Dr.";
    if (clean.startsWith("mrs ")) return "Mrs.";
    if (clean.startsWith("ms ")) return "Ms.";
    return "Mr.";
  }

  function ensureStatusBox() {
    let box = document.getElementById("profileStatus");
    if (box) return box;

    box = document.createElement("div");
    box.id = "profileStatus";
    box.style.display = "none";
    box.style.margin = "12px 0 18px";
    box.style.padding = "12px 14px";
    box.style.borderRadius = "8px";
    box.style.fontSize = "14px";
    box.style.fontWeight = "600";
    box.style.border = "1px solid transparent";

    const header = document.querySelector(".profile-header");
    if (header && header.parentNode) {
      header.parentNode.insertBefore(box, header.nextSibling);
    }

    return box;
  }

  function showStatus(message, type = "info") {
    const box = ensureStatusBox();
    box.style.display = message ? "block" : "none";
    box.textContent = message || "";

    if (type === "error") {
      box.style.background = "#fff1f2";
      box.style.color = "#9f1239";
      box.style.borderColor = "#fecdd3";
      return;
    }

    if (type === "success") {
      box.style.background = "#f0fdf4";
      box.style.color = "#166534";
      box.style.borderColor = "#bbf7d0";
      return;
    }

    box.style.background = "#eff6ff";
    box.style.color = "#1d4ed8";
    box.style.borderColor = "#bfdbfe";
  }

  function clearStatus() {
    const box = document.getElementById("profileStatus");
    if (box) {
      box.style.display = "none";
      box.textContent = "";
    }
  }

  if (!RX) {
    showStatus("rxconnect.js is not loaded.", "error");
    return;
  }

  const token = RX.getToken();
  const sessionUser = RX.getUser();

  if (!token || !sessionUser) {
    window.location.href = "./login.html";
    return;
  }

  const saveBtn = document.querySelector(".profile-actions .btn-primary");
  const logoutLink =
    document.getElementById("logoutLink") ||
    document.querySelector('.user-dropdown-menu a[href="./login.html"]');

  let currentUser = null;
  let currentClinician = null;
  let currentClinic = null;

  async function loadProfile() {
    try {
      showStatus("Loading your profile...", "info");

      const meResponse = await RX.api.get("/users/me");
      currentUser = meResponse.user || null;

      if (!currentUser) {
        throw new Error("Profile data was not returned by the server.");
      }

      RX.setSession(RX.getToken(), {
        ...(RX.getUser() || {}),
        ...currentUser,
        name: currentUser.full_name || currentUser.username,
      });

      const { firstName, lastName } = splitName(currentUser.full_name || "");
      setValue("title", inferTitle(currentUser.full_name));
      setValue("firstName", firstName);
      setValue("lastName", lastName);
      setValue("email", currentUser.email || "");
      setValue("mobile", currentUser.phone || "");

      const greeting = document.querySelector(".user-trigger span");
      if (greeting) {
        greeting.textContent = `Hello, ${currentUser.full_name || currentUser.username || "User"}`;
      }

      if (currentUser.login_type === "clinician") {
        try {
          currentClinician = await RX.api.get("/clinicians/me");
        } catch (err) {
          console.warn("Could not load clinician profile:", err);
        }
      }

      setValue(
        "status",
        currentClinician?.specialty ||
          currentUser?.clinician?.specialty ||
          currentUser.login_type ||
          "",
      );

      setValue(
        "regNumber",
        currentClinician?.license_number ||
          currentUser?.clinician?.license_number ||
          currentUser.professional_license_no ||
          "",
      );

      setValue(
        "body",
        currentUser.login_type === "clinician"
          ? "Professional registration"
          : "",
      );
      setValue("cdPin", "");

      const clinicId =
        currentUser.clinic_id ||
        currentClinician?.clinic_id ||
        currentUser?.clinician?.clinic_id ||
        null;

      setValue("clinicId", clinicId || "");

      if (clinicId) {
        try {
          const clinicResponse = await RX.api.get(`/clinics/${clinicId}`);
          currentClinic = clinicResponse.clinic || null;
        } catch (err) {
          console.warn("Could not load clinic:", err);
        }
      }

      if (currentClinic) {
        const clinicAddress = splitAddress(currentClinic.address || "");
        setValue("clinicName", currentClinic.clinic_name || "");
        setValue("clinicAddr1", clinicAddress.line1);
        setValue("clinicAddr2", clinicAddress.line2);
        setValue("clinicCity", clinicAddress.city);
        setValue("clinicPostcode", clinicAddress.postcode);
        setValue("clinicPhone", currentClinic.phone || "");
        setValue("clinicEmail", currentClinic.email || "");
        setValue("vendorName", currentClinic.clinic_name || "");
        setValue("vendorEmail", currentClinic.email || "");
      } else {
        setValue("clinicName", "");
        setValue("clinicAddr1", "");
        setValue("clinicAddr2", "");
        setValue("clinicCity", "");
        setValue("clinicPostcode", "");
        setValue("clinicPhone", "");
        setValue("clinicEmail", "");
      }

      setValue("clinikoKey", "");
      setValue("smsNumber", currentUser.phone || "");

      [
        "addr1",
        "addr2",
        "city",
        "postcode",
        "status",
        "regNumber",
        "body",
        "cdPin",
        "clinicId",
        "clinikoKey",
        "vendorName",
        "vendorEmail",
        "smsNumber",
      ].forEach((id) =>
        setReadOnly(id, true, "Not available in current backend"),
      );

      showStatus("Profile loaded successfully.", "success");
      setTimeout(clearStatus, 1200);
    } catch (err) {
      console.error(err);

      if (
        err.status === 401 ||
        /Authentication error|Unauthorized|Missing Authorization/i.test(
          err.message || "",
        )
      ) {
        RX.clearSession();
        showStatus(
          "Your session is invalid or expired. Please log in again.",
          "error",
        );
        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1200);
        return;
      }

      showStatus(err.message || "Failed to load profile.", "error");
    }
  }

  async function saveProfile() {
    if (!currentUser) {
      showStatus("Profile is not loaded yet.", "error");
      return;
    }

    const firstName = (byId("firstName")?.value || "").trim();
    const lastName = (byId("lastName")?.value || "").trim();
    const email = (byId("email")?.value || "").trim();
    const phone = (byId("mobile")?.value || "").trim();
    const fullName = joinName(firstName, lastName);

    if (!fullName) {
      showStatus("Please enter first name and last name.", "error");
      return;
    }

    if (!email) {
      showStatus("Please enter an email address.", "error");
      return;
    }

    const userPayload = {};
    if ((currentUser.full_name || "") !== fullName)
      userPayload.full_name = fullName;
    if ((currentUser.email || "") !== email) userPayload.email = email;
    if ((currentUser.phone || "") !== phone) userPayload.phone = phone || null;

    const oldUsername = currentUser.username || "";
    const oldEmail = currentUser.email || "";
    if (email !== oldEmail && oldUsername && oldUsername === oldEmail) {
      userPayload.username = email;
    }

    const clinicPayload = {};
    const clinicId = Number(byId("clinicId")?.value || 0);

    if (currentClinic && clinicId) {
      const clinicName = (byId("clinicName")?.value || "").trim();
      const clinicPhone = (byId("clinicPhone")?.value || "").trim();
      const clinicEmail = (byId("clinicEmail")?.value || "").trim();
      const clinicAddress = buildAddress({
        line1: byId("clinicAddr1")?.value || "",
        line2: byId("clinicAddr2")?.value || "",
        city: byId("clinicCity")?.value || "",
        postcode: byId("clinicPostcode")?.value || "",
      });

      if ((currentClinic.clinic_name || "") !== clinicName)
        clinicPayload.clinic_name = clinicName;
      if ((currentClinic.phone || "") !== clinicPhone)
        clinicPayload.phone = clinicPhone || null;
      if ((currentClinic.email || "") !== clinicEmail)
        clinicPayload.email = clinicEmail || null;
      if ((currentClinic.address || "") !== clinicAddress)
        clinicPayload.address = clinicAddress || null;
    }

    if (
      !Object.keys(userPayload).length &&
      !Object.keys(clinicPayload).length
    ) {
      showStatus("There are no changes to save.", "info");
      return;
    }

    const originalText = saveBtn ? saveBtn.textContent : "SAVE";
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "SAVING...";
    }

    try {
      if (Object.keys(clinicPayload).length && clinicId) {
        await RX.api.put(`/clinics/update/${clinicId}`, clinicPayload);
      }

      if (Object.keys(userPayload).length) {
        const result = await RX.api.put("/users/me", userPayload);
        showStatus(
          result.message || "Profile updated. Please log in again.",
          "success",
        );

        setTimeout(() => {
          RX.clearSession();
          window.location.href = "./login.html";
        }, 1200);
        return;
      }

      showStatus("Clinic information updated successfully.", "success");
      currentClinic = { ...(currentClinic || {}), ...clinicPayload };
    } catch (err) {
      console.error(err);
      showStatus(err.message || "Failed to save profile.", "error");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    }
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveProfile);
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      RX.clearSession();
      window.location.href = "./login.html";
    });
  }

  loadProfile();
});
