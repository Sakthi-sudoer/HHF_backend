// Advanced Reports & Analytics Manager
async function loadReportsData() {
  const startDate = document.getElementById("report-start-date")?.value || "";
  const endDate = document.getElementById("report-end-date")?.value || "";
  const paymentStatus = document.getElementById("report-pay-status-filter")?.value || "";
  const paymentMode = document.getElementById("report-pay-mode-filter")?.value || "";

  const container = document.getElementById("reports-data-container");
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:0.5rem;">Loading financial & subscription analytics...</p></div>`;

  try {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (paymentStatus) params.payment_status = paymentStatus;
    if (paymentMode) params.payment_mode = paymentMode;

    const res = await api.getReports(params);
    const data = res.data.data;
    renderReportsView(data, container);
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--danger);">Failed to load report analytics. Please ensure backend is running.</div>`;
  }
}

function renderReportsView(data, container) {
  const summary = data.summary || {};
  const invoices = data.invoices || [];
  const collections = data.collections || [];
  const outstanding = data.outstanding || [];
  const modes = data.payment_modes || [];
  const monthly = data.monthly_revenue || [];

  container.innerHTML = `
    <!-- Executive Reports Metric Cards -->
    <div class="grid-4" style="margin-bottom:1.5rem;">
      <div class="data-card" style="border-left:4px solid var(--primary);">
        <p class="page-subtitle">Total Revenue</p>
        <h3 style="font-size:1.4rem; color:var(--primary);">₹${(summary.total_revenue || 0).toLocaleString()}</h3>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">${summary.invoices_count || 0} Invoices Issued</p>
      </div>

      <div class="data-card" style="border-left:4px solid var(--success);">
        <p class="page-subtitle">Total Collections</p>
        <h3 style="font-size:1.4rem; color:var(--success);">₹${(summary.total_collections || 0).toLocaleString()}</h3>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">${summary.payments_count || 0} Payments Received</p>
      </div>

      <div class="data-card" style="border-left:4px solid var(--danger);">
        <p class="page-subtitle">Total Outstanding</p>
        <h3 style="font-size:1.4rem; color:var(--danger);">₹${(summary.total_outstanding || 0).toLocaleString()}</h3>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Uncollected Customer Balance</p>
      </div>

      <div class="data-card" style="border-left:4px solid var(--secondary);">
        <p class="page-subtitle">Net Operating Profit</p>
        <h3 style="font-size:1.4rem; color:var(--secondary);">₹${(summary.net_profit || 0).toLocaleString()}</h3>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Expenses: ₹${(summary.total_expenses || 0).toLocaleString()}</p>
      </div>
    </div>

    <!-- Monthly Revenue & Profit Breakdown -->
    <div class="data-card" style="margin-bottom:1.5rem;">
      <h3 style="font-size:1.1rem; margin-bottom:1rem; color:var(--text-main);"><i class="fas fa-chart-line" style="color:var(--primary);"></i> Monthly Financial Breakdown</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue (₹)</th>
              <th>Collections (₹)</th>
              <th>Expenses (₹)</th>
              <th>Net Profit (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${monthly.length ? monthly.map(m => `
              <tr>
                <td><strong>${m.month}</strong></td>
                <td>₹${m.total_revenue.toLocaleString()}</td>
                <td style="color:var(--success);">₹${m.total_collected.toLocaleString()}</td>
                <td style="color:var(--danger);">₹${m.total_expenses.toLocaleString()}</td>
                <td><strong style="color:${m.net_profit >= 0 ? 'var(--success)' : 'var(--danger)'};">₹${m.net_profit.toLocaleString()}</strong></td>
              </tr>
            `).join('') : `<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--text-dim);">No monthly financial data found.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Outstanding Customer Balances -->
    <div class="data-card">
      <div class="data-card-header">
        <h3 style="font-size:1.1rem; color:var(--text-main);"><i class="fas fa-file-invoice-dollar" style="color:var(--danger);"></i> Customer Outstanding Ledger Report</h3>
        <button class="btn btn-secondary btn-sm" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button>
      </div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Invoiced (₹)</th>
              <th>Paid (₹)</th>
              <th>Outstanding (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${outstanding.length ? outstanding.map(o => `
              <tr>
                <td><strong>${o.customer_name}</strong></td>
                <td>${o.customer_phone}</td>
                <td>₹${o.total_invoiced.toLocaleString()}</td>
                <td style="color:var(--success);">₹${o.total_paid.toLocaleString()}</td>
                <td><strong style="color:var(--danger);">₹${o.outstanding_balance.toLocaleString()}</strong></td>
                <td><span class="badge ${o.payment_status === 'paid' ? 'badge-success' : 'badge-danger'}">${o.payment_status.toUpperCase()}</span></td>
              </tr>
            `).join('') : `<tr><td colspan="6" style="text-align:center; padding:1rem; color:var(--text-dim);">No outstanding customer records.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function exportReportsCSV() {
  api.exportReportsCSV();
}
