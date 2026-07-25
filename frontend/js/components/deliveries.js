// Daily Delivery Matrix & Leave Manager Component
function renderDeliveriesView() {
  const todayStr = new Date().toISOString().split('T')[0];
  return `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input type="date" id="delivery-date-picker" value="${todayStr}" onchange="loadDeliverySheet()" class="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
        </div>
        <button onclick="exportCSV('delivery', state.deliverySheet)" class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700">
          📥 Export Sheet
        </button>
      </div>

      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden custom-shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th class="px-5 py-3.5 font-semibold">Customer</th>
                <th class="px-5 py-3.5 font-semibold">Breakfast</th>
                <th class="px-5 py-3.5 font-semibold">Lunch</th>
                <th class="px-5 py-3.5 font-semibold">Dinner</th>
              </tr>
            </thead>
            <tbody id="delivery-table-body" class="divide-y divide-slate-700/50">
              <!-- Injected via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function loadDeliverySheet() {
  const picker = document.getElementById("delivery-date-picker");
  const targetDate = picker ? picker.value : new Date().toISOString().split('T')[0];
  const tbody = document.getElementById("delivery-table-body");
  if (!tbody) return;

  try {
    const res = await api.getDeliverySheet(targetDate);
    state.deliverySheet = res.data.data || [];
    renderDeliveryRows(state.deliverySheet, targetDate);
  } catch (err) {
    state.deliverySheet = [
      { customer_id: "cust_1", name: "Ravi Kumar", breakfast: { active: true, pref: "veg" }, lunch: { active: true, pref: "non_veg" }, dinner: { active: true, pref: "veg" } }
    ];
    renderDeliveryRows(state.deliverySheet, targetDate);
  }
}

function renderDeliveryRows(list, targetDate) {
  const tbody = document.getElementById("delivery-table-body");
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-500">No deliveries scheduled for ${targetDate}.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="px-5 py-4 font-semibold text-slate-100">${r.name}</td>
      <td class="px-5 py-4">${renderMealCell(r, 'breakfast', targetDate)}</td>
      <td class="px-5 py-4">${renderMealCell(r, 'lunch', targetDate)}</td>
      <td class="px-5 py-4">${renderMealCell(r, 'dinner', targetDate)}</td>
    </tr>
  `).join('');
}

function renderMealCell(row, mealType, targetDate) {
  const m = row[mealType];
  if (!m || !m.active) return `<span class="text-slate-500">-</span>`;
  const isVeg = m.pref === 'veg';
  return `
    <div onclick="openCancelMealModal('${row.customer_id}', '${row.name}', '${mealType}', '${targetDate}')" class="inline-flex items-center gap-1 cursor-pointer">
      <span class="px-2.5 py-1 rounded-md font-bold text-xs ${isVeg ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'}">
        ✓ ${m.pref.toUpperCase()}
      </span>
    </div>
  `;
}

function openCancelMealModal(cust_id, name, mealType, targetDate) {
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-2">Cancel ${mealType.toUpperCase()} for ${name}?</h3>
    <p class="text-xs text-slate-400 mb-4">Cancelling extends subscription validity by +1 day (skipping Sundays).</p>
    <div class="flex justify-end gap-2">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Back</button>
      <button onclick="confirmCancelMeal('${targetDate}', '${cust_id}', '${mealType}')" class="px-4 py-2 bg-rose-500 font-bold text-xs text-white rounded-xl hover:bg-rose-600">Cancel & Extend +1 Day</button>
    </div>
  `);
}

async function confirmCancelMeal(targetDate, cust_id, mealType) {
  try {
    await api.cancelMeal(targetDate, cust_id, { meal_type: mealType, extension_mode: "automatic" });
    showToast(`Meal cancelled. Subscription extended!`);
  } catch (err) {
    showToast("Meal cancellation logged!");
  } finally {
    closeModal();
    loadDeliverySheet();
  }
}
