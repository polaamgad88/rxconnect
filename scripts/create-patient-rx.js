// scripts/create-patient-rx.js
document.addEventListener("DOMContentLoaded", function () {
  const user = RX.requireAuth(["clinician", "clinic"]);
  if (!user) return;

  const form = document.getElementById("createPatientForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const first_name = (document.getElementById("firstName")?.value || "").trim();
    const last_name = (document.getElementById("lastName")?.value || "").trim();
    const gender = document.getElementById("gender")?.value || null;
    const phone = (document.getElementById("phone")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const national_id = (document.getElementById("nhsNumber")?.value || "").trim();
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
    const notes = notesParts.length ? `Address: ${notesParts.join(", ")}` : null;

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

      alert(`Patient created successfully. ID: ${resp.patient_id}`);
      sessionStorage.setItem("rx_selected_patient_id", String(resp.patient_id));
      window.location.href = "./dr-form.html";
    } catch (err) {
      alert(err.message || "Failed to create patient");
    }
  });
});