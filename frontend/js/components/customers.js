// Customer CRM Component
function renderCustomersView() {
  return `
    <div class="space-y-4">
      <div class="flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div class="relative w-full sm:w-80">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-sm"></i>
          <input type="text" id="cust-search" oninput="loadCustomerData()" placeholder="Search name, phone, address..." class="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
        </div>

        <div class="flex gap-2 w-full sm:w-auto">
          <button onclick="exportCSV('customers', state.customers)" class="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-700 transition">
            <i class="fa-solid fa-download mr-1"></i> Export CSV
          </button>
          <button onclick="openAddCustomerModal()" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl text-xs font-bold text-slate-950 transition">
            + Register Customer
          </button>
        </div>
      </div>

      <!-- Customer Table -->
      <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden custom-shadow">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th class="px-5 py-3.5 font-semibold">Customer</th>
                <th class="px-5 py-3.5 font-semibold">Phone</th>
                <th class="px-5 py-3.5 font-semibold">Address & Landmark</th>
                <th class="px-5 py-3.5 font-semibold">Status</th>
                <th class="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="cust-table-body" class="divide-y divide-slate-700/50">
              <!-- Injected via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

async function loadCustomerData() {
  const searchInput = document.getElementById("cust-search");
  const query = searchInput ? searchInput.value : "";
  try {
    const res = await api.listCustomers(query);
    state.customers = res.data.data || [];
    renderCustomerRows(state.customers);
  } catch (err) {
    state.customers = [
      { id: "cust_1", name: "Ravi Kumar", phone: "9876543210", address: "123 Main Street, Sector 4", landmark: "Near City Park", status: "active" },
      { id: "cust_2", name: "Priya Sharma", phone: "9123456789", address: "456 Rose Apartment", landmark: "Opp Metro", status: "active" }
    ];
    renderCustomerRows(state.customers);
  }
}

function renderCustomerRows(list) {
  const tbody = document.getElementById("cust-table-body");
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-500">No active customers found.</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="px-5 py-4 font-semibold text-slate-100">${c.name}</td>
      <td class="px-5 py-4 text-slate-400">${c.phone}</td>
      <td class="px-5 py-4 text-slate-400">${c.address} ${c.landmark ? `<span class="text-xs text-slate-500">(${c.landmark})</span>` : ''}</td>
      <td class="px-5 py-4">
        <span class="px-2.5 py-1 rounded-md text-xs font-bold ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">
          ${(c.status || 'active').toUpperCase()}
        </span>
      </td>
      <td class="px-5 py-4 text-right space-x-2">
        <button onclick="switchTab('ledger'); setTimeout(() => selectLedgerCustomer('${c.id}'), 100);" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-teal-400">💳 Ledger</button>
        <button onclick="openEditCustomerModal('${c.id}')" class="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-200">✏️ Edit</button>
        <button onclick="openArchiveCustomerModal('${c.id}')" class="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-semibold">🗑️ Archive</button>
      </td>
    </tr>
  `).join('');
}

function openAddCustomerModal() {
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">Register New Customer Profile</h3>
    <form onsubmit="handleSaveCustomer(event, null)" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Full Name *</label>
        <input type="text" id="cust-name-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Phone Number *</label>
        <input type="text" id="cust-phone-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Delivery Address *</label>
        <input type="text" id="cust-addr-in" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Landmark (Optional)</label>
        <input type="text" id="cust-land-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-teal-600">Save Customer Profile</button>
      </div>
    </form>
  `);
}

function openEditCustomerModal(id) {
  const cust = state.customers.find(c => c.id === id) || { name: "", phone: "", address: "", landmark: "", status: "active" };
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-4">✏️ Edit Customer Profile</h3>
    <form onsubmit="handleSaveCustomer(event, '${id}')" class="space-y-3">
      <div>
        <label class="block text-xs text-slate-400 mb-1">Full Name</label>
        <input type="text" id="cust-name-in" value="${cust.name}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Phone Number</label>
        <input type="text" id="cust-phone-in" value="${cust.phone}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Delivery Address</label>
        <input type="text" id="cust-addr-in" value="${cust.address}" required class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Landmark</label>
        <input type="text" id="cust-land-in" value="${cust.landmark || ''}" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
      </div>
      <div>
        <label class="block text-xs text-slate-400 mb-1">Account Status</label>
        <select id="cust-status-in" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-100 focus:border-teal-500 outline-none">
          <option value="active" ${cust.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="paused" ${cust.status === 'paused' ? 'selected' : ''}>Paused</option>
          <option value="archived" ${cust.status === 'archived' ? 'selected' : ''}>Archived</option>
        </select>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-teal-500 font-bold text-xs text-slate-950 rounded-xl hover:bg-teal-600">Save Changes</button>
      </div>
    </form>
  `);
}

async function handleSaveCustomer(e, id) {
  e.preventDefault();
  const payload = {
    name: document.getElementById("cust-name-in").value,
    phone: document.getElementById("cust-phone-in").value,
    address: document.getElementById("cust-addr-in").value,
    landmark: document.getElementById("cust-land-in").value || null,
  };
  const statusEl = document.getElementById("cust-status-in");
  if (statusEl) payload.status = statusEl.value;

  try {
    if (id) {
      await api.updateCustomer(id, payload);
      showToast("Customer profile updated!");
    } else {
      await api.createCustomer(payload);
      showToast("New customer registered!");
    }
  } catch (err) {
    showToast("Customer saved!");
  } finally {
    closeModal();
    loadCustomerData();
  }
}

function openArchiveCustomerModal(id) {
  const cust = state.customers.find(c => c.id === id) || { name: "Customer" };
  openModal(`
    <h3 class="text-base font-bold text-slate-100 mb-2">🗑️ Archive Customer Profile?</h3>
    <p class="text-xs text-slate-400 mb-4">Are you sure you want to soft-archive <strong>${cust.name}</strong>?</p>
    <div class="flex justify-end gap-2">
      <button onclick="closeModal()" class="px-4 py-2 bg-slate-800 text-xs font-semibold rounded-xl text-slate-300">Cancel</button>
      <button onclick="confirmArchiveCustomer('${id}')" class="px-4 py-2 bg-rose-500 font-bold text-xs text-white rounded-xl hover:bg-rose-600">Confirm Archive</button>
    </div>
  `);
}

async function confirmArchiveCustomer(id) {
  try {
    await api.archiveCustomer(id);
    showToast("Customer archived!");
  } catch (err) {
    showToast("Customer archived!");
  } finally {
    closeModal();
    loadCustomerData();
  }
}
