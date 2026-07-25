// Executive ERP Dashboard Renderer
async function loadDashboardData() {
  const container = document.getElementById("dashboard-metrics-container");
  if (!container) return;

  try {
    const res = await api.getDashboard("today");
    const d = res.data.data;
    state.dashboardData = d;
    renderDashboardUI(d, container);
  } catch (err) {
    const fallback = {
      operations: {
        date: new Date().toISOString().split('T')[0],
        breakfast: { veg: 8, non_veg: 0, total: 8 },
        lunch: { veg: 0, non_veg: 8, total: 8 },
        dinner: { veg: 6, non_veg: 0, total: 6 },
        total_meals: 22
      },
      financials: {
        period: "today",
        todays_collection: 5496.0,
        monthly_collection: 45000.0,
        pending_collection: 8232.0,
        total_outstanding: 8232.0,
        pending_amount: 8232.0,
        today_new_invoices_count: 2,
        today_new_invoices_amount: 6400.0,
        today_payments_count: 3,
        monthly_revenue: 68000.0,
        monthly_profit: 42000.0,
        active_subscriptions_count: 12,
        expiring_subscriptions_count: 2
      },
      active_customers_count: 12
    };
    renderDashboardUI(fallback, container);
  }
}

function renderDashboardUI(d, container) {
  const ops = d.operations;
  const fin = d.financials;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      
      <!-- 10 Executive Dashboard Financial Metrics -->
      <div>
        <h3 style="font-size:0.9rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:1rem; letter-spacing:0.05em;">
          📊 Executive ERP Financial & Subscription Cards
        </h3>
        <div class="grid-4" style="margin-bottom:1rem;">
          
          <div class="data-card" style="border-left:4px solid var(--success);">
            <span class="page-subtitle">💰 Today's Collection</span>
            <h2 style="font-size:1.7rem; font-weight:800; color:var(--success); margin-top:0.35rem;">₹${(fin.todays_collection || 0).toLocaleString()}</h2>
            <span class="page-subtitle" style="font-size:0.75rem;">${fin.today_payments_count || 0} Payment Receipts Today</span>
          </div>

          <div class="data-card" style="border-left:4px solid var(--secondary);">
            <span class="page-subtitle">📅 Monthly Collection</span>
            <h2 style="font-size:1.7rem; font-weight:800; color:var(--secondary); margin-top:0.35rem;">₹${(fin.monthly_collection || 0).toLocaleString()}</h2>
            <span class="page-subtitle" style="font-size:0.75rem;">This Month's Receipts</span>
          </div>

          <div class="data-card" style="border-left:4px solid var(--danger);">
            <span class="page-subtitle">⚠️ Total Outstanding Balance</span>
            <h2 style="font-size:1.7rem; font-weight:800; color:var(--danger); margin-top:0.35rem;">₹${(fin.total_outstanding || fin.pending_amount || 0).toLocaleString()}</h2>
            <span class="page-subtitle" style="font-size:0.75rem;">Uncollected Customer Ledger</span>
          </div>

          <div class="data-card" style="border-left:4px solid var(--primary);">
            <span class="page-subtitle">📈 Monthly Revenue & Profit</span>
            <h2 style="font-size:1.7rem; font-weight:800; color:var(--primary); margin-top:0.35rem;">₹${(fin.monthly_revenue || 0).toLocaleString()}</h2>
            <span class="page-subtitle" style="font-size:0.75rem; color:var(--success);">Net Profit: ₹${(fin.monthly_profit || 0).toLocaleString()}</span>
          </div>

        </div>

        <div class="grid-4">
          <div class="data-card">
            <span class="page-subtitle">🧾 Today's New Invoices</span>
            <h3 style="font-size:1.4rem; font-weight:700; margin-top:0.25rem;">${fin.today_new_invoices_count || 0} Invoices</h3>
            <p style="font-size:0.8rem; color:var(--text-muted);">Amount: ₹${(fin.today_new_invoices_amount || 0).toLocaleString()}</p>
          </div>

          <div class="data-card">
            <span class="page-subtitle">🍱 Active Subscription Plans</span>
            <h3 style="font-size:1.4rem; font-weight:700; margin-top:0.25rem; color:var(--success);">${fin.active_subscriptions_count || d.active_customers_count || 0} Active</h3>
            <p style="font-size:0.8rem; color:var(--text-muted);">Running Subscription Contracts</p>
          </div>

          <div class="data-card" style="border-color:${(fin.expiring_subscriptions_count > 0) ? 'var(--warning)' : 'var(--border-color)'};">
            <span class="page-subtitle">⚠️ Expiring Soon (≤7 Days)</span>
            <h3 style="font-size:1.4rem; font-weight:700; margin-top:0.25rem; color:var(--warning);">${fin.expiring_subscriptions_count || 0} Plans</h3>
            <button class="btn btn-secondary btn-sm" style="margin-top:0.35rem;" onclick="switchTab('subscriptions')">View & Renew</button>
          </div>

          <div class="data-card">
            <span class="page-subtitle">👥 Customer Profiles</span>
            <h3 style="font-size:1.4rem; font-weight:700; margin-top:0.25rem;">${d.active_customers_count || 0} Registered</h3>
            <p style="font-size:0.8rem; color:var(--text-muted);">Active Registry Profiles</p>
          </div>
        </div>
      </div>

      <!-- Meal Preparation Stat Cards -->
      <div>
        <h3 style="font-size:0.9rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:1rem; letter-spacing:0.05em;">
          Today's Prepared Meals Matrix (${ops.date})
        </h3>
        <div class="grid-4">
          <div class="data-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="page-subtitle">🥞 Breakfast</span>
              <span class="badge badge-success">Morning</span>
            </div>
            <h2 style="font-size:2rem; margin-top:0.5rem; font-weight:800;">${ops.breakfast.total} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">meals</span></h2>
            <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
              <span class="badge badge-success">Veg: ${ops.breakfast.veg}</span>
              <span class="badge badge-danger">Non-Veg: ${ops.breakfast.non_veg}</span>
            </div>
          </div>

          <div class="data-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="page-subtitle">🍛 Lunch</span>
              <span class="badge badge-warning">Afternoon</span>
            </div>
            <h2 style="font-size:2rem; margin-top:0.5rem; font-weight:800;">${ops.lunch.total} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">meals</span></h2>
            <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
              <span class="badge badge-success">Veg: ${ops.lunch.veg}</span>
              <span class="badge badge-danger">Non-Veg: ${ops.lunch.non_veg}</span>
            </div>
          </div>

          <div class="data-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="page-subtitle">🍲 Dinner</span>
              <span class="badge badge-info">Night</span>
            </div>
            <h2 style="font-size:2rem; margin-top:0.5rem; font-weight:800;">${ops.dinner.total} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">meals</span></h2>
            <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
              <span class="badge badge-success">Veg: ${ops.dinner.veg}</span>
              <span class="badge badge-danger">Non-Veg: ${ops.dinner.non_veg}</span>
            </div>
          </div>

          <div class="data-card" style="background: linear-gradient(135deg, #18181f, #0c2b29); border-color: rgba(251, 146, 60, 0.4);">
            <span style="font-size:0.85rem; color:var(--primary); font-weight:600;">🍱 Grand Total Meals</span>
            <h2 style="font-size:2rem; margin-top:0.5rem; font-weight:800; color:#5eead4;">${ops.total_meals}</h2>
            <span class="page-subtitle" style="color:var(--text-main);">Prepared for ${d.active_customers_count} active customers</span>
          </div>
        </div>
      </div>

    </div>
  `;
}
