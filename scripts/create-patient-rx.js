// scripts/create-patient-rx.js
document.addEventListener("DOMContentLoaded", function () {
  const user = RX.requireAuth(["clinician", "clinic"]);
  if (!user) return;

  const form = document.getElementById("createPatientForm");
  if (!form) return;

  function buildRedirect(patientId) {
    const ref = String(document.referrer || "").toLowerCase();

    sessionStorage.setItem("rx_selected_patient_id", String(patientId));
    sessionStorage.setItem("patient_history_patient_id", String(patientId));

    if (ref.includes("dr-form.html")) {
      return `./dr-form.html?patient_id=${encodeURIComponent(patientId)}`;
    }

    return `./patient-history.html?patient_id=${encodeURIComponent(patientId)}`;
  }

  async function saveForClinician(patientId) {
    if (user.login_type !== "clinician") return;
    await RX.api.post("/clinicians/me/saved-patients", {
      patient_id: patientId,
    });
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const first_name = (
      document.getElementById("firstName")?.value || ""
    ).trim();
    const last_name = (document.getElementById("lastName")?.value || "").trim();
    const gender = document.getElementById("gender")?.value || null;
    const phone = (document.getElementById("phone")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const national_id = (
      document.getElementById("nhsNumber")?.value || ""
    ).trim();
    const date_of_birth = document.getElementById("dob")?.value || "";

    const address1 = (document.getElementById("address1")?.value || "").trim();
    const address2 = (document.getElementById("address2")?.value || "").trim();
    const city = (document.getElementById("city")?.value || "").trim();
    const postcode = (document.getElementById("postcode")?.value || "").trim();
    const country = (document.getElementById("country")?.value || "").trim();

    if (!first_name || !last_name || !date_of_birth) {
      alert("First name, last name and date of birth are required.");
      return;
    }

    const notesParts = [];
    if (address1) notesParts.push(address1);
    if (address2) notesParts.push(address2);
    if (city) notesParts.push(city);
    if (postcode) notesParts.push(postcode);
    if (country) notesParts.push(country);
    const notes = notesParts.length
      ? `Address: ${notesParts.join(", ")}`
      : null;

    try {
      const resp = await RX.api.post("/patients/create", {
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        national_id,
        notes,
      });

      const patientId = Number(resp.patient_id);
      if (!patientId) {
        throw new Error("Patient was created but no patient_id was returned.");
      }

      await saveForClinician(patientId);

      alert("Patient created successfully.");
      window.location.href = buildRedirect(patientId);
    } catch (err) {
      alert(err.message || "Failed to create patient");
    }
  });
});
