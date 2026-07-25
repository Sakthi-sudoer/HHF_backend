// Dashboard Component
function renderDashboardView() {
  return `
    <div class="space-y-6">
      <!-- Quick Action Cards -->
      <div class="flex gap-3 overflow-x-auto pb-2">
        <button onclick="switchTab('customers'); setTimeout(openAddCustomerModal, 100);" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 whitespace-nowrap transition">
          <i class="fa-solid fa-user-plus text-teal-400"></i> + Add Customer
        </button>
        <button onclick="switchTab('subscriptions')" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 whitespace-nowrap transition">
          <i class="fa-solid fa-file-signature text-teal-400"></i> + Create Plan
        </button>
        <button onclick="switchTab('ledger'); setTimeout(openPaymentModal, 100);" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 whitespace-nowrap transition">
          <i class="fa-solid fa-money-bill-wave text-emerald-400"></i> + Record Payment
        </button>
        <button onclick="switchTab('expenses'); setTimeout(openAddExpenseModal, 100);" class="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 whitespace-nowrap transition">
          <i class="fa-solid fa-cart-shopping text-amber-400"></i> + Log Expense
        </button>
      </div>

      <!-- Prepared Meals Section -->
      <div>
        <h3 class="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3">Today's Meal Preparation Matrix</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
            <div class="flex justify-between items-start">
              <span class="text-xs font-semibold text-slate-400 uppercase">🥞 Breakfast</span>
              <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">Morning</span>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span id="dash-b-total" class="text-3xl font-extrabold text-slate-100">--</span>
              <span class="text-xs text-slate-400">meals</span>
            </div>
            <div class="mt-3 flex gap-2 text-xs">
              <span id="dash-b-veg" class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Veg: --</span>
              <span id="dash-b-nonveg" class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Non-Veg: --</span>
            </div>
          </div>

          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
            <div class="flex justify-between items-start">
              <span class="text-xs font-semibold text-slate-400 uppercase">🍛 Lunch</span>
              <span class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">Afternoon</span>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span id="dash-l-total" class="text-3xl font-extrabold text-slate-100">--</span>
              <span class="text-xs text-slate-400">meals</span>
            </div>
            <div class="mt-3 flex gap-2 text-xs">
              <span id="dash-l-veg" class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Veg: --</span>
              <span id="dash-l-nonveg" class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Non-Veg: --</span>
            </div>
          </div>

          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
            <div class="flex justify-between items-start">
              <span class="text-xs font-semibold text-slate-400 uppercase">🍲 Dinner</span>
              <span class="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">Night</span>
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span id="dash-d-total" class="text-3xl font-extrabold text-slate-100">--</span>
              <span class="text-xs text-slate-400">meals</span>
            </div>
            <div class="mt-3 flex gap-2 text-xs">
              <span id="dash-d-veg" class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Veg: --</span>
              <span id="dash-d-nonveg" class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Non-Veg: --</span>
            </div>
          </div>

          <div class="bg-gradient-to-br from-teal-900/40 to-emerald-900/40 border border-teal-500/30 rounded-2xl p-5 custom-shadow">
            <span class="text-xs font-semibold text-teal-300 uppercase">🍱 Total Prepared Meals</span>
            <div class="mt-3 flex items-baseline gap-2">
              <span id="dash-grand-total" class="text-3xl font-extrabold text-teal-300">--</span>
              <span class="text-xs text-teal-400 font-medium">today</span>
            </div>
            <p id="dash-cust-count" class="mt-3 text-xs text-slate-300">Loading active customers...</p>
          </div>

        </div>
      </div>

      <!-- Financial Performance Section -->
      <div>
        <h3 class="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3">Financial Performance Overview</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
            <p class="text-xs font-medium text-slate-400">💵 Payments Received Today</p>
            <p id="dash-collected" class="text-2xl font-bold text-emerald-400 mt-2">₹0.00</p>
            <p class="text-xs text-slate-500 mt-1">Actual GPay / Cash collected</p>
          </div>

          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
            <p class="text-xs font-medium text-slate-400">⚠️ Pending Uncollected Balance</p>
            <p id="dash-pending" class="text-2xl font-bold text-rose-400 mt-2">₹0.00</p>
            <p class="text-xs text-slate-500 mt-1">Customer running ledger balance</p>
          </div>

          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
            <p class="text-xs font-medium text-slate-400">📈 Net Invoiced Revenue</p>
            <p id="dash-revenue" class="text-2xl font-bold text-slate-100 mt-2">₹0.00</p>
            <p class="text-xs text-slate-500 mt-1">Total billing generated</p>
          </div>

        </div>
      </div>
    </div>
  `;
}

async function loadDashboardData() {
  try {
    const res = await api.getDashboard("today");
    const d = res.data.data;
    state.dashboardData = d;

    document.getElementById("dash-b-total").innerText = d.operations.breakfast.total;
    document.getElementById("dash-b-veg").innerText = `Veg: ${d.operations.breakfast.veg}`;
    document.getElementById("dash-b-nonveg").innerText = `Non-Veg: ${d.operations.breakfast.non_veg}`;

    document.getElementById("dash-l-total").innerText = d.operations.lunch.total;
    document.getElementById("dash-l-veg").innerText = `Veg: ${d.operations.lunch.veg}`;
    document.getElementById("dash-l-nonveg").innerText = `Non-Veg: ${d.operations.lunch.non_veg}`;

    document.getElementById("dash-d-total").innerText = d.operations.dinner.total;
    document.getElementById("dash-d-veg").innerText = `Veg: ${d.operations.dinner.veg}`;
    document.getElementById("dash-d-nonveg").innerText = `Non-Veg: ${d.operations.dinner.non_veg}`;

    document.getElementById("dash-grand-total").innerText = d.operations.total_meals;
    document.getElementById("dash-cust-count").innerText = `For ${d.active_customers_count} active customers`;

    document.getElementById("dash-collected").innerText = `₹${d.financials.todays_collection.toLocaleString()}`;
    document.getElementById("dash-pending").innerText = `₹${d.financials.pending_amount.toLocaleString()}`;
    document.getElementById("dash-revenue").innerText = `₹${d.financials.todays_revenue.toLocaleString()}`;
  } catch (err) {
    console.warn("Using offline fallback dashboard");
  }
}
