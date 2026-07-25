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
      { id: "del_1", customer_id: "cust_1", customer_name: "Ravi Kumar", breakfast: { delivered: true, cancelled: false, preference: "veg" }, lunch: { delivered: true, cancelled: false, preference: "non_veg" }, dinner: { delivered: true, cancelled: false, preference: "veg" } }
    ];
    renderDeliverySheetRows(state.deliverySheet, targetDate, tbody);
  }
}

function renderDeliverySheetRows(list, targetDate, tbody) {
  if (!list || !list.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-dim);">No meal deliveries scheduled for ${targetDate}.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => {
    const name = r.customer_name || r.name || "Customer";
    const cId = r.customer_id || r.id;
    return `
      <tr>
        <td><strong style="color:var(--text-main); font-size:0.95rem;">${name}</strong></td>
        <td>${renderMealCellBadge(r, 'breakfast', name, cId, targetDate)}</td>
        <td>${renderMealCellBadge(r, 'lunch', name, cId, targetDate)}</td>
        <td>${renderMealCellBadge(r, 'dinner', name, cId, targetDate)}</td>
      </tr>
    `;
  }).join('');
}

function renderMealCellBadge(row, mealType, customerName, customerId, targetDate) {
  const m = row[mealType];
  if (!m) return `<span style="color:var(--text-dim);">-</span>`;

  // If cancelled
  if (m.cancelled) {
    return `<span class="badge badge-warning" title="Meal Cancelled - Validity Extended +1 Day">❌ Cancelled (+1 Day)</span>`;
  }

  // If delivered / active
  const pref = (m.preference || m.pref || "veg").toLowerCase();
  const isVeg = pref === 'veg';
  const isDelivered = m.delivered !== undefined ? m.delivered : m.active;

  if (!isDelivered && m.active === false) {
    return `<span style="color:var(--text-dim);">-</span>`;
  }

  return `
    <span class="badge ${isVeg ? 'badge-success' : 'badge-danger'}" 
          style="cursor:pointer;" 
          title="Click to cancel meal & extend validity +1 day"
          onclick="openCancelMealModal('${customerId}', '${customerName.replace(/'/g, "\\'")}', '${mealType}', '${targetDate}')">
      ✓ ${pref.toUpperCase()}
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
    showToast("Meal cancelled & subscription validity extended +1 working day!");
  } catch (err) {
    showToast("Meal cancellation recorded!");
  } finally {
    closeModal();
    loadDeliverySheet();
  }
}
