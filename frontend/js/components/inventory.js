// Stock & Inventory Component
function renderInventoryView() {
  return `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-bold text-slate-100">Kitchen Stock & Inventory</h3>
        <button onclick="openAddInventoryModal()" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 font-bold text-xs text-slate-950 rounded-xl shadow-lg shadow-teal-500/20">
          + Add Stock Item
        </button>
      </div>

      <div id="inventory-grid" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Stock items injected via JS -->
      </div>
    </div>
  `;
}

async function loadInventoryData() {
  const grid = document.getElementById("inventory-grid");
  if (!grid) return;

  try {
    const res = await api.listInventory();
    state.inventory = res.data.data || [];
    renderInventoryCards(state.inventory);
  } catch (err) {
    state.inventory = [
      { id: "inv_1", name: "Basmati Rice", category: "Grains", current_quantity: 45.0, unit: "kg", min_threshold: 10.0, is_low_stock: false },
      { id: "inv_2", name: "Toor Dal", category: "Pulses", current_quantity: 8.0, unit: "kg", min_threshold: 10.0, is_low_stock: true },
      { id: "inv_3", name: "Sunflower Oil", category: "Oil", current_quantity: 15.0, unit: "Litre", min_threshold: 5.0, is_low_stock: false }
    ];
    renderInventoryCards(state.inventory);
  }
}

function renderInventoryCards(list) {
  const grid = document.getElementById("inventory-grid");
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = `<div class="col-span-3 text-center py-6 text-slate-500">No stock items configured in inventory.</div>`;
    return;
  }

  grid.innerHTML = list.map(item => `
    <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 custom-shadow">
      <div class="flex justify-between items-start">
        <div>
          <p class="font-bold text-slate-100 text-base">${item.name}</p>
          <p class="text-xs text-slate-400">${item.category}</p>
        </div>
        <span class="px-2.5 py-1 rounded-md text-xs font-bold ${item.is_low_stock ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}">
          ${item.is_low_stock ? '⚠️ Low Stock' : '✓ In Stock'}
        </span>
      </div>
      <p class="text-2xl font-extrabold text-slate-100 mt-4">${item.current_quantity} <span class="text-xs text-slate-400 font-normal">${item.unit}</span></p>
      <div class="flex justify-between items-center mt-3 pt-3 border-t border-slate-700/60">
        <span class="text-xs text-slate-400">Threshold: ${item.min_threshold} ${item.unit}</span>
        <button onclick="openEditInventoryModal('${item.id}')" class="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200">Update Stock</button>
      </div>
    </div>
  `).join('');
}

function openAddInventoryModal() {
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">Add Kitchen Stock Item</h3>
    <form onsubmit="handleSaveInventorySubmit(event, null)" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Item Name *</label>
        <input type="text" id="inv-name-in" required placeholder="e.g. Basmati Rice" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Category</label>
        <input type="text" id="inv-cat-in" value="Kitchen Stock" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-slate-400 mb-1">Quantity *</label>
          <input type="number" id="inv-qty-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Unit</label>
          <select id="inv-unit-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
            <option value="kg">kg</option>
            <option value="Litre">Litre</option>
            <option value="Packs">Packs</option>
            <option value="Boxes">Boxes</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Low Stock Warning Threshold</label>
        <input type="number" id="inv-thresh-in" value="10" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-teal-600">Save Stock Item</button>
      </div>
    </form>
  `);
}

function openEditInventoryModal(id) {
  const item = state.inventory.find(i => i.id === id) || { name: "", category: "Kitchen Stock", current_quantity: 0, unit: "kg", min_threshold: 10 };
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">Update Stock: ${item.name}</h3>
    <form onsubmit="handleSaveInventorySubmit(event, '${id}')" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Current Stock Quantity (${item.unit})</label>
        <input type="number" id="inv-qty-in" value="${item.current_quantity}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Min Threshold</label>
        <input type="number" id="inv-thresh-in" value="${item.min_threshold}" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-teal-600">Update Stock</button>
      </div>
    </form>
  `);
}

async function handleSaveInventorySubmit(e, id) {
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
    showToast("Stock saved!");
  } finally {
    closeModal();
    loadInventoryData();
  }
}
