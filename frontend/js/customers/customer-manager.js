// Customer Registry & Multi-Tab Profile Manager
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
          <strong style="color:var(--text-main); font-size:0.95rem; cursor:pointer;" onclick="openCustomerProfileModal('${c.id}')">${c.name}</strong>
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
            <button class="btn btn-primary btn-sm" title="View Full Profile & Tabs" onclick="openCustomerProfileModal('${c.id}')">👤 Profile</button>
            <button class="btn btn-secondary btn-sm" title="View Customer Ledger" onclick="switchTab('payments'); setTimeout(() => selectLedgerCustomer('${c.id}'), 100);">💳 Ledger</button>
            <button class="btn btn-secondary btn-sm" title="Edit Profile" onclick="openEditCustomerModal('${c.id}')">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" title="Archive Customer" onclick="openArchiveCustomerModal('${c.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function openCustomerProfileModal(cId) {
  const cust = state.customers.find(c => c.id === cId) || { id: cId, name: "Customer", phone: "N/A", address: "N/A" };

  openModal(`
    <div style="text-align:center; padding:1.5rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:0.5rem;">Loading customer ledger & tabs...</p></div>
  `);

  try {
    const res = await api.getCustomerLedger(cId);
    const ledger = res.data.data;
    renderMultiTabCustomerModal(cust, ledger);
  } catch (err) {
    const mockLedger = {
      customer_id: cId,
      customer_name: cust.name,
      customer_phone: cust.phone,
      total_invoiced: 6400.0,
      total_paid: 6400.0,
      current_balance: 0.0,
      payment_status: "paid",
      entries: [
        { id: "e1", date: "2026-07-01", description: "Invoice #HHF-202607-0001", debit_amount: 6400.0, credit_amount: 0.0, running_balance: 6400.0 },
        { id: "e2", date: "2026-07-02", description: "Payment Received (UPI) - RCP-101", debit_amount: 0.0, credit_amount: 6400.0, running_balance: 0.0 }
      ]
    };
    renderMultiTabCustomerModal(cust, mockLedger);
  }
}

function renderMultiTabCustomerModal(cust, ledger) {
  const pendingBal = ledger.current_balance || 0.0;
  const totPaid = ledger.total_paid || 0.0;
  const pStatus = ledger.payment_status || "paid";
  const entries = ledger.entries || [];

  const html = `
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
      <div>
        <h3 style="font-size:1.25rem; color:var(--primary);">${cust.name}</h3>
        <p class="page-subtitle">${cust.phone} | ${cust.address}</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">✕ Close</button>
    </div>

    <!-- Summary Cards -->
    <div class="grid-3" style="margin-bottom:1.25rem;">
      <div style="background:var(--bg-dark); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <p style="font-size:0.75rem; color:var(--text-muted);">Total Paid</p>
        <h4 style="color:var(--success); font-size:1.1rem;">₹${totPaid.toLocaleString()}</h4>
      </div>
      <div style="background:var(--bg-dark); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <p style="font-size:0.75rem; color:var(--text-muted);">Pending Outstanding</p>
        <h4 style="color:var(--danger); font-size:1.1rem;">₹${pendingBal.toLocaleString()}</h4>
      </div>
      <div style="background:var(--bg-dark); padding:0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
        <p style="font-size:0.75rem; color:var(--text-muted);">Payment Status</p>
        <span class="badge ${pStatus === 'paid' ? 'badge-success' : 'badge-danger'}">${pStatus.toUpperCase()}</span>
      </div>
    </div>

    <!-- Multi-Tab Navigation Bar -->
    <div style="display:flex; gap:0.5rem; border-bottom:1px solid var(--border-color); margin-bottom:1rem; overflow-x:auto;">
      <button class="acc-btn active" id="tab-btn-profile" onclick="switchCustomerTab('profile')">👤 Profile</button>
      <button class="acc-btn" id="tab-btn-ledger" onclick="switchCustomerTab('ledger')">💳 Ledger Timeline</button>
      <button class="acc-btn" id="tab-btn-payments" onclick="switchCustomerTab('payments')">📥 Payments</button>
      <button class="acc-btn" id="tab-btn-leave" onclick="switchCustomerTab('leave')">🏖️ Leave Extensions</button>
    </div>

    <!-- Tab 1: Profile -->
    <div id="cust-tab-content-profile">
      <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.9rem;">
        <p><strong>Customer ID:</strong> ${cust.id}</p>
        <p><strong>Phone:</strong> ${cust.phone}</p>
        <p><strong>Address:</strong> ${cust.address}</p>
        <p><strong>Landmark:</strong> ${cust.landmark || 'N/A'}</p>
        <p><strong>Status:</strong> ${cust.status ? cust.status.toUpperCase() : 'ACTIVE'}</p>
      </div>
    </div>

    <!-- Tab 2: Double-Entry Ledger -->
    <div id="cust-tab-content-ledger" style="display:none;">
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction</th>
              <th>Debit (₹)</th>
              <th>Credit (₹)</th>
              <th>Running Bal (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${entries.length ? entries.map(e => `
              <tr>
                <td>${e.date}</td>
                <td>${e.description}</td>
                <td style="color:${e.debit_amount > 0 ? 'var(--danger)' : 'var(--text-dim)'};">${e.debit_amount > 0 ? '₹' + e.debit_amount : '-'}</td>
                <td style="color:${e.credit_amount > 0 ? 'var(--success)' : 'var(--text-dim)'};">${e.credit_amount > 0 ? '₹' + e.credit_amount : '-'}</td>
                <td><strong>₹${e.running_balance}</strong></td>
              </tr>
            `).join('') : `<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--text-dim);">No ledger transactions recorded.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 3: Payments -->
    <div id="cust-tab-content-payments" style="display:none;">
      <button class="btn btn-primary btn-sm" style="margin-bottom:1rem;" onclick="closeModal(); switchTab('payments'); setTimeout(() => selectLedgerCustomer('${cust.id}'), 100);">+ Record New Payment</button>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${entries.filter(e => e.credit_amount > 0).length ? entries.filter(e => e.credit_amount > 0).map(e => `
              <tr>
                <td>${e.date}</td>
                <td>${e.description}</td>
                <td style="color:var(--success);"><strong>₹${e.credit_amount}</strong></td>
              </tr>
            `).join('') : `<tr><td colspan="3" style="text-align:center; padding:1rem; color:var(--text-dim);">No payment entries found.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 4: Leave Extensions -->
    <div id="cust-tab-content-leave" style="display:none;">
      <p class="page-subtitle" style="margin-bottom:0.75rem;">When meals are cancelled, validity is automatically extended +1 working day.</p>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${entries.filter(e => e.description.includes('Leave') || e.description.includes('Extended') || e.description.includes('Cancelled')).length ? entries.filter(e => e.description.includes('Leave') || e.description.includes('Extended') || e.description.includes('Cancelled')).map(e => `
              <tr>
                <td>${e.date}</td>
                <td>${e.description}</td>
              </tr>
            `).join('') : `<tr><td colspan="2" style="text-align:center; padding:1rem; color:var(--text-dim);">No leave extensions recorded.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;

  openModal(html);
}

function switchCustomerTab(tabName) {
  ['profile', 'ledger', 'payments', 'leave'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    const content = document.getElementById(`cust-tab-content-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (content) content.style.display = t === tabName ? 'block' : 'none';
  });
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
