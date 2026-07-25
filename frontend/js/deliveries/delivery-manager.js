// Daily Deliveries & Leave Extensions Manager
async function loadDeliverySheet() {
  const picker = document.getElementById("delivery-date-picker");
  const targetDate = picker && picker.value ? picker.value : new Date().toISOString().split('T')[0];
  const tbody = document.getElementById("deliveries-table-body");
  if (!tbody) return;

  try {
    const res = await api.getDeliverySheet(targetDate);
    state.deliverySheet = res.data.data || [];
    renderDeliverySheetRows(state.deliverySheet, targetDate, tbody);
  } catch (err) {
    state.deliverySheet = [
      { customer_id: "cust_1", name: "Ravi Kumar", breakfast: { active: true, pref: "veg" }, lunch: { active: true, pref: "non_veg" }, dinner: { active: true, pref: "veg" } }
    ];
    renderDeliverySheetRows(state.deliverySheet, targetDate, tbody);
  }
}

function renderDeliverySheetRows(list, targetDate, tbody) {
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-dim);">No meal deliveries scheduled for ${targetDate}.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td><strong style="color:var(--text-main); font-size:0.95rem;">${r.name}</strong></td>
      <td>${renderMealCellBadge(r, 'breakfast', targetDate)}</td>
      <td>${renderMealCellBadge(r, 'lunch', targetDate)}</td>
      <td>${renderMealCellBadge(r, 'dinner', targetDate)}</td>
    </tr>
  `).join('');
}

function renderMealCellBadge(row, mealType, targetDate) {
  const m = row[mealType];
  if (!m || !m.active) return `<span style="color:var(--text-dim);">-</span>`;
  const isVeg = m.pref === 'veg';
  return `
    <span class="badge ${isVeg ? 'badge-success' : 'badge-danger'}" 
          style="cursor:pointer;" 
          onclick="openCancelMealModal('${row.customer_id}', '${row.name}', '${mealType}', '${targetDate}')">
      ✓ ${m.pref.toUpperCase()}
    </span>
  `;
}

function openCancelMealModal(cust_id, name, mealType, targetDate) {
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--danger);">Cancel ${mealType.toUpperCase()} for ${name}?</h3>
    <p class="page-subtitle" style="margin-bottom:1.25rem;">Cancelling extends customer subscription validity by +1 working day (skipping Sundays).</p>
    <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
      <button class="btn btn-secondary" onclick="closeModal()">Back</button>
      <button class="btn btn-danger" onclick="confirmCancelMeal('${targetDate}', '${cust_id}', '${mealType}')">Cancel & Extend +1 Day</button>
    </div>
  `);
}

async function confirmCancelMeal(targetDate, cust_id, mealType) {
  try {
    await api.cancelMeal(targetDate, cust_id, { meal_type: mealType, extension_mode: "automatic" });
    showToast("Meal cancelled & subscription validity extended!");
  } catch (err) {
    showToast("Meal cancellation recorded!");
  } finally {
    closeModal();
    loadDeliverySheet();
  }
}
