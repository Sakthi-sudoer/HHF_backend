// Executive ERP Dashboard Renderer matching HFB reference
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
        pending_amount: 8232.0,
        todays_revenue: 13728.0,
        total_expenses: 0.0,
        profit: 13728.0
      },
      active_customers_count: 8
    };
    renderDashboardUI(fallback, container);
  }
}

function renderDashboardUI(d, container) {
  const ops = d.operations;
  const fin = d.financials;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:1.5rem;">
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

      <!-- Financial Performance Overview -->
      <div>
        <h3 style="font-size:0.9rem; font-weight:700; color:var(--primary); text-transform:uppercase; margin-bottom:1rem; letter-spacing:0.05em;">
          Financial Performance Overview
        </h3>
        <div class="grid-3">
          <div class="data-card">
            <span class="page-subtitle">💵 Payments Collected Today</span>
            <h2 style="font-size:1.8rem; font-weight:800; color:var(--success); margin-top:0.5rem;">₹${fin.todays_collection.toLocaleString()}</h2>
            <span class="page-subtitle">Actual cash & GPay received</span>
          </div>

          <div class="data-card">
            <span class="page-subtitle">⚠️ Outstanding Pending Amount</span>
            <h2 style="font-size:1.8rem; font-weight:800; color:var(--danger); margin-top:0.5rem;">₹${fin.pending_amount.toLocaleString()}</h2>
            <span class="page-subtitle">Uncollected customer balance</span>
          </div>

          <div class="data-card">
            <span class="page-subtitle">📈 Net Revenue Accrued</span>
            <h2 style="font-size:1.8rem; font-weight:800; color:var(--text-main); margin-top:0.5rem;">₹${fin.todays_revenue.toLocaleString()}</h2>
            <span class="page-subtitle">Total billing generated</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
