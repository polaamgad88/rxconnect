// ./scripts/register.js
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  if (!form) return;

  
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.onclick = null;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userType = (document.getElementById("userType")?.value || "").trim();
    const full_name = (document.getElementById("name")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const password = document.getElementById("password")?.value || "";

    if (!userType || !full_name || !email || !password) {
      alert("Please fill name, email, password, and user type.");
      return;
    }

    try {
      if (userType === "doctor") {
        const license_number = (document.getElementById("licenseNumber")?.value || "").trim();
        const specialty = (document.getElementById("specialization")?.value || "").trim();
        const clinicName = (document.getElementById("clinicName")?.value || "").trim(); 

        const payload = {
          email,
          username: email,
          full_name,
          password,
          license_number,
          specialty,
          request_notes: clinicName ? `Requested clinic: ${clinicName}` : null,
        };

        const resp = await RX.api.post("/clinicians/register", payload, { auth: false });
        alert(`Clinician registration submitted. Approval request #${resp.approval_request_id}`);
        window.location.href = "./login.html";
        return;
      }

      if (userType === "pharmacist") {
        const pharmacy_name = (document.getElementById("pharmacyName")?.value || "").trim();
        const license_number = (document.getElementById("pharmacyLicense")?.value || "").trim();
        const address = (document.getElementById("pharmacyAddress")?.value || "").trim();

        const payload = {
          pharmacy_name,
          license_number,
          address,
          email,
          username: email,
          full_name: pharmacy_name || full_name,
          password,
        };
        
        
        const resp = await RX.api.post("/dispensers/create", payload, { auth: false });
        alert(`Dispenser created. ID: ${resp.dispenser_id}`);
        window.location.href = "./login.html";
        return;
      }

      if (userType === "patient") {
        alert("Patient self-registration is not enabled in backend yet.");
        return;
      }

      alert("Unsupported user type.");
    } catch (err) {
      alert(err.message || "Registration failed");
    }
  });
});