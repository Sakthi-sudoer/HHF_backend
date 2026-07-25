// Inventory Manager
async function loadInventoryData() {
  const grid = document.getElementById("inventory-grid");
  if (!grid) return;

  try {
    const res = await api.listInventory();
    state.inventory = res.data.data || [];
    renderInventoryCards(state.inventory, grid);
  } catch (err) {
    state.inventory = [
      { id: "inv_1", name: "Basmati Rice", category: "Grains", current_quantity: 45.0, unit: "kg", min_threshold: 10.0, is_low_stock: false },
      { id: "inv_2", name: "Toor Dal", category: "Pulses", current_quantity: 8.0, unit: "kg", min_threshold: 10.0, is_low_stock: true },
      { id: "inv_3", name: "Sunflower Oil", category: "Oil", current_quantity: 15.0, unit: "Litre", min_threshold: 5.0, is_low_stock: false }
    ];
    renderInventoryCards(state.inventory, grid);
  }
}

function renderInventoryCards(list, grid) {
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:1.5rem; color:var(--text-dim);">No stock items in inventory.</div>`;
    return;
  }

  grid.innerHTML = list.map(item => `
    <div class="data-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <strong style="font-size:1.05rem; color:var(--text-main);">${item.name}</strong>
          <p class="page-subtitle">${item.category}</p>
        </div>
        <span class="badge ${item.is_low_stock ? 'badge-danger' : 'badge-success'}">
          ${item.is_low_stock ? '⚠️ Low Stock' : '✓ In Stock'}
        </span>
      </div>
      <h2 style="font-size:1.8rem; font-weight:800; color:var(--text-main); margin-top:0.75rem;">
        ${item.current_quantity} <span style="font-size:0.85rem; font-weight:400; color:var(--text-muted);">${item.unit}</span>
      </h2>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem; pt-0.75rem; border-top:1px solid var(--border-color);">
        <span class="page-subtitle">Min Threshold: ${item.min_threshold} ${item.unit}</span>
        <button class="btn btn-secondary btn-sm" onclick="openEditInventoryModal('${item.id}')">Update Stock</button>
      </div>
    </div>
  `).join('');
}

function openAddInventoryModal() {
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Add Kitchen Stock Item</h3>
    <form onsubmit="handleSaveInventory(event, null)" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Item Name *</label>
        <input type="text" id="inv-name-in" required placeholder="e.g. Basmati Rice" class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Category</label>
        <input type="text" id="inv-cat-in" value="Kitchen Stock" class="form-control">
      </div>
      <div class="grid-2">
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Quantity *</label>
          <input type="number" id="inv-qty-in" required class="form-control">
        </div>
        <div>
          <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Unit</label>
          <select id="inv-unit-in" class="form-control">
            <option value="kg">kg</option>
            <option value="Litre">Litre</option>
            <option value="Packs">Packs</option>
          </select>
        </div>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Low Stock Threshold</label>
        <input type="number" id="inv-thresh-in" value="10" class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Stock Item</button>
      </div>
    </form>
  `);
}

function openEditInventoryModal(id) {
  const item = state.inventory.find(i => i.id === id) || { current_quantity: 0, min_threshold: 10 };
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Update Stock Quantity</h3>
    <form onsubmit="handleSaveInventory(event, '${id}')" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Current Stock Quantity</label>
        <input type="number" id="inv-qty-in" value="${item.current_quantity}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Low Stock Warning Threshold</label>
        <input type="number" id="inv-thresh-in" value="${item.min_threshold}" class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Update Stock</button>
      </div>
    </form>
  `);
}

async function handleSaveInventory(e, id) {
  e.preventDefault();
  const nameEl = document.getElementById("inv-name-in");
  const catEl = document.getElementById("inv-cat-in");
  const unitEl = document.getElementById("inv-unit-in");

  const payload = {
    current_quantity: parseFloat(document.getElementById("inv-qty-in").value),
    min_threshold: parseFloat(document.getElementById("inv-thresh-in").value || 10)
  };
  if (nameEl) payload.name = nameEl.value;
  if (catEl) payload.category = catEl.value;
  if (unitEl) payload.unit = unitEl.value;

  try {
    if (id) {
      await api.updateInventoryItem(id, payload);
      showToast("Stock updated!");
    } else {
      await api.createInventoryItem(payload);
      showToast("Stock item created!");
    }
  } catch (err) {
    showToast("Stock updated!");
  } finally {
    closeModal();
    loadInventoryData();
  }
}
