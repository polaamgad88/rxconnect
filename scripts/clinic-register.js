document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("clinicRegisterForm");
  if (!form || !window.RX?.api?.post) return;

  const submitBtn = document.getElementById("c_submit");
  const clearBtn = document.getElementById("c_clear");
  const resultBox = document.getElementById("c_result");

  const byId = (id) => document.getElementById(id);
  const valueOf = (id) => (byId(id)?.value || "").trim();

  function setResult(message, type = "") {
    if (!resultBox) return;
    resultBox.className = `clinic-result ${type}`.trim();
    resultBox.innerHTML = message || "";
    resultBox.style.display = message ? "block" : "none";
  }

  function notify(type, title, message) {
    if (window.RxToast && typeof window.RxToast[type] === "function") {
      window.RxToast[type](title, message);
      return;
    }
    setResult(message || title, type === "error" ? "error" : "success");
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Submitting..." : "Submit Registration";
  }

  function clearForm() {
    [
      "c_clinic_name",
      "c_license_number",
      "c_phone",
      "c_email",
      "c_address",
      "c_full_name",
      "c_password",
      "c_request_notes",
    ].forEach((id) => {
      const el = byId(id);
      if (el) el.value = "";
    });
    setResult("");
  }

  clearBtn?.addEventListener("click", clearForm);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setResult("");

    const clinic_name = valueOf("c_clinic_name");
    const license_number = valueOf("c_license_number") || null;
    const phone = valueOf("c_phone") || null;
    const email = valueOf("c_email");
    const address = valueOf("c_address") || null;
    const full_name = valueOf("c_full_name") || clinic_name;
    const password = byId("c_password")?.value || "";
    const request_notes = valueOf("c_request_notes") || null;

    if (!clinic_name || !email || !password) {
      notify("error", "Missing fields", "Clinic name, email, and password are required.");
      return;
    }

    setSubmitting(true);

    try {
      const resp = await RX.api.post(
        "/clinics/register",
        {
          clinic_name,
          license_number,
          phone,
          email,
          address,
          full_name,
          password,
          request_notes,
        },
        { auth: false }
      );

      notify(
        "success",
        "Registration submitted",
        `Clinic registration submitted. Approval request #${resp.approval_request_id}. Redirecting to login...`
      );

      setResult(
        `Registration submitted for approval.<br>
         clinic_id: <strong>${resp.clinic_id}</strong><br>
         user_id: <strong>${resp.user_id}</strong><br>
         approval_request_id: <strong>${resp.approval_request_id}</strong><br>
         username: <strong>${resp.username}</strong><br>
         Redirecting to login...`,
        "success"
      );

      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1600);
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Registration failed";
      notify("error", "Registration failed", msg);
      setResult(msg, "error");
    } finally {
      setSubmitting(false);
    }
  });
});