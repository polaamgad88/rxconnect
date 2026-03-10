// scripts/billing-rx.js
document.addEventListener("DOMContentLoaded", function () {
  const user = RX.getUser();
  if (!user || user.login_type !== "managment") {
    // Billing report is management-only in this implementation
    // You can relax this later if you want clinicians to see their own charges.
    const container = document.querySelector(".tokens-container");
    if (container) {
      const msg = document.createElement("div");
      msg.style.margin = "14px 0";
      msg.style.padding = "12px";
      msg.style.background = "#fff";
      msg.style.border = "1px solid #eee";
      msg.style.borderRadius = "10px";
      msg.innerHTML = `<strong>Billing report</strong><div style="margin-top:6px;">This section is available for Management users only.</div>`;
      container.prepend(msg);
    }
    return;
  }

  const container = document.querySelector(".tokens-container");
  if (!container) return;

  // Create UI block
  const block = document.createElement("div");
  block.style.margin = "18px 0";
  block.style.padding = "14px";
  block.style.background = "#fff";
  block.style.border = "1px solid #eee";
  block.style.borderRadius = "12px";
  block.style.boxShadow = "0 6px 18px rgba(0,0,0,.06)";

  // default month = current month
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const defaultMonth = `${yyyy}-${mm}`;

  block.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;">
      <div>
        <h3 style="margin:0 0 6px;">Monthly Invoice Report</h3>
        <div style="color:#666;font-size:13px;">Steps 10/12: Mario/Kero split, Chobham payout, external charges.</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
        <div>
          <label style="font-size:12px;color:#555;">Month (YYYY-MM)</label><br/>
          <input id="billMonth" type="month" value="${defaultMonth}" style="padding:8px;border:1px solid #ddd;border-radius:8px;">
        </div>
        <div>
          <label style="font-size:12px;color:#555;">Free until (optional)</label><br/>
          <input id="freeUntil" type="date" style="padding:8px;border:1px solid #ddd;border-radius:8px;">
        </div>
        <button id="loadBill" type="button" style="padding:10px 14px;border:0;border-radius:10px;background:#0ea5e9;color:#fff;cursor:pointer;">
          Load
        </button>
        <button id="dlCsv" type="button" style="padding:10px 14px;border:1px solid #ddd;border-radius:10px;background:#fff;cursor:pointer;">
          Download CSV
        </button>
      </div>
    </div>

    <div id="billSummary" style="margin-top:14px;"></div>
    <div id="billBreakdown" style="margin-top:14px;"></div>
    <div id="billLines" style="margin-top:14px;overflow:auto;"></div>
  `;

  container.prepend(block);

  const monthEl = document.getElementById("billMonth");
  const freeEl = document.getElementById("freeUntil");
  const loadBtn = document.getElementById("loadBill");
  const dlBtn = document.getElementById("dlCsv");
  const summaryEl = document.getElementById("billSummary");
  const breakdownEl = document.getElementById("billBreakdown");
  const linesEl = document.getElementById("billLines");

  function money(v) {
    const n = Number(v || 0);
    return `£${n.toFixed(2)}`;
  }

  function renderSummary(d) {
    summaryEl.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:180px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="color:#666;font-size:12px;">Total prescriptions</div>
          <div style="font-size:20px;font-weight:700;">${d.total_prescriptions || 0}</div>
        </div>
        <div style="flex:1;min-width:180px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="color:#666;font-size:12px;">Mario total</div>
          <div style="font-size:20px;font-weight:700;">${money(d.mario_total)}</div>
        </div>
        <div style="flex:1;min-width:180px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="color:#666;font-size:12px;">Kero total</div>
          <div style="font-size:20px;font-weight:700;">${money(d.kero_total)}</div>
        </div>
        <div style="flex:1;min-width:180px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="color:#666;font-size:12px;">Chobham payout total</div>
          <div style="font-size:20px;font-weight:700;">${money(d.chobham_payout_total)}</div>
        </div>
        <div style="flex:1;min-width:180px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="color:#666;font-size:12px;">External charges total</div>
          <div style="font-size:20px;font-weight:700;">${money(d.external_charges_total)}</div>
        </div>
      </div>
      ${d.free_until ? `<div style="margin-top:8px;color:#666;font-size:12px;">Free until: ${d.free_until}</div>` : ""}
    `;
  }

  function renderBreakdown(d) {
    const clinics = d.clinic_payouts || [];
    const clinicians = d.clinician_payouts || [];
    const ext = d.external_charges_by_clinician || [];

    breakdownEl.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:280px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="font-weight:700;margin-bottom:8px;">Clinic payouts (Chobham)</div>
          ${clinics.length ? clinics.map(x => `<div style="display:flex;justify-content:space-between;"><span>${x.clinic_name || ("Clinic #" + x.clinic_id)}</span><span>${money(x.amount)} (${x.count})</span></div>`).join("") : `<div style="color:#777;">None</div>`}
        </div>
        <div style="flex:1;min-width:280px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="font-weight:700;margin-bottom:8px;">Clinician payouts (Chobham)</div>
          ${clinicians.length ? clinicians.map(x => `<div style="display:flex;justify-content:space-between;"><span>${x.clinician_name || ("Clinician #" + x.clinician_id)}</span><span>${money(x.amount)} (${x.count})</span></div>`).join("") : `<div style="color:#777;">None</div>`}
        </div>
        <div style="flex:1;min-width:280px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div style="font-weight:700;margin-bottom:8px;">External charges by clinician</div>
          ${ext.length ? ext.map(x => `<div style="display:flex;justify-content:space-between;"><span>${x.clinician_name || ("Clinician #" + x.clinician_id)}</span><span>${money(x.amount)} (${x.count})</span></div>`).join("") : `<div style="color:#777;">None</div>`}
        </div>
      </div>
    `;
  }

  function renderLines(d) {
    const lines = d.line_items || [];
    if (!lines.length) {
      linesEl.innerHTML = `<div style="color:#777;">No line items.</div>`;
      return;
    }

    linesEl.innerHTML = `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">RX Code</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">First dispensed at</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Pharmacy</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Chobham?</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Payout</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">External charge</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Mario</th>
            <th style="text-align:left;padding:10px;border-bottom:1px solid #eee;">Kero</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map(li => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${li.prescription_number || ""}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${li.first_dispensed_at ? new Date(li.first_dispensed_at).toLocaleString() : ""}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${li.dispensed_at_pharmacy || ""}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${li.is_chobham ? "Yes" : "No"}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${money(li.payout_gbp)}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${money(li.external_charge_gbp)}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${money(li.mario_gbp)}</td>
              <td style="padding:10px;border-bottom:1px solid #f3f4f6;">${money(li.kero_gbp)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  async function loadReport() {
    const month = (monthEl.value || "").trim();
    if (!month) return alert("Select a month.");

    const free_until = (freeEl.value || "").trim();
    const qs = new URLSearchParams({ month });
    if (free_until) qs.set("free_until", free_until);

    try {
      const data = await RX.api.get(`/billing/monthly?${qs.toString()}`);
      renderSummary(data);
      renderBreakdown(data);
      renderLines(data);
    } catch (err) {
      alert(err.message || "Failed to load billing report");
    }
  }

  async function downloadCsv() {
    const month = (monthEl.value || "").trim();
    if (!month) return alert("Select a month.");

    const free_until = (freeEl.value || "").trim();
    const qs = new URLSearchParams({ month, format: "csv" });
    if (free_until) qs.set("free_until", free_until);

    try {
      const res = await fetch(`${RX.API_BASE}/billing/monthly?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${RX.getToken()}` }
      });
      if (!res.ok) throw new Error("CSV download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `billing_${month}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "CSV download failed");
    }
  }

  loadBtn.addEventListener("click", loadReport);
  dlBtn.addEventListener("click", downloadCsv);

  // auto load
  loadReport();
});