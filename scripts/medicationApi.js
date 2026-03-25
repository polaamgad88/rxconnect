document.addEventListener('DOMContentLoaded', async () => {
    const resultsDiv = document.getElementById('medication-results');
    resultsDiv.innerHTML = '<p style="text-align:center;">Loading UK Medication Registry...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/medicines-all');
        const medicines = await response.json();

        resultsDiv.innerHTML = ''; // مسح رسالة التحميل

        // عرض كل دواء في كارت منفصل
        medicines.forEach(med => {
            resultsDiv.innerHTML += `
                <div class="highlight-card" style="grid-template-columns: 1fr; border-left: 5px solid #b0732b; padding: 20px; margin-bottom: 15px;">
                    <h3 style="color:#2b2927; margin:0;">${med.name}</h3>
                    <p style="font-size: 14px; color: var(--text-soft); margin: 10px 0;">Official BNF Code: ${med.id}</p>
                    <a href="https://openprescribing.net/chemical/${med.id.substring(0,9)}" target="_blank" class="nav-link" style="color:#b0732b; font-weight:bold; font-size:13px;">
                        View Analysis <i class="fa-solid fa-chart-line"></i>
                    </a>
                </div>`;
        });
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color:red;">Failed to load medicines. Please ensure server.js is running.</p>';
    }
});