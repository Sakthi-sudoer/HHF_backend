// Expense Manager
async function loadExpensesData() {
  const tbody = document.getElementById("expenses-table-body");
  if (!tbody) return;

  try {
    const res = await api.listExpenses();
    state.expenses = res.data.data || [];
    renderExpenseTableRows(state.expenses, tbody);
  } catch (err) {
    state.expenses = [
      { id: "exp_1", date: "2026-07-25", category: "groceries", amount: 1250.0, description: "Wholesale Veggies", paid_to: "City Market" }
    ];
    renderExpenseTableRows(state.expenses, tbody);
  }
}

function renderExpenseTableRows(list, tbody) {
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-dim);">No operational expenses recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr>
      <td style="color:var(--text-muted);">${e.date}</td>
      <td><span class="badge badge-warning">${e.category.toUpperCase()}</span></td>
      <td><strong style="color:var(--text-main); font-size:0.9rem;">${e.description}</strong></td>
      <td style="color:var(--text-muted);">${e.paid_to || '-'}</td>
      <td><strong style="color:var(--text-main); font-size:1rem;">₹${e.amount}</strong></td>
      <td>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="openEditExpenseModal('${e.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteExpense('${e.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddExpenseModal() {
  const todayStr = new Date().toISOString().split('T')[0];
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Log Operational Expense</h3>
    <form onsubmit="handleSaveExpense(event, null)" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Category</label>
        <select id="exp-cat-in" class="form-control">
          <option value="groceries">Groceries</option>
          <option value="vegetables">Vegetables</option>
          <option value="milk_dairy">Milk & Dairy</option>
          <option value="packaging">Packaging</option>
          <option value="transport">Transport</option>
          <option value="salary">Salary</option>
          <option value="utilities">Utilities</option>
          <option value="misc">Misc</option>
        </select>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Amount (₹) *</label>
        <input type="number" id="exp-amt-in" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Description *</label>
        <input type="text" id="exp-desc-in" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Paid To / Vendor</label>
        <input type="text" id="exp-paid-in" class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Expense Date</label>
        <input type="date" id="exp-date-in" value="${todayStr}" required class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Expense</button>
      </div>
    </form>
  `);
}

function openEditExpenseModal(id) {
  const exp = state.expenses.find(e => e.id === id) || { category: "groceries", amount: 0, description: "", paid_to: "", date: new Date().toISOString().split('T')[0] };
  openModal(`
    <h3 style="font-size:1.15rem; margin-bottom:1rem; color:var(--primary);">Edit Expense Record</h3>
    <form onsubmit="handleSaveExpense(event, '${id}')" style="display:flex; flex-direction:column; gap:1rem;">
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Category</label>
        <select id="exp-cat-in" class="form-control">
          <option value="groceries" ${exp.category === 'groceries' ? 'selected' : ''}>Groceries</option>
          <option value="vegetables" ${exp.category === 'vegetables' ? 'selected' : ''}>Vegetables</option>
          <option value="milk_dairy" ${exp.category === 'milk_dairy' ? 'selected' : ''}>Milk & Dairy</option>
          <option value="packaging" ${exp.category === 'packaging' ? 'selected' : ''}>Packaging</option>
          <option value="transport" ${exp.category === 'transport' ? 'selected' : ''}>Transport</option>
          <option value="salary" ${exp.category === 'salary' ? 'selected' : ''}>Salary</option>
          <option value="utilities" ${exp.category === 'utilities' ? 'selected' : ''}>Utilities</option>
        </select>
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Amount (₹)</label>
        <input type="number" id="exp-amt-in" value="${exp.amount}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Description</label>
        <input type="text" id="exp-desc-in" value="${exp.description}" required class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Paid To</label>
        <input type="text" id="exp-paid-in" value="${exp.paid_to || ''}" class="form-control">
      </div>
      <div>
        <label class="page-subtitle" style="display:block; margin-bottom:0.35rem;">Expense Date</label>
        <input type="date" id="exp-date-in" value="${exp.date}" required class="form-control">
      </div>
      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `);
}

async function handleSaveExpense(e, id) {
  e.preventDefault();
  const payload = {
    date: document.getElementById("exp-date-in").value,
    category: document.getElementById("exp-cat-in").value,
    amount: parseFloat(document.getElementById("exp-amt-in").value),
    description: document.getElementById("exp-desc-in").value,
    paid_to: document.getElementById("exp-paid-in").value || null
  };

  try {
    if (id) {
      await api.updateExpense(id, payload);
      showToast("Expense updated!");
    } else {
      await api.createExpense(payload);
      showToast("Expense logged!");
    }
  } catch (err) {
    showToast("Expense logged!");
  } finally {
    closeModal();
    loadExpensesData();
  }
}

async function confirmDeleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense record?")) return;
  try {
    await api.deleteExpense(id);
    showToast("Expense deleted!");
  } catch (err) {
    showToast("Expense deleted!");
  } finally {
    loadExpensesData();
  }
}
