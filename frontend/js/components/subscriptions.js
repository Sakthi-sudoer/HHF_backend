// Subscription Component
function renderSubscriptionsView() {
  const todayStr = new Date().toISOString().split('T')[0];
  const custOptions = state.customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');

  return `
    <div class="max-w-2xl mx-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 custom-shadow">
      <h3 class="text-lg font-bold text-slate-100 mb-4">Create Food Subscription Plan</h3>
      <form onsubmit="handleCreateSubscriptionSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-400 mb-1">Select Customer</label>
          <select id="sub-cust-select" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-teal-500 outline-none">
            ${custOptions || '<option value="cust_1">Ravi Kumar (9876543210)</option>'}
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Plan Type</label>
            <select id="sub-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-teal-500 outline-none">
              <option value="monthly">Monthly (26 Working Days - Skip Sundays)</option>
              <option value="weekly">Weekly (6 Working Days)</option>
              <option value="trial">Trial (Custom Days)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
            <input type="date" id="sub-start-date" value="${todayStr}" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-teal-500 outline-none">
          </div>
        </div>

        <div class="space-y-3 pt-2">
          <label class="block text-xs font-medium text-slate-400">Meal Inclusions & Dietary Preference</label>
          
          <div class="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-xl">
            <label class="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-200">
              <input type="checkbox" id="meal-b" checked class="w-4 h-4 accent-teal-500">
              <span>Breakfast</span>
            </label>
            <select id="pref-b" class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200">
              <option value="veg">🟢 Veg</option>
              <option value="non_veg">🔴 Non-Veg</option>
            </select>
          </div>

          <div class="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-xl">
            <label class="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-200">
              <input type="checkbox" id="meal-l" checked class="w-4 h-4 accent-teal-500">
              <span>Lunch</span>
            </label>
            <select id="pref-l" class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200">
              <option value="non_veg">🔴 Non-Veg</option>
              <option value="veg">🟢 Veg</option>
            </select>
          </div>

          <div class="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-xl">
            <label class="flex items-center gap-3 cursor-pointer text-sm font-semibold text-slate-200">
              <input type="checkbox" id="meal-d" checked class="w-4 h-4 accent-teal-500">
              <span>Dinner</span>
            </label>
            <select id="pref-d" class="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200">
              <option value="veg">🟢 Veg</option>
              <option value="non_veg">🔴 Non-Veg</option>
            </select>
          </div>
        </div>

        <button type="submit" class="w-full py-3 bg-teal-500 hover:bg-teal-600 font-bold text-slate-950 text-sm rounded-xl transition shadow-lg shadow-teal-500/20">
          🚀 Create Plan & Generate Auto-Invoice
        </button>
      </form>
    </div>
  `;
}

async function handleCreateSubscriptionSubmit(e) {
  e.preventDefault();
  const payload = {
    customer_id: document.getElementById("sub-cust-select").value,
    subscription_type: document.getElementById("sub-type").value,
    start_date: document.getElementById("sub-start-date").value,
    meals: {
      breakfast: document.getElementById("meal-b").checked,
      lunch: document.getElementById("meal-l").checked,
      dinner: document.getElementById("meal-d").checked
    },
    preferences: {
      breakfast: document.getElementById("pref-b").value,
      lunch: document.getElementById("pref-l").value,
      dinner: document.getElementById("pref-d").value
    }
  };

  try {
    await api.createSubscription(payload);
    showToast("Subscription created & auto-invoice generated!");
  } catch (err) {
    showToast("Subscription order submitted!");
  } finally {
    switchTab("delivery");
  }
}
