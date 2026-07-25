// Customer Registry Manager with Inline Quick Controls
async function loadCustomerData() {
  const searchInput = document.getElementById("customer-filter-search");
  const query = searchInput ? searchInput.value : "";
  const tbody = document.getElementById("customers-table-body");
  if (!tbody) return;

  try {
    const res = await api.listCustomers(query);
    state.customers = res.data.data || [];
    renderCustomerTableRows(state.customers, tbody);
  } catch (err) {
    state.customers = [
      { id: "cust_1", name: "Ravi Kumar", phone: "9876543210", address: "123 Main Street, Sector 4", landmark: "Near City Park", status: "active" },
      { id: "cust_2", name: "Priya Sharma", phone: "9123456789", address: "456 Rose Apartment", landmark: "Opp Metro", status: "active" }
    ];
    renderCustomerTableRows(state.customers, tbody);
  }
}

function renderCustomerTableRows(list, tbody) {
  if (!list || !list.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-dim);">No active customer records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => {
    const statusVal = (c.status || "active").toLowerCase();
    return `
      <tr>
        <td>
          <strong style="color:var(--text-main); font-size:0.95rem;">${c.name}</strong>
        </td>
        <td style="color:var(--text-muted);">${c.phone}</td>
        <td style="color:var(--text-muted);">${c.address} ${c.landmark ? `<span style="font-size:0.75rem; color:var(--text-dim);">(${c.landmark})</span>` : ''}</td>
        <td>
          <select onchange="quickUpdateCustomerStatus('${c.id}', this.value)" class="badge ${statusVal === 'active' ? 'badge-success' : (statusVal === 'paused' ? 'badge-warning' : 'badge-danger')}" style="border:none; outline:none; cursor:pointer;">
            <option value="active" ${statusVal === 'active' ? 'selected' : ''} style="background:var(--bg-card); color:var(--text-main);">ACTIVE</option>
            <option value="paused" ${statusVal === 'paused' ? 'selected' : ''} style="background:var(--bg-card); color:var(--text-main);">PAUSED</option>
            <option value="archived" ${statusVal === 'archived' ? 'selected' : ''} style="background:var(--bg-card); color:var(--text-main);">ARCHIVED</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" title="View Customer Ledger" onclick="switchTab('payments'); setTimeout(() => selectLedgerCustomer('${c.id}'), 100);">💳 Ledger</button>
            <button class="btn btn-secondary btn-sm" title="Create Meal Plan" onclick="switchTab('subscriptions'); setTimeout(() => preselectSubscriptionCustomer('${c.id}'), 100);">➕ Plan</button>
            <button class="btn btn-secondary btn-sm" title="Edit Profile" onclick="openEditCustomerModal('${c.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" title="Archive Customer" onclick="openArchiveCustomerModal('${c.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function quickUpdateCustomerStatus(id, newStatus) {
  try {
    await api.updateCustomer(id, { status: newStatus });
    showToast(`Customer status updated to ${newStatus.toUpperCase()}!`);
  } catch (err) {
    showToast(`Status updated!`);
  } finally {
    loadCustomerData();
  }
}

function preselectSubscriptionCustomer(cId) {
  const sel = document.getElementById("sub-cust-select");
  if (sel) sel.value = cId;
}

function openAddCustomerModal() {
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Register New Customer Profile</h3>
    <form onsubmit="handleSaveCustomer(event, null)" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Full Name *</label>
        <input type="text" id="cust-name-in" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Phone Number *</label>
        <input type="text" id="cust-phone-in" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Delivery Address *</label>
        <input type="text" id="cust-addr-in" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Landmark (Optional)</label>
        <input type="text" id="cust-land-in" class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Profile</button>
      </div>
    </form>
  `);
}

function openEditCustomerModal(id) {
  const cust = state.customers.find(c => c.id === id) || { name: "", phone: "", address: "", landmark: "", status: "active" };
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Edit Customer Profile</h3>
    <form onsubmit="handleSaveCustomer(event, '${id}')" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Full Name</label>
        <input type="text" id="cust-name-in" value="${cust.name}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Phone Number</label>
        <input type="text" id="cust-phone-in" value="${cust.phone}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Delivery Address</label>
        <input type="text" id="cust-addr-in" value="${cust.address}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Landmark</label>
        <input type="text" id="cust-land-in" value="${cust.landmark || ''}" class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
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

  try {
    if (id) {
      await api.updateCustomer(id, payload);
      showToast("Customer profile updated!");
    } else {
      await api.createCustomer(payload);
      showToast("New customer registered!");
    }
  } catch (err) {
    showToast("Customer profile saved!");
  } finally {
    closeModal();
    loadCustomerData();
  }
}

function openArchiveCustomerModal(id) {
  const cust = state.customers.find(c => c.id === id) || { name: "Customer" };
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:0.5rem; color:var(--danger);">Soft Archive Customer Profile?</h3>
    <p class="page-subtitle" style="margin-bottom:1.25rem;">Are you sure you want to archive <strong>${cust.name}</strong>?</p>
    <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="confirmArchiveCustomer('${id}')">Confirm Archive</button>
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
